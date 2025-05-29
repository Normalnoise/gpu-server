import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Button, Typography, Form, Input, message, Spin, Result, Tag } from 'antd';
import { LoginOutlined, TeamOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons';
import { verifyInviteToken, acceptInvitation, InvitationData, createInvitation, getActiveInvitations } from '../services/invitationService';

const { Title, Text, Paragraph } = Typography;

// Invitation state types
type InviteState = 'loading' | 'invalid' | 'expired' | 'valid' | 'accepted' | 'error';

// Helper test function - create test invitation
const createTestInvitation = () => {
  const invitation = createInvitation(
    'team-test-123',
    'Test Team',
    'test@example.com',
    'member',
    'admin@example.com'
  );
  console.log('[TEST] Created test invitation:', invitation);
  return invitation.token;
};

// Create expired test invitation
const createExpiredTestInvitation = () => {
  // Create invitation
  const invitation = createInvitation(
    'team-expired-123',
    'Expired Test Team',
    'expired-test@example.com',
    'member',
    'admin@example.com'
  );
  
  // Change expiration time to a past date (yesterday)
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 1);
  invitation.expiresAt = expiredDate;
  
  console.log('[TEST] Created expired test invitation:', invitation);
  console.log('[TEST] Expired date:', expiredDate.toLocaleString());
  
  return invitation.token;
};

const InviteAccept: React.FC = () => {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inviteState, setInviteState] = useState<InviteState>('loading');
  const [inviteInfo, setInviteInfo] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{userId: string, email: string} | null>(null);
  const [form] = Form.useForm();

  console.log('[InviteAccept] Component initialized with token:', inviteToken);

  // Check authentication status and verify invite token on component mount
  useEffect(() => {
    console.log('[InviteAccept] useEffect running with token:', inviteToken);
    
    // Mock authentication check 
    // In a real app, check user auth status from a context or service
    const checkAuth = () => {
      // Simulate auth check
      const mockIsAuthenticated = localStorage.getItem('authenticated') === 'true';
      console.log('[InviteAccept] Auth check:', { isAuthenticated: mockIsAuthenticated });
      
      if (mockIsAuthenticated) {
        const userId = localStorage.getItem('userId') || '';
        const email = localStorage.getItem('userEmail') || '';
        setCurrentUser({ userId, email });
        console.log('[InviteAccept] Current user:', { userId, email });
      }
      
      setIsAuthenticated(mockIsAuthenticated);
      return mockIsAuthenticated;
    };

    const verifyToken = async () => {
      try {
        // Debug help - special token for testing
        if (inviteToken === 'test') {
          console.log('[InviteAccept] Test token detected, creating a new test invitation');
          const testToken = createTestInvitation();
          console.log('[InviteAccept] Redirecting to the real test invitation:', testToken);
          navigate(`/invite/${testToken}`, { replace: true });
          return;
        }
        
        // Test expired invitation
        if (inviteToken === 'expired') {
          console.log('[InviteAccept] Expired test token detected, creating an expired invitation');
          const expiredToken = createExpiredTestInvitation();
          console.log('[InviteAccept] Redirecting to the expired test invitation:', expiredToken);
          navigate(`/invite/${expiredToken}`, { replace: true });
          return;
        }
        
        if (inviteToken === 'debug') {
          console.log('[InviteAccept] Debug token detected, showing all active invitations');
          getActiveInvitations();
          setInviteState('invalid');
          setIsLoading(false);
          return;
        }
        
        if (!inviteToken) {
          console.log('[InviteAccept] No token provided');
          setInviteState('invalid');
          setIsLoading(false);
          return;
        }

        console.log('[InviteAccept] Starting token verification for:', inviteToken);
        setIsLoading(true);
        
        // Verify the invite token using the invitation service
        const invitationData = await verifyInviteToken(inviteToken);
        console.log('[InviteAccept] Verification result:', invitationData);
        
        if (!invitationData) {
          console.log('[InviteAccept] Token verification failed - Invalid token');
          setInviteState('invalid');
          setIsLoading(false);
          return;
        }
        
        // Check if invitation has expired
        const now = new Date();
        if (now > invitationData.expiresAt) {
          console.log('[InviteAccept] Token verification failed - Expired token');
          setInviteInfo(invitationData);
          setInviteState('expired');
          setIsLoading(false);
          return;
        }
        
        console.log('[InviteAccept] Token verified successfully');
        setInviteInfo(invitationData);
        setInviteState('valid');
      } catch (error) {
        console.error('[InviteAccept] Error verifying invite token:', error);
        setInviteState('error');
      } finally {
        setIsLoading(false);
      }
    };

    const isUserAuthenticated = checkAuth();
    verifyToken();
    
    // Save the current URL to redirect back after login
    if (!isUserAuthenticated) {
      console.log('[InviteAccept] User not authenticated, saving redirect URL');
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [inviteToken, location.pathname, navigate]);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      console.log('[InviteAccept] Login attempt with:', values.email);
      setIsLoading(true);
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      localStorage.setItem('authenticated', 'true');
      localStorage.setItem('userId', 'user_123'); // Mock user ID
      localStorage.setItem('userEmail', values.email);
      
      // Set current user
      setCurrentUser({ userId: 'user_123', email: values.email });
      
      console.log('[InviteAccept] Login successful');
      message.success('Logged in successfully');
      setIsAuthenticated(true);
      
      // Reset the form
      form.resetFields();
    } catch (error) {
      console.error('[InviteAccept] Login failed:', error);
      message.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteToken || !inviteInfo) {
      console.error('[InviteAccept] Cannot accept invitation - missing token or info');
      message.error('Invalid invitation');
      return;
    }
    
    try {
      console.log('[InviteAccept] Accepting invitation for team:', inviteInfo.teamName);
      setIsLoading(true);
      
      // Get user ID from localStorage (in a real app, this would come from auth context)
      const userId = localStorage.getItem('userId') || 'user_123';
      console.log('[InviteAccept] Using user ID for acceptance:', userId);
      
      // Accept the invitation using the invitation service
      const result = await acceptInvitation(inviteToken, userId);
      console.log('[InviteAccept] Invitation acceptance result:', result);
      
      if (result.success) {
        setInviteState('accepted');
        message.success(`You've successfully joined ${result.teamName}`);
      } else {
        throw new Error('Failed to accept invitation');
      }
    } catch (error) {
      console.error('[InviteAccept] Error accepting invitation:', error);
      message.error('Failed to accept invitation. Please try again.');
      setInviteState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    console.log('[InviteAccept] Rendering content for state:', inviteState);
    
    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
          <div style={{ marginTop: 24 }}>
            <Text>Verifying invitation...</Text>
          </div>
        </div>
      );
    }

    if (inviteState === 'invalid') {
      return (
        <Result
          status="error"
          title="Invalid Invitation"
          subTitle={
            <div>
              <p>This invitation link is invalid or has been revoked.</p>
              <div style={{ marginTop: '16px', background: 'rgba(255, 77, 79, 0.1)', padding: '12px', borderRadius: '4px' }}>
                <Text style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {window.location.href}
                </Text>
              </div>
            </div>
          }
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/teams')}>
              Go to Teams
            </Button>
          ]}
        />
      );
    }

    if (inviteState === 'expired') {
      return (
        <Result
          status="warning"
          title="Invitation Expired"
          subTitle={
            <div style={{ textAlign: 'left', maxWidth: '90%', margin: '0 auto' }}>
              <div style={{ marginBottom: '20px', background: 'rgba(250, 173, 20, 0.15)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(250, 173, 20, 0.3)' }}>
                <Text strong style={{ color: '#faad14', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  This invitation has expired!
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  Expired on: <strong>{inviteInfo?.expiresAt.toLocaleString()}</strong>
                </Text>
              </div>
              
              <div style={{ fontSize: '16px', color: '#ffffff', lineHeight: '1.6', margin: '20px 0' }}>
                <p style={{ color: '#ffffff' }}>
                  Please contact the team admin to request a new invitation.
                </p>
              </div>
              
              <div style={{ marginTop: '20px', background: 'rgba(0, 0, 0, 0.2)', padding: '12px 16px', borderRadius: '4px', overflowX: 'auto' }}>
                <Text style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'rgba(255, 255, 255, 0.75)' }}>
                  {window.location.href}
                </Text>
              </div>
            </div>
          }
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/teams')}>
              Go to Teams
            </Button>
          ]}
        />
      );
    }

    if (inviteState === 'error') {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="We encountered an error while processing your invitation. Please try again later."
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              Retry
            </Button>,
            <Button key="home" onClick={() => navigate('/teams')}>
              Go to Teams
            </Button>
          ]}
        />
      );
    }

    if (inviteState === 'accepted') {
      return (
        <Result
          status="success"
          icon={<CheckCircleOutlined />}
          title="Invitation Accepted!"
          subTitle={`You are now a member of ${inviteInfo?.teamName}`}
          extra={[
            <Button 
              type="primary" 
              key="team" 
              onClick={() => navigate(`/teams/${inviteInfo?.teamId}`)}
            >
              Go to Team
            </Button>
          ]}
        />
      );
    }

    if (!isAuthenticated) {
      return (
        <div>
          <Title level={4}>Login to Accept Team Invitation</Title>
          <Paragraph>
            You need to login to join <strong>{inviteInfo?.teamName}</strong>
          </Paragraph>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Please enter your email' }]}
              initialValue={inviteInfo?.email}
            >
              <Input placeholder="Enter your email" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<LoginOutlined />}
                loading={isLoading}
                block
              >
                Login to Continue
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary">
              Don't have an account? <a href="/signup">Sign up</a>
            </Text>
          </div>
        </div>
      );
    }

    // User is authenticated and invite is valid
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ margin: '20px 0 40px 0' }}>
          <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </div>
        
        {/* Current User Info */}
        <div style={{ marginBottom: 24, background: 'rgba(24, 144, 255, 0.1)', padding: '8px 16px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: 8 }} />
          <Text>Logged in as: <strong>{currentUser?.email}</strong></Text>
        </div>
        
        <Title level={3}>Team Invitation</Title>
        <Paragraph>
          You've been invited to join the team: <strong>{inviteInfo?.teamName}</strong>
        </Paragraph>
        <Paragraph>
          <Text type="secondary">Invited by: {inviteInfo?.invitedBy}</Text>
        </Paragraph>
        <Paragraph style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Role:</Text>
          <Tag 
            color={inviteInfo?.role === 'admin' ? '#1890ff' : '#52c41a'} 
            style={{ 
              textTransform: 'uppercase', 
              fontSize: '14px', 
              padding: '4px 12px',
              fontWeight: 'bold',
              color: 'white',
              border: inviteInfo?.role === 'admin' ? '1px solid #1890ff' : '1px solid #52c41a',
              background: inviteInfo?.role === 'admin' ? '#1890ff' : '#52c41a'
            }}
          >
            {inviteInfo?.role}
          </Tag>
        </Paragraph>
        
        {inviteInfo?.expiresAt && (
          <Paragraph>
            <Text type="secondary">
              This invitation expires on {inviteInfo.expiresAt.toLocaleDateString()}
            </Text>
          </Paragraph>
        )}
        
        <div style={{ marginTop: 40 }}>
          <Button 
            type="primary" 
            size="large" 
            onClick={handleAcceptInvite}
            loading={isLoading}
          >
            Accept Invitation
          </Button>
          <Button 
            style={{ marginLeft: 16 }} 
            onClick={() => navigate('/teams')}
          >
            Decline
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Col xs={22} sm={18} md={14} lg={10} xl={8}>
        <Card style={{ background: '#141414', border: '1px solid #303030' }}>
          {renderContent()}
        </Card>
      </Col>
    </Row>
  );
};

export default InviteAccept;