import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Form, Input, Select, InputNumber, Space, Tooltip, Radio, Divider, Alert, Tag, message } from 'antd';
import { DeploymentUnitOutlined, CloudServerOutlined, InfoCircleOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { createInstance, getTeamInstances, getAllInstances, createMockInstances, InstanceData } from '../services/instanceService';
import InstanceList from '../components/InstanceList';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Team {
  id: string;
  name: string;
  description: string;
  role: 'owner' | 'admin' | 'member';
}

// CSS style definition
const instanceSelectStyles = `
  .instance-ownership-select .ant-select-selection-item {
    display: flex !important;
    align-items: center !important;
    font-weight: bold !important;
    color: #ffffff !important;
    font-size: 16px !important;
  }
  
  .instance-ownership-select .ant-select-item-option-content {
    white-space: normal !important;
  }
  
  .instance-ownership-select .ant-select-selection-item .ant-tag {
    margin-right: 0 !important;
    margin-left: 8px !important;
  }
  
  .instance-ownership-select.ant-select-focused .ant-select-selector {
    border-color: #1890ff !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
  }
  
  .instance-ownership-select .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
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
  
  .change-dropdown .ant-select-selector {
    border-radius: 4px !important;
    background-color: #1a1a1a !important;
    border: 1px solid #303030 !important;
    padding: 0 8px !important;
    height: 32px !important;
    color: #1890ff !important;
    font-weight: 500 !important;
    cursor: pointer !important;
  }
  
  .change-dropdown .ant-select-selection-item {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 600 !important;
    color: #40a9ff !important;
    cursor: pointer !important;
    text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.5) !important;
  }
  
  .change-dropdown:hover .ant-select-selector {
    background-color: #262626 !important;
    border-color: #1890ff !important;
  }
  
  .change-dropdown .ant-select-arrow {
    color: #1890ff !important;
  }
  
  .change-dropdown .ant-select-dropdown {
    background-color: #1f1f1f !important;
    border: 1px solid #303030 !important;
    padding: 4px !important;
    min-width: 200px !important;
  }
  
  .change-dropdown .ant-select-item {
    background-color: transparent !important;
    padding: 8px 12px !important;
    border-radius: 4px !important;
    margin-bottom: 2px !important;
    color: #ffffff !important;
  }
  
  .change-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: rgba(24, 144, 255, 0.1) !important;
  }
  
  .change-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: rgba(24, 144, 255, 0.05) !important;
  }
  
  .change-dropdown .ant-select-item-option-disabled {
    color: rgba(255, 255, 255, 0.45) !important;
    cursor: not-allowed !important;
  }
  
  .change-dropdown .ant-select-item-option-content {
    display: flex !important;
    align-items: center !important;
  }
  
  .change-dropdown .ant-divider {
    margin: 4px 0 !important;
    border-color: #303030 !important;
  }
`;

const Instances: React.FC = () => {
  // Add styles to the page
  useEffect(() => {
    // Add CSS styles to the page
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = instanceSelectStyles;
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [hasInstances, setHasInstances] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedGpuType, setSelectedGpuType] = useState<string>('a100');
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [creatingInstance, setCreatingInstance] = useState<boolean>(
    location.state?.creatingInstance || false
  );
  
  // Handle location state changes
  useEffect(() => {
    if (location.state?.creatingInstance) {
      setCreatingInstance(true);
      // Clear the state to prevent re-triggering on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Mock user information - in a real app, this would come from authentication context
  const [currentUser] = useState({
    email: 'user@example.com',
    name: 'Current User'
  });

  // Add location state
  const [selectedLocation, setSelectedLocation] = useState<string>('us');

  // Load instances across all teams
  const loadInstances = async () => {
    try {
      const allInstances = await getAllInstances();
      setInstances(allInstances);
      setHasInstances(allInstances.length > 0);
    } catch (error) {
      console.error('Error loading instances:', error);
      message.error('Failed to load instances');
    }
  };

  // Load teams and check for existing instances on component mount
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
        
        // Immediately set form values to ensure correct display
        form.setFieldsValue({ team: 'personal' });
        
        // Set default location
        setSelectedLocation('us');
        form.setFieldsValue({ location: 'us' });
        
        console.log('Initialized with team = personal');

        // Create mock instances data for testing, passing current user email
        createMockInstances(currentUser.email);

        // Load all instances
        await loadInstances();
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Failed to load data');
      }
    };
    
    loadData();
  }, [form, currentUser.email]);

  const handleCreateInstance = async (values: any) => {
    setLoading(true);
    try {
      let teamId = values.team;
      let teamName = 'Personal';
      
      // If it's a team instance, get the team details
      if (values.team !== 'personal') {
        const selectedTeamObj = teams.find(t => t.id === values.team);
        
        if (!selectedTeamObj) {
          throw new Error('Selected team not found');
        }
        
        // Check if the user has permission to create instances for this team
        if (selectedTeamObj.role !== 'owner' && selectedTeamObj.role !== 'admin') {
          throw new Error('You do not have permission to create instances for this team');
        }
        
        teamId = selectedTeamObj.id;
        teamName = selectedTeamObj.name;
      } else {
        // Explicitly set the teamId to 'personal' for personal instances
        teamId = 'personal';
      }
      
      // Call createInstance from our service
      const instance = await createInstance(
        values.instance_name,
        teamId,
        teamName,
        currentUser.email,
        values.gpu_type,
        values.gpu_count,
        values.storage_size || 100,
        values.location || 'us'
      );
      
      message.success('Instance creation started successfully!');
      
      // After successful creation, refresh the instances list and exit creation mode
      await loadInstances();
      setCreatingInstance(false);
    } catch (error) {
      console.error('Error creating instance:', error);
      message.error('Failed to create instance: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderGpuOptions = () => {
    const gpuTypes = [
      { 
        value: 'a100', 
        label: 'NVIDIA A100',
        description: '80GB HBM2e memory, 2,039GB/s memory bandwidth',
        pricing: '$1.99/hour',
        specs: {
          memory: '80GB',
          cores: '6,912 CUDA Cores',
          tflops: '312 TFLOPS (FP16)',
          bandwidth: '2,039GB/s'
        }
      },
      { 
        value: 'h100', 
        label: 'NVIDIA H100',
        description: '80GB HBM3 memory, 3,350GB/s memory bandwidth',
        pricing: '$3.49/hour',
        specs: {
          memory: '80GB',
          cores: '16,896 CUDA Cores',
          tflops: '989 TFLOPS (FP16)',
          bandwidth: '3,350GB/s'
        }
      },
      { 
        value: 'l4', 
        label: 'NVIDIA L4',
        description: '24GB GDDR6 memory, 300GB/s memory bandwidth',
        pricing: '$0.59/hour',
        specs: {
          memory: '24GB',
          cores: '7,424 CUDA Cores',
          tflops: '121 TFLOPS (FP16)',
          bandwidth: '300GB/s'
        }
      },
    ];

    return (
      <Radio.Group 
        onChange={(e) => setSelectedGpuType(e.target.value)} 
        value={selectedGpuType}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {gpuTypes.map(gpu => (
            <div key={gpu.value} style={{ width: '100%' }}>
              <Radio value={gpu.value} style={{ width: '100%' }}>
                <Card 
                  style={{ 
                    width: '100%', 
                    borderColor: selectedGpuType === gpu.value ? '#1890ff' : '#303030',
                    background: '#1a1a1a'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>{gpu.label}</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{gpu.description}</Text>
                      </div>
                      <Space style={{ marginTop: '12px' }} wrap>
                        <Tag color="blue">{gpu.specs.memory}</Tag>
                        <Tag color="green">{gpu.specs.cores}</Tag>
                        <Tag color="purple">{gpu.specs.tflops}</Tag>
                        <Tag color="orange">{gpu.specs.bandwidth}</Tag>
                      </Space>
                    </div>
                    <div>
                      <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
                        {gpu.pricing}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Radio>
            </div>
          ))}
        </Space>
      </Radio.Group>
    );
  };

  // Add selection logic in renderLocationOptions function
  const renderLocationOptions = () => {
    const locations = [
      { value: 'us', label: 'US', flag: '🇺🇸' },
      { value: 'norway', label: 'NORWAY', flag: '🇳🇴' },
      { value: 'canada', label: 'CANADA', flag: '🇨🇦' },
    ];
    
    const handleLocationSelect = (location: string) => {
      setSelectedLocation(location);
      form.setFieldsValue({ location });
    };
    
    return (
      <div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {locations.map(location => (
            <Card 
              key={location.value}
              hoverable
              onClick={() => handleLocationSelect(location.value)}
              style={{ 
                flex: 1, 
                background: '#1a1a1a', 
                borderColor: selectedLocation === location.value ? '#1890ff' : '#303030',
                cursor: 'pointer',
                padding: '0',
                borderWidth: selectedLocation === location.value ? '2px' : '1px'
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>{location.flag}</span>
                <Text strong style={{ color: '#ffffff', fontSize: '16px' }}>{location.label}</Text>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Handle ownership change
  const handleOwnershipChange = (value: string) => {
    if (value === 'personal') {
      setSelectedTeam('personal');
      form.setFieldsValue({ team: 'personal' });
    } else if (teams.find(t => t.id === value)) {
      const team = teams.find(t => t.id === value);
      // Check permissions
      if (team && (team.role === 'owner' || team.role === 'admin')) {
        setSelectedTeam(value);
        form.setFieldsValue({ team: value });
      } else {
        message.error('You do not have permission to create instances for this team');
      }
    }
  }

  // If user has instances but is currently creating a new one
  if ((hasInstances || creatingInstance) && creatingInstance) {
    return (
      <Card style={{ background: '#141414', border: '1px solid #303030' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
            <CloudServerOutlined style={{ marginRight: '8px' }} />
            Create {hasInstances ? 'New ' : 'Your First '}GPU Instance
          </Title>
          <Button 
            onClick={() => {
              setCreatingInstance(false);
              // If we don't have instances yet, go back to the welcome screen
              if (!hasInstances) {
                setHasInstances(false);
              }
            }}
          >
            Cancel
          </Button>
        </div>
        
        {/* Add Instance Ownership section */}
        <Card 
          style={{ 
            background: '#1a1a1a', 
            marginBottom: '24px', 
            borderColor: selectedTeam === 'personal' ? 'rgba(0, 140, 255, 0.4)' : '#303030'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ fontSize: '18px', color: '#1890ff', marginRight: '12px' }} />
            <div>
              <Text strong style={{ fontSize: '16px', color: '#ffffff', display: 'block' }}>Instance Ownership</Text>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                {selectedTeam === 'personal' ? (
                  <>
                    <Tag color="cyan" style={{ fontWeight: 'bold', margin: 0 }}>PERSONAL</Tag>
                    <Text style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.65)' }}>
                      Private instance only you can access and manage
                    </Text>
                  </>
                ) : (
                  <>
                    {teams.find(t => t.id === selectedTeam) && (
                      <>
                        <Tag 
                          color={teams.find(t => t.id === selectedTeam)?.role === 'owner' ? 'gold' : 
                                 teams.find(t => t.id === selectedTeam)?.role === 'admin' ? 'blue' : 'green'} 
                          style={{ fontWeight: 'bold', margin: 0 }}
                        >
                          {teams.find(t => t.id === selectedTeam)?.name}
                        </Tag>
                        <Text style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.65)' }}>
                          Team instance that may be visible or accessible to team members
                        </Text>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <Select
              className="change-dropdown"
              style={{ 
                marginLeft: 'auto', 
                width: '120px'
              }}
              placeholder="Change"
              bordered={false}
              dropdownMatchSelectWidth={false}
              popupClassName="change-dropdown"
              onDropdownVisibleChange={(open) => {
                // If dropdown menu is closed, reset back to "Change" display state
                if (!open) {
                  setTimeout(() => {
                    const selectElement = document.querySelector('.change-dropdown .ant-select-selection-item');
                    if (selectElement) {
                      selectElement.textContent = 'Change';
                    }
                  }, 100);
                }
              }}
              onSelect={(value) => {
                handleOwnershipChange(value);
              }}
            >
              <Option value="personal">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tag color="cyan" style={{ marginRight: '8px' }}>PERSONAL</Tag>
                  <span>Personal</span>
                </div>
              </Option>
              {teams.length > 0 && (
                <>
                  <Divider style={{ margin: '4px 0', borderColor: '#303030' }} />
                  {teams.map(team => {
                    const hasPermission = team.role === 'owner' || team.role === 'admin';
                    const roleColor = team.role === 'owner' ? 'gold' : team.role === 'admin' ? 'blue' : 'green';
                    
                    return (
                      <Option key={team.id} value={team.id} disabled={!hasPermission}>
                        <div style={{ display: 'flex', alignItems: 'center', opacity: hasPermission ? 1 : 0.5 }}>
                          <Tag color={roleColor} style={{ marginRight: '8px' }}>{team.role.toUpperCase()}</Tag>
                          <span>{team.name}</span>
                        </div>
                      </Option>
                    );
                  })}
                </>
              )}
            </Select>
          </div>
        </Card>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateInstance}
          initialValues={{
            gpu_type: 'a100',
            gpu_count: 1,
            team: 'personal',
          }}
        >
          {/* Hide Team Selection in the form because it's already shown above */}
          <Form.Item
            name="team"
            hidden={true}
          >
            <Input />
          </Form.Item>
          
          {/* Add location selection */}
          <Form.Item
            label={<span style={{ color: '#ffffff', fontSize: '16px' }}>Location</span>}
            name="location"
            rules={[{ required: true, message: 'Please select a location' }]}
            initialValue="us"
          >
            {renderLocationOptions()}
          </Form.Item>
          
          {/* Instance Name */}
          <Form.Item
            label={<span style={{ color: '#ffffff' }}>Instance Name</span>}
            name="instance_name"
            rules={[{ required: true, message: 'Please enter an instance name' }]}
          >
            <Input placeholder="e.g., ml-training-1" />
          </Form.Item>
          
          {/* GPU Type and Count */}
          <Form.Item
            label={<span style={{ color: '#ffffff' }}>GPU Type</span>}
            name="gpu_type"
          >
            {renderGpuOptions()}
          </Form.Item>
          
          <Form.Item
            label={<span style={{ color: '#ffffff' }}>Number of GPUs</span>}
            name="gpu_count"
            rules={[{ required: true, message: 'Please select number of GPUs' }]}
          >
            <Select>
              <Option value={1}>1 GPU</Option>
              <Option value={2}>2 GPUs</Option>
              <Option value={4}>4 GPUs</Option>
              <Option value={8}>8 GPUs</Option>
            </Select>
          </Form.Item>
          
          {/* Storage Size */}
          <Form.Item
            label={<span style={{ color: '#ffffff' }}>Storage Size (GB)</span>}
            name="storage_size"
            initialValue={100}
            rules={[{ required: true, message: 'Please specify storage size' }]}
          >
            <InputNumber min={50} max={2000} style={{ width: '100%' }} />
          </Form.Item>
          
          <Alert
            message="Billing Information"
            description={
              <div>
                <p>You will be billed hourly for this GPU instance based on the selected configuration.</p>
                <p>Make sure to stop or terminate instances when not in use to avoid unnecessary charges.</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<DeploymentUnitOutlined />}
              >
                Create Instance
              </Button>
              <Button onClick={() => {
                // If we don't have instances yet, go back to the welcome screen
                if (!hasInstances) {
                  setHasInstances(false);
                } else {
                  setCreatingInstance(false);
                }
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  }
  
  // If user has instances, show them with option to create more
  if (hasInstances) {
    return (
      <div style={{ background: '#141414', minHeight: '100vh', padding: '0 0 20px 0' }}>
        {/* Top title bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #303030' }}>
          <Title level={3} style={{ margin: 0, color: '#ffffff' }}>Instances</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button type="text" style={{ color: 'white' }}>Pricing</Button>
            <Button type="text" style={{ color: 'white' }}>Docs</Button>
            <Button type="text" style={{ color: 'white' }}>Referral</Button>
            <div style={{ margin: '0 8px', color: 'white', fontWeight: 'bold' }}>$22.71</div>
            <Button type="primary">Deposit</Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'white' }}>leo zhang</span>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '4px', 
                background: '#333', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white' 
              }}>▼</div>
            </div>
          </div>
        </div>
        
        {/* Instance list */}
        <div style={{ padding: '0 20px' }}>
          <InstanceList instances={instances} onRefresh={loadInstances} currentUser={currentUser.email} />
        </div>
      </div>
    );
  }
  
  // If user has no instances yet, show the first-time creation view
  if (!hasInstances) {
    return (
      <Card style={{ background: '#141414', border: '1px solid #303030' }}>
        <div className="first-instance-container" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CloudServerOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />
          
          <Title level={2} style={{ color: '#ffffff', marginBottom: '16px' }}>
            Start harnessing the power of GPUs now!
          </Title>
          
          <Paragraph style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '600px', margin: '0 auto 32px' }}>
            Create your first GPU instance to start running machine learning models, training workloads, or rendering tasks.
          </Paragraph>
          
          <div style={{ maxWidth: '500px', margin: '0 auto 32px', textAlign: 'left', background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #303030' }}>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: '20px' }}>
              <InfoCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <Text strong style={{ fontSize: '14px' }}>Select instance ownership:</Text> By default, instances are created for your <Text strong>personal use</Text>. You can optionally select a team if you want the instance to be accessible to team members.
            </Paragraph>
            
            <Form
              layout="vertical"
              initialValues={{ team: 'personal' }}
            >
              <Form.Item
                label={
                  <span style={{ color: '#ffffff' }}>
                    <TeamOutlined style={{ marginRight: '8px' }} />
                    Instance Ownership
                    <Tooltip title="Choose who this instance will belong to">
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
                  className="instance-ownership-select"
                >
                  <Option 
                    key="personal" 
                    value="personal" 
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                        <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '16px' }}>PERSONAL</span>
                        <Tag color="green" style={{ marginLeft: '8px', fontSize: '12px' }}>DEFAULT</Tag>
                      </div>
                    }
                    className="personal-instance-option"
                  >
                    <div className="personal-option-wrapper">
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>PERSONAL</span>
                        <div>
                          <Tag color="cyan" style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '4px' }}>PERSONAL</Tag>
                          <Tag color="green" style={{ fontSize: '12px' }}>DEFAULT</Tag>
                        </div>
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '12px', marginTop: '2px' }}>
                        Private instance only you can access and manage
                      </div>
                    </div>
                  </Option>
                  
                  {/* Using a standard Divider component */}
                  <Divider style={{ margin: '8px 0', borderColor: '#303030' }} />
                  
                  <Option key="team-label" disabled>
                    <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'bold' }}>Team Instances:</span>
                  </Option>
                  {teams.map(team => {
                    // Check if user has permission to create instances
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
                                <Tag color="red" style={{ fontSize: '12px' }}>NO PERMISSION</Tag>
                              )}
                            </div>
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '12px', marginTop: '2px' }}>
                            Instance may be visible or accessible to team members
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
            icon={<DeploymentUnitOutlined />}
            onClick={() => {
              if (selectedTeam === 'personal' || (selectedTeam && teams.find(t => t.id === selectedTeam))) {
                // Show the form instead of the welcome screen
                setCreatingInstance(true);
                // Ensure the form gets the correct selected value
                form.setFieldsValue({ team: selectedTeam });
              } else {
                message.warning('Please select personal or team ownership');
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
            Continue to Deploy
          </Button>
          
          <Paragraph style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '16px' }}>
            You'll be able to configure GPU type, count, and storage on the next screen
          </Paragraph>
        </div>
      </Card>
    );
  }
  
  // Otherwise, show the creation form
  return (
    <Card style={{ background: '#141414', border: '1px solid #303030' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
          <CloudServerOutlined style={{ marginRight: '8px' }} />
          Create GPU Instance
        </Title>
      </div>
      
      {/* Add Instance Ownership section */}
      <Card 
        style={{ 
          background: '#1a1a1a', 
          marginBottom: '24px', 
          borderColor: selectedTeam === 'personal' ? 'rgba(0, 140, 255, 0.4)' : '#303030'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TeamOutlined style={{ fontSize: '18px', color: '#1890ff', marginRight: '12px' }} />
          <div>
            <Text strong style={{ fontSize: '16px', color: '#ffffff', display: 'block' }}>Instance Ownership</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              {selectedTeam === 'personal' ? (
                <>
                  <Tag color="cyan" style={{ fontWeight: 'bold', margin: 0 }}>PERSONAL</Tag>
                  <Text style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.65)' }}>
                    Private instance only you can access and manage
                  </Text>
                </>
              ) : (
                <>
                  {teams.find(t => t.id === selectedTeam) && (
                    <>
                      <Tag 
                        color={teams.find(t => t.id === selectedTeam)?.role === 'owner' ? 'gold' : 
                               teams.find(t => t.id === selectedTeam)?.role === 'admin' ? 'blue' : 'green'} 
                        style={{ fontWeight: 'bold', margin: 0 }}
                      >
                        {teams.find(t => t.id === selectedTeam)?.name}
                      </Tag>
                      <Text style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.65)' }}>
                        Team instance that may be visible or accessible to team members
                      </Text>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <Select
            className="change-dropdown"
            style={{ 
              marginLeft: 'auto', 
              width: '120px'
            }}
            placeholder="Change"
            bordered={false}
            dropdownMatchSelectWidth={false}
            popupClassName="change-dropdown"
            onDropdownVisibleChange={(open) => {
              // If dropdown menu is closed, reset back to "Change" display state
              if (!open) {
                setTimeout(() => {
                  const selectElement = document.querySelector('.change-dropdown .ant-select-selection-item');
                  if (selectElement) {
                    selectElement.textContent = 'Change';
                  }
                }, 100);
              }
            }}
            onSelect={(value) => {
              handleOwnershipChange(value);
            }}
          >
            <Option value="personal">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tag color="cyan" style={{ marginRight: '8px' }}>PERSONAL</Tag>
                <span>Personal</span>
              </div>
            </Option>
            {teams.length > 0 && (
              <>
                <Divider style={{ margin: '4px 0', borderColor: '#303030' }} />
                {teams.map(team => {
                  const hasPermission = team.role === 'owner' || team.role === 'admin';
                  const roleColor = team.role === 'owner' ? 'gold' : team.role === 'admin' ? 'blue' : 'green';
                  
                  return (
                    <Option key={team.id} value={team.id} disabled={!hasPermission}>
                      <div style={{ display: 'flex', alignItems: 'center', opacity: hasPermission ? 1 : 0.5 }}>
                        <Tag color={roleColor} style={{ marginRight: '8px' }}>{team.role.toUpperCase()}</Tag>
                        <span>{team.name}</span>
                      </div>
                    </Option>
                  );
                })}
              </>
            )}
          </Select>
        </div>
      </Card>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateInstance}
        initialValues={{
          gpu_type: 'a100',
          gpu_count: 1,
          team: 'personal',
        }}
      >
        {/* Hide Team Selection in the form because it's already shown above */}
        <Form.Item
          name="team"
          hidden={true}
        >
          <Input />
        </Form.Item>
        
        {/* Add location selection */}
        <Form.Item
          label={<span style={{ color: '#ffffff', fontSize: '16px' }}>Location</span>}
          name="location"
          rules={[{ required: true, message: 'Please select a location' }]}
          initialValue="us"
        >
          {renderLocationOptions()}
        </Form.Item>
        
        {/* Instance Name */}
        <Form.Item
          label={<span style={{ color: '#ffffff' }}>Instance Name</span>}
          name="instance_name"
          rules={[{ required: true, message: 'Please enter an instance name' }]}
        >
          <Input placeholder="e.g., ml-training-1" />
        </Form.Item>
        
        {/* GPU Type and Count */}
        <Form.Item
          label={<span style={{ color: '#ffffff' }}>GPU Type</span>}
          name="gpu_type"
        >
          {renderGpuOptions()}
        </Form.Item>
        
        <Form.Item
          label={<span style={{ color: '#ffffff' }}>Number of GPUs</span>}
          name="gpu_count"
          rules={[{ required: true, message: 'Please select number of GPUs' }]}
        >
          <Select>
            <Option value={1}>1 GPU</Option>
            <Option value={2}>2 GPUs</Option>
            <Option value={4}>4 GPUs</Option>
            <Option value={8}>8 GPUs</Option>
          </Select>
        </Form.Item>
        
        {/* Storage Size */}
        <Form.Item
          label={<span style={{ color: '#ffffff' }}>Storage Size (GB)</span>}
          name="storage_size"
          initialValue={100}
          rules={[{ required: true, message: 'Please specify storage size' }]}
        >
          <InputNumber min={50} max={2000} style={{ width: '100%' }} />
        </Form.Item>
        
        <Alert
          message="Billing Information"
          description={
            <div>
              <p>You will be billed hourly for this GPU instance based on the selected configuration.</p>
              <p>Make sure to stop or terminate instances when not in use to avoid unnecessary charges.</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
        
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<DeploymentUnitOutlined />}
            >
              Create Instance
            </Button>
            <Button onClick={() => {
              // If we don't have instances yet, go back to the welcome screen
              if (!hasInstances) {
                setHasInstances(false);
              } else {
                setCreatingInstance(false);
              }
            }}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Instances;