import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Form, Input, Select, Radio, Tooltip, Divider, Tag, message, Row, Col, Space } from 'antd';
import { CloudOutlined, InfoCircleOutlined, TeamOutlined, FlagOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Team {
  id: string;
  name: string;
  description: string;
  role: 'owner' | 'admin' | 'member';
}

interface LocationState {
  selectedTeam?: string;
}

// CSS style definition
const createWorkspaceStyles = `
  .storage-ownership-select .ant-select-selection-item {
    display: flex !important;
    align-items: center !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    font-size: 14px !important;
  }
  
  .storage-ownership-select .ant-select-item-option-content {
    white-space: normal !important;
  }
  
  .storage-ownership-select .ant-select-selection-item .ant-tag {
    margin-right: 0 !important;
    margin-left: 8px !important;
  }
  
  .storage-ownership-select.ant-select-focused .ant-select-selector {
    border-color: #1890ff !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
  }
  
  .storage-ownership-select .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: rgba(0, 140, 255, 0.1) !important;
    font-weight: 600 !important;
  }

  .storage-type-card {
    height: 100%;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
    padding: 16px;
    border-radius: 8px;
    background-color: #1f1f1f;
  }
  
  .storage-type-card.selected {
    border-color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }

  .region-card {
    height: 100%;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    background-color: #1f1f1f;
  }
  
  .region-card.selected {
    border-color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }

  .pricing-card {
    height: 100%;
    position: sticky;
    top: 20px;
    background-color: #1f1f1f;
    border-radius: 8px;
    padding: 16px;
  }

  .pricing-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .pricing-label {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
  }

  .pricing-value {
    font-weight: 500;
    color: #ffffff;
    font-size: 14px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #ffffff;
  }

  .section-subtitle {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.75);
    margin-bottom: 8px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .card-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;
  }

  .price-tag {
    font-size: 13px;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: rgba(24, 144, 255, 0.1);
    border: 1px solid rgba(24, 144, 255, 0.3);
    color: #1890ff;
  }
`;

const CreateWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('personal');
  const [selectedStorageType, setSelectedStorageType] = useState<string>('standard');
  const [selectedRegion, setSelectedRegion] = useState<string>('canada');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  
  // Add styles to the page
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = createWorkspaceStyles;
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Load teams on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock data - in a real app, this would come from an API
        const mockTeams: Team[] = [
          { id: '1', name: 'ML Development', description: 'Machine Learning Development Team', role: 'owner' },
          { id: '2', name: 'Research Team', description: 'AI Research Group', role: 'admin' },
          { id: '3', name: 'Production', description: 'Production Environment', role: 'member' },
        ];
        setTeams(mockTeams);
        
        // Check if we have a selected team from navigation state
        const state = location.state as LocationState;
        if (state && state.selectedTeam) {
          setSelectedTeam(state.selectedTeam);
        } else {
          // Default select personal
          setSelectedTeam('personal');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [location.state]);

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) {
      message.error('Please enter a workspace name');
      return;
    }

    // In a real app, this would be an API call
    message.success('Workspace created successfully!');
    navigate('/storage');
  };

  const handleCancel = () => {
    navigate('/storage');
  };

  // Calculate pricing based on selected options
  const getPricing = () => {
    let storagePrice = 0.008; // Default Standard price
    
    if (selectedStorageType === 'performance') {
      storagePrice = 0.015;
    } else if (selectedStorageType === 'accelerated') {
      storagePrice = 0.022;
    }
    
    return {
      storage: storagePrice,
      outgoing: 0.01,
      incoming: 'Included'
    };
  };

  const pricing = getPricing();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          type="text" 
          onClick={handleCancel}
          style={{ marginRight: 16 }}
        />
        <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Create Workspace</Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={18}>
          {/* Ownership Selection */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4} className="section-title">Ownership</Title>
            <Select
              value={selectedTeam}
              onChange={(value) => setSelectedTeam(value)}
              style={{ width: '100%', marginBottom: 16 }}
              dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
              className="storage-ownership-select"
            >
              <Option value="personal">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <span style={{ fontWeight: 600 }}>Personal</span>
                  <Tag color="green" style={{ marginLeft: 8, fontSize: 12 }}>Default</Tag>
                </div>
              </Option>
              <Divider style={{ margin: '8px 0', borderColor: '#303030' }} />
              <Option key="team-label" disabled>
                <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>Team Workspaces:</span>
              </Option>
              {teams.map(team => {
                const hasPermission = team.role === 'owner' || team.role === 'admin';
                const roleColor = team.role === 'owner' ? 'gold' : team.role === 'admin' ? 'blue' : 'green';
                
                return (
                  <Option 
                    key={team.id} 
                    value={team.id} 
                    disabled={!hasPermission}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      <span style={{ fontWeight: 600 }}>{team.name}</span>
                      <Tag color={roleColor} style={{ marginLeft: 8, fontSize: 12 }}>{team.role.toUpperCase()}</Tag>
                    </div>
                  </Option>
                );
              })}
            </Select>
            
            {/* Workspace Name - Moved under Ownership */}
            <div style={{ marginTop: 16 }}>
              <Title level={5} className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Workspace Name</Title>
              <Input 
                placeholder="Enter workspace name" 
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                style={{ 
                  background: '#1f1f1f', 
                  borderColor: '#303030', 
                  color: '#ffffff',
                  height: '40px',
                  fontSize: '15px',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          {/* Storage Type Selection */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4} className="section-title">Storage Type</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div 
                  className={`storage-type-card ${selectedStorageType === 'standard' ? 'selected' : ''}`}
                  onClick={() => setSelectedStorageType('standard')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <CloudOutlined style={{ fontSize: 22, marginRight: 8, color: '#1890ff' }} />
                    <Text strong className="card-title">Standard</Text>
                    <Tag className="price-tag" style={{ marginLeft: 'auto' }}>$0.008/GB/month</Tag>
                  </div>
                  <Paragraph className="card-description">
                    Reliable and durable storage for businesses requiring high-capacity solutions.
                  </Paragraph>
                </div>
              </Col>
              <Col span={8}>
                <div 
                  className={`storage-type-card ${selectedStorageType === 'performance' ? 'selected' : ''}`}
                  onClick={() => setSelectedStorageType('performance')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <CloudOutlined style={{ fontSize: 22, marginRight: 8, color: '#1890ff' }} />
                    <Text strong className="card-title">Performance</Text>
                    <Tag className="price-tag" style={{ marginLeft: 'auto' }}>$0.015/GB/month</Tag>
                  </div>
                  <Paragraph className="card-description">
                    Low-latency storage designed for demanding workloads and frequent access.
                  </Paragraph>
                </div>
              </Col>
              <Col span={8}>
                <div 
                  className={`storage-type-card ${selectedStorageType === 'accelerated' ? 'selected' : ''}`}
                  onClick={() => setSelectedStorageType('accelerated')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <CloudOutlined style={{ fontSize: 22, marginRight: 8, color: '#1890ff' }} />
                    <Text strong className="card-title">Accelerated</Text>
                    <Tag className="price-tag" style={{ marginLeft: 'auto' }}>$0.022/GB/month</Tag>
                  </div>
                  <Paragraph className="card-description">
                    Ultra-fast storage for high-performance and wide-intensive applications.
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </div>

          {/* Location Selection */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4} className="section-title">Location</Title>
            <div style={{ marginBottom: 8 }}>
              <Text className="section-subtitle">All Locations</Text>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div 
                  className={`region-card ${selectedRegion === 'canada' ? 'selected' : ''}`}
                  onClick={() => setSelectedRegion('canada')}
                >
                  <span style={{ fontSize: 24, marginRight: 12 }}>🇨🇦</span>
                  <Text strong className="card-title">Canada</Text>
                </div>
              </Col>
              <Col span={12}>
                <div 
                  className={`region-card ${selectedRegion === 'us' ? 'selected' : ''}`}
                  onClick={() => setSelectedRegion('us')}
                >
                  <span style={{ fontSize: 24, marginRight: 12 }}>🇺🇸</span>
                  <Text strong className="card-title">US</Text>
                </div>
              </Col>
            </Row>
          </div>
        </Col>

        <Col span={6}>
          {/* Pricing Details */}
          <div className="pricing-card">
            <Title level={4} className="section-title">Pricing details</Title>
            <div style={{ marginTop: 16 }}>
              <div className="pricing-row">
                <span className="pricing-label">Data storage</span>
                <span className="pricing-value">${pricing.storage.toFixed(3)}/GB/month</span>
              </div>
              <div className="pricing-row">
                <span className="pricing-label">Outgoing traffic</span>
                <span className="pricing-value">${pricing.outgoing.toFixed(2)}/GB</span>
              </div>
              <div className="pricing-row">
                <span className="pricing-label">Incoming traffic</span>
                <span className="pricing-value">{pricing.incoming}</span>
              </div>
              <Divider style={{ margin: '16px 0', borderColor: '#303030' }} />
              <Text style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.85)', 
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                After creating the workspace, you will be able to create buckets and manage your storage.
              </Text>
              <Button 
                type="primary" 
                block 
                size="large" 
                onClick={handleCreateWorkspace}
                disabled={!workspaceName.trim()}
                style={{ 
                  height: '44px', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  background: '#2468f2',
                  borderColor: '#2468f2',
                  boxShadow: '0 2px 8px rgba(36, 104, 242, 0.3)'
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CreateWorkspace;