import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Form, Select, Tooltip, Divider, Tag } from 'antd';
import { CloudOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Team {
  id: string;
  name: string;
  description: string;
  role: 'owner' | 'admin' | 'member';
}

// CSS style definition
const storageSelectStyles = `
  .storage-ownership-select .ant-select-selection-item {
    display: flex !important;
    align-items: center !important;
    font-weight: bold !important;
    color: #ffffff !important;
    font-size: 16px !important;
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
    font-weight: bold !important;
  }
  
  .personal-option-wrapper {
    background: rgba(0, 140, 255, 0.1) !important;
    border: 1px solid rgba(0, 140, 255, 0.4) !important;
    padding: 8px 12px !important;
    border-radius: 6px !important;
    margin-bottom: 4px !important;
  }
`;

const FirstTimeStorageView: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('personal');

  // Add styles to the page
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = storageSelectStyles;
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
        
        // Default select personal instance
        setSelectedTeam('personal');
        form.setFieldsValue({ team: 'personal' });
        
        console.log('Initialized with team = personal');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [form]);

  return (
    <Card style={{ background: '#141414', border: '1px solid #303030' }}>
      <div className="first-storage-container" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <CloudOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />
        
        <Title level={2} style={{ color: '#ffffff', marginBottom: '16px' }}>
          Start Using Object Storage Service!
        </Title>
        
        <Paragraph style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '600px', margin: '0 auto 32px' }}>
          Create your first object storage bucket for storing and managing machine learning models, datasets, images, videos, or any type of files.
        </Paragraph>
        
        <div style={{ maxWidth: '500px', margin: '0 auto 32px', textAlign: 'left', background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #303030' }}>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: '20px' }}>
            <InfoCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <Text strong style={{ fontSize: '14px' }}>Choose bucket ownership:</Text> By default, the bucket will be created as your <Text strong>personal bucket</Text>. You can also select a team to allow team members to access this bucket.
          </Paragraph>
          
          <Form
            layout="vertical"
            form={form}
            initialValues={{ team: 'personal' }}
          >
            <Form.Item
              label={
                <span style={{ color: '#ffffff' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  Bucket Ownership
                  <Tooltip title="Select who this bucket will belong to">
                    <InfoCircleOutlined style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.45)' }} />
                  </Tooltip>
                </span>
              }
              name="team"
            >
              <Select 
                placeholder="Select ownership" 
                onChange={(value) => setSelectedTeam(value)}
                style={{ width: '100%' }}
                dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
                optionLabelProp="label"
                defaultValue="personal"
                value={selectedTeam}
                listHeight={350}
                dropdownMatchSelectWidth={true}
                className="storage-ownership-select"
              >
                <Option 
                  key="personal" 
                  value="personal" 
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '16px' }}>Personal</span>
          <Tag color="green" style={{ marginLeft: '8px', fontSize: '12px' }}>Default</Tag>
                    </div>
                  }
                  className="personal-storage-option"
                >
                  <div className="personal-option-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Personal</span>
                      <div>
                        <Tag color="cyan" style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '4px' }}>Personal</Tag>
            <Tag color="green" style={{ fontSize: '12px' }}>Default</Tag>
                      </div>
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '12px', marginTop: '2px' }}>
                      Private bucket that only you can access and manage
                    </div>
                  </div>
                </Option>
                
                <Divider style={{ margin: '8px 0', borderColor: '#303030' }} />
                
                <Option key="team-label" disabled>
                  <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'bold' }}>Team Buckets:</span>
                </Option>
                {teams.map(team => {
                  const hasPermission = team.role === 'owner' || team.role === 'admin';
                  const roleColor = team.role === 'owner' ? 'gold' : team.role === 'admin' ? 'blue' : 'green';
                  
                  return (
                    <Option 
                      key={team.id} 
                      value={team.id} 
                      disabled={!hasPermission}
                      label={
                        <span>
                          <span>{team.name}</span>
                          <Tag color={roleColor} style={{ marginLeft: '8px' }}>{team.role.toUpperCase()}</Tag>
                        </span>
                      }
                    >
                      <div style={{ 
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        opacity: hasPermission ? 1 : 0.6,
                        background: hasPermission ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
                        border: hasPermission ? 'none' : '1px dashed #555'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{team.name}</span>
                          <div>
                            <Tag color={roleColor} style={{ fontWeight: 'bold' }}>
                              {team.role.toUpperCase()}
                            </Tag>
                            {!hasPermission && (
                              <Tag color="red" style={{ fontSize: '12px' }}>No Permission</Tag>
                            )}
                          </div>
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '12px', marginTop: '2px' }}>
                          Team buckets may be visible or accessible to team members
                        </div>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Form>
        </div>
        
        <Button 
          type="primary" 
          size="large"
          icon={<CloudOutlined />}
          onClick={() => {
            if (selectedTeam === 'personal' || (selectedTeam && teams.find(t => t.id === selectedTeam))) {
              // Navigate to storage page and pass selected team info
              navigate('/storage', { 
                state: { 
                  fromFirstTime: true,
                  selectedTeam,
                  creatingStorage: true  // Explicitly set creating storage bucket state to true
                } 
              });
            }
          }}
          style={{
            height: '48px',
            padding: '0 32px',
            fontSize: '16px',
            borderRadius: '4px'
          }}
          disabled={!selectedTeam}
        >
          Continue Creating Bucket
        </Button>
        
        <Paragraph style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '16px' }}>
          In the next page, you can configure bucket name, region, and access permissions
        </Paragraph>
      </div>
    </Card>
  );
};

export default FirstTimeStorageView;