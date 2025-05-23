import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Typography, Space, Button, Modal, Tooltip, Badge, Divider, Table, Select, Row, Col } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined, 
  FieldTimeOutlined,
  DollarOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
  FilterOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { InstanceData, updateInstanceStatus } from '../services/instanceService';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;
const { Option } = Select;

interface InstanceListProps {
  instances: InstanceData[];
  onRefresh: () => void;
  currentUser?: string;
}

// 实例详情模态框组件
const InstanceDetailModal = ({ instance, visible, onClose, onStatusChange, currentUser }: { 
  instance: InstanceData | null; 
  visible: boolean; 
  onClose: () => void;
  onStatusChange: (instanceId: string, status: 'running' | 'stopped' | 'terminated') => void;
  currentUser?: string;
}) => {
  if (!instance) return null;

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString();
  };
  
  // 计算运行时间和费用
  const runtime = instance.totalHours;
  const cost = (instance.hourlyRate * runtime).toFixed(4);
  
  // 确定实例类型
  const instanceType = instance.teamId === 'personal' ? 'CPU' : 'GPU';

  // 处理关机
  const handlePowerOff = () => {
    if (instance) {
      onStatusChange(instance.id, 'stopped');
      onClose();
    }
  };

  // 处理终止
  const handleTerminate = () => {
    if (instance) {
      confirm({
        title: 'Are you sure you want to terminate this instance?',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        content: 'This will permanently delete the instance and all associated data. This action cannot be undone.',
        okText: 'Terminate',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          onStatusChange(instance.id, 'terminated');
          onClose();
        }
      });
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '12px', color: 'white', fontWeight: 'bold' }}>Instance Details</span>
          <Tag style={{ margin: 0 }}>
            {instance.teamId === 'personal' ? (
              <span>Virtual Machine-CPU</span>
            ) : (
              <span>Virtual Machine-GPU</span>
            )}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button 
          key="power-off" 
          style={{ backgroundColor: '#222', color: 'white', borderColor: '#444' }}
          onClick={handlePowerOff}
          disabled={instance.status !== 'running'}
        >
          Power Off
        </Button>,
        <Button 
          key="terminate" 
          danger 
          style={{ marginLeft: '8px' }}
          onClick={handleTerminate}
          disabled={instance.status === 'terminated'}
        >
          Terminate
        </Button>
      ]}
      width={1000}
      style={{ top: 20 }}
      bodyStyle={{ padding: '24px', background: '#0e0e0e' }}
      centered
    >
      {/* 基本信息 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Name:</Text>
          <Text style={{ color: 'white', fontSize: '18px' }}>{instance.name}</Text>
        </div>
        <div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Status:</Text>
          <Text style={{ color: instance.status === 'running' ? '#52c41a' : '#faad14', fontSize: '18px' }}>
            {instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
          </Text>
        </div>
        <div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Location:</Text>
          <Text style={{ color: 'white', fontSize: '18px' }}>{instance.region.toUpperCase()}</Text>
        </div>
        <div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Served:</Text>
          <Text style={{ color: 'white', fontSize: '18px' }}>{runtime.toFixed(4)} hours</Text>
        </div>
        <div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Total Cost:</Text>
          <Text style={{ color: 'white', fontSize: '18px' }}>${cost}</Text>
        </div>
      </div>

      {/* 实例类型信息 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {instance.teamId === 'personal' ? (
            <>
              <UserOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <Text style={{ color: 'white' }}>Personal</Text>
              <Tag color="cyan" style={{ marginLeft: '8px' }}>Personal</Tag>
            </>
          ) : (
            <>
              <TeamOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <Text style={{ color: 'white' }}>Team: {instance.teamName}</Text>
              <Tag color="blue" style={{ marginLeft: '8px' }}>Team</Tag>
            </>
          )}
        </div>
      </div>

      {/* Creator information */}
      <div style={{ marginBottom: '24px' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Created by:</Text>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {instance.teamId === 'personal' ? (
            <>
              <Text style={{ color: 'white' }}>
                {instance.creatorName || instance.createdBy}
              </Text>
              <Tag color="cyan" style={{ marginLeft: '8px' }}>YOU</Tag>
            </>
          ) : (
            <>
              <Text style={{ color: 'white' }}>
                {instance.creatorName || instance.createdBy}
              </Text>
              {instance.creatorRole && (
                <Tag 
                  color={
                    instance.creatorRole === 'owner' ? 'gold' : 
                    instance.creatorRole === 'admin' ? 'blue' : 'green'
                  } 
                  style={{ marginLeft: '8px' }}
                >
                  {instance.creatorRole.toUpperCase()}
                </Tag>
              )}
              {instance.createdBy === currentUser && (
                <Tag color="cyan" style={{ marginLeft: '8px' }}>YOU</Tag>
              )}
            </>
          )}
        </div>
      </div>

      {/* 详细信息卡片 */}
      <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Instance Started:</Text>
            <Text style={{ color: 'white' }}>{formatTime(instance.createdAt)}</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>OS/Image:</Text>
            <Text style={{ color: 'white' }}>Ubuntu 22.04 LTS x64</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>LAN IP Address:</Text>
            <Text style={{ color: 'white' }}>{instance.ipAddress || '172.20.0.190'}</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Public IP Address:</Text>
            <Text style={{ color: 'white' }}>38.80.81.169</Text>
          </div>
          
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>vCPU:</Text>
            <Text style={{ color: 'white' }}>{instance.gpuCount * 2}</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Memory:</Text>
            <Text style={{ color: 'white' }}>{instance.gpuCount * 8} GB</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Disk:</Text>
            <Text style={{ color: 'white' }}>{instance.storageSize} GB</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Bandwidth:</Text>
            <Text style={{ color: 'white' }}>Unlimited</Text>
          </div>
          
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Username:</Text>
            <Text style={{ color: 'white' }}>root</Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Password:</Text>
            <Space>
              <Text style={{ color: 'white' }}>******</Text>
              <Button type="text" size="small" icon={<EyeOutlined style={{ color: 'white' }} />} />
            </Space>
          </div>
        </div>
      </Card>
    </Modal>
  );
};

const InstanceList: React.FC<InstanceListProps> = ({ instances, onRefresh, currentUser = 'user@example.com' }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [selectedInstance, setSelectedInstance] = useState<InstanceData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');

  // Extract unique teams and creators for filter dropdowns
  const teams = React.useMemo(() => {
    const teamSet = new Set<string>();
    const teamMap = new Map<string, string>();
    
    instances.forEach(instance => {
      if (instance.teamId !== 'personal') {
        teamSet.add(instance.teamId);
        teamMap.set(instance.teamId, instance.teamName);
      }
    });
    
    return Array.from(teamSet).map(id => ({
      id,
      name: teamMap.get(id) || id
    }));
  }, [instances]);

  const creators = React.useMemo(() => {
    const creatorSet = new Set<string>();
    const creatorMap = new Map<string, {name: string, role?: string}>();
    
    instances.forEach(instance => {
      creatorSet.add(instance.createdBy);
      creatorMap.set(instance.createdBy, {
        name: instance.creatorName || instance.createdBy,
        role: instance.creatorRole
      });
    });
    
    return Array.from(creatorSet).map(id => ({
      id,
      name: creatorMap.get(id)?.name || id,
      role: creatorMap.get(id)?.role
    }));
  }, [instances]);

  // 过滤实例列表
  const filteredInstances = instances.filter(instance => {
    // Filter by specific workspace (team or personal)
    if (teamFilter !== 'all') {
      if (teamFilter === 'personal' && instance.teamId !== 'personal') return false;
      else if (teamFilter !== 'personal' && instance.teamId !== teamFilter) return false;
    }
    
    // Filter by creator (but personal instances should always be visible when filtering by current user)
    if (creatorFilter !== 'all') {
      if (instance.teamId === 'personal') {
        // Personal instances are always "created by" the current user
        if (creatorFilter !== currentUser) return false;
      } else if (instance.createdBy !== creatorFilter) {
        return false;
      }
    }
    
    return true;
  });

  const handleViewInstance = (instance: InstanceData) => {
    setSelectedInstance(instance);
    setModalVisible(true);
  };

  const handleStatusChange = async (instanceId: string, newStatus: 'running' | 'stopped' | 'terminated') => {
    // Set loading state for this instance
    setLoadingStates(prev => ({ ...prev, [instanceId]: true }));
    
    try {
      const action = newStatus === 'running' ? 'start' : newStatus === 'stopped' ? 'stop' : 'terminate';
      
      if (newStatus === 'terminated') {
        confirm({
          title: 'Are you sure you want to terminate this instance?',
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
          content: 'This will permanently delete the instance and all associated data. This action cannot be undone.',
          okText: 'Terminate',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: async () => {
            await updateInstanceStatus(instanceId, newStatus);
            onRefresh();
          }
        });
        return;
      }
      
      await updateInstanceStatus(instanceId, newStatus);
      onRefresh();
    } catch (error) {
      console.error(`Failed to ${newStatus} instance:`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'creating':
        return <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="spinner" style={{ marginRight: '8px' }}></div>
          <span style={{ color: '#1890ff' }}>Deploying</span>
        </div>;
      case 'running':
        return <Text style={{ color: '#52c41a' }}>Running</Text>;
      case 'stopped':
        return <Text style={{ color: '#faad14' }}>Stopped</Text>;
      case 'terminated':
        return <Text style={{ color: '#ff4d4f' }}>Terminated</Text>;
      default:
        return <Text>{status}</Text>;
    }
  };
  
  // Get role tag color
  const getRoleTagColor = (role?: string) => {
    if (!role) return 'default';
    switch (role) {
      case 'owner': return 'gold';
      case 'admin': return 'blue';
      case 'member': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Instance Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: InstanceData) => (
        <div>
          <Text style={{ color: 'white' }}>{text}</Text>
        </div>
      )
    },
    {
      title: 'Team/Personal',
      key: 'team',
      render: (_: any, record: InstanceData) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.teamId === 'personal' ? (
            <Tag color="cyan">Personal</Tag>
          ) : (
            <Text>{record.teamName}</Text>
          )}
        </div>
      )
    },
    {
      title: 'Creator',
      key: 'creator',
      render: (_: any, record: InstanceData) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.teamId === 'personal' ? (
            <>
              <Text>{record.creatorName || record.createdBy}</Text>
              <Tag color="cyan" style={{ marginLeft: '8px', fontSize: '12px' }}>
                YOU
              </Tag>
            </>
          ) : (
            <>
              <Text>{record.creatorName || record.createdBy}</Text>
              {record.creatorRole && (
                <Tag color={getRoleTagColor(record.creatorRole)} style={{ marginLeft: '8px' }}>
                  {record.creatorRole.toUpperCase()}
                </Tag>
              )}
              {record.createdBy === currentUser && (
                <Tag color="cyan" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  YOU
                </Tag>
              )}
            </>
          )}
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'region',
      key: 'region',
      render: (text: string) => (
        <Text>{text.toUpperCase()}</Text>
      )
    },
    {
      title: 'Type',
      key: 'type',
      render: (_: any, record: InstanceData) => (
        <Text>{record.teamId === 'personal' ? 'CPU' : 'GPU'}</Text>
      )
    },
    {
      title: 'vCPU',
      key: 'vcpu',
      render: (_: any, record: InstanceData) => (
        <Text>{record.gpuCount * 2}</Text>
      )
    },
    {
      title: 'Memory',
      key: 'memory',
      render: (_: any, record: InstanceData) => (
        <Text>{record.gpuCount * 8} GB</Text>
      )
    },
    {
      title: 'Storage',
      dataIndex: 'storageSize',
      key: 'storage',
      render: (size: number) => (
        <Text>{size} GB</Text>
      )
    },
    {
      title: 'Price',
      dataIndex: 'hourlyRate',
      key: 'price',
      render: (rate: number) => (
        <Text>${rate.toFixed(2)}/hr</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusDisplay(status)
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: InstanceData) => (
        <Button 
          type="primary"
          onClick={() => handleViewInstance(record)}
        >
          View
        </Button>
      )
    }
  ];

  // 添加CSS样式
  const tableCss = `
    .instance-table .ant-table {
      background-color: transparent !important;
      color: white !important;
    }
    
    .instance-table .ant-table-thead > tr > th {
      background-color: #141414 !important;
      color: rgba(255, 255, 255, 0.85) !important;
      border-bottom: 1px solid #303030 !important;
    }
    
    .instance-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #262626 !important;
      color: rgba(255, 255, 255, 0.65) !important;
    }
    
    .instance-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(255, 255, 255, 0.04) !important;
    }
    
    .instance-table .ant-pagination-item {
      background-color: #141414 !important;
      border-color: #303030 !important;
    }
    
    .instance-table .ant-pagination-item-active {
      border-color: #1890ff !important;
    }
    
    .instance-table .ant-pagination-item a {
      color: rgba(255, 255, 255, 0.65) !important;
    }
    
    .instance-table .ant-pagination-item-active a {
      color: #1890ff !important;
    }
    
    .instance-table .ant-pagination-prev .ant-pagination-item-link,
    .instance-table .ant-pagination-next .ant-pagination-item-link {
      background-color: #141414 !important;
      border-color: #303030 !important;
      color: rgba(255, 255, 255, 0.65) !important;
    }
    
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(24, 144, 255, 0.3);
      border-radius: 50%;
      border-top-color: #1890ff;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .ownership-filter button {
      transition: all 0.2s ease;
    }
    
    .ownership-filter button:hover {
      background-color: rgba(24, 144, 255, 0.1) !important;
    }
    
    .ownership-filter button:focus {
      outline: none;
    }
    
    .filter-dropdown {
      background-color: #1a1a1a !important;
      min-width: 180px !important;
      border: 1px solid #303030 !important;
    }
    
    .filter-dropdown .ant-select-item {
      color: rgba(255, 255, 255, 0.85) !important;
    }
    
    .filter-dropdown .ant-select-item-option-selected {
      background-color: rgba(24, 144, 255, 0.1) !important;
    }
    
    .filter-dropdown .ant-select-item-option-active {
      background-color: rgba(24, 144, 255, 0.05) !important;
    }
    
    .filter-select {
      min-width: 150px !important;
    }
    
    .filter-select .ant-select-selector {
      background-color: #1a1a1a !important;
      border-color: #303030 !important;
      color: rgba(255, 255, 255, 0.85) !important;
    }
    
    .filter-select .ant-select-arrow {
      color: rgba(255, 255, 255, 0.65) !important;
    }
    
    .filter-label {
      color: rgba(255, 255, 255, 0.85) !important;
      margin-right: 8px;
      display: flex;
      align-items: center;
    }
    
    .filter-section {
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
  `;

  // 添加CSS样式到页面
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = tableCss;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="instance-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Space>
            <Button 
              type="primary"
              onClick={() => {
                // 导航到实例页面并显示创建表单
                const navigate = window.location.pathname === '/instances' 
                  ? (newState: any) => {
                      // 如果已经在实例页面，使用自定义函数通知父组件
                      if (typeof window.setInstanceCreating === 'function') {
                        window.setInstanceCreating(true);
                      }
                    }
                  : require('react-router-dom').useNavigate();
                
                if (typeof navigate === 'function') {
                  if (window.location.pathname !== '/instances') {
                    navigate('/instances', { 
                      state: { 
                        creatingInstance: true 
                      } 
                    });
                  } else {
                    navigate({ creatingInstance: true });
                  }
                }
              }}
            >
              Deploy
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
              <input 
                type="checkbox" 
                id="active-filter" 
                style={{ 
                  marginRight: '8px',
                  accentColor: '#1890ff' 
                }} 
                defaultChecked 
              />
              <label htmlFor="active-filter" style={{ color: 'white', cursor: 'pointer' }}>
                Active
              </label>
            </div>
          </Space>
        </div>
        <Button 
          onClick={onRefresh}
          style={{ marginLeft: 'auto' }}
        >
          Refresh
        </Button>
      </div>
      
      {/* Enhanced Filter Section */}
      <div className="filter-section">
        <FilterOutlined style={{ color: 'rgba(255, 255, 255, 0.85)', marginRight: '8px' }} />
        <Text style={{ color: 'rgba(255, 255, 255, 0.85)', marginRight: '16px' }}>Filters:</Text>
        
        {/* Team/Personal filter dropdown (renamed from Workspace) */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
          <span className="filter-label">Team/Personal:</span>
          <Select
            className="filter-select"
            value={teamFilter}
            onChange={setTeamFilter}
            dropdownClassName="filter-dropdown"
          >
            <Option value="all">All</Option>
            <Option value="personal">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tag color="cyan" style={{ marginRight: '8px' }}>PERSONAL</Tag>
                <span>Personal</span>
              </div>
            </Option>
            {teams.map(team => (
              <Option key={team.id} value={team.id}>{team.name}</Option>
            ))}
          </Select>
        </div>
        
        {/* Creator filter dropdown */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="filter-label">Creator:</span>
          <Select
            className="filter-select"
            value={creatorFilter}
            onChange={setCreatorFilter}
            dropdownClassName="filter-dropdown"
          >
            <Option value="all">All</Option>
            <Option value={currentUser}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>You</span>
                <Tag color="cyan" style={{ marginLeft: '8px', fontSize: '12px' }}>YOU</Tag>
              </div>
            </Option>
            {creators
              .filter(creator => creator.id !== currentUser) // Filter out current user as we've added it separately
              .map(creator => (
                <Option key={creator.id} value={creator.id}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>{creator.name}</span>
                    {creator.role && (
                      <Tag color={getRoleTagColor(creator.role)} style={{ marginLeft: '8px', fontSize: '12px' }}>
                        {creator.role.toUpperCase()}
                      </Tag>
                    )}
                  </div>
                </Option>
              ))
            }
          </Select>
        </div>
      </div>
      
      <div className="instance-table">
        <Table 
          dataSource={filteredInstances} 
          columns={columns}
          rowKey="id"
          pagination={{ 
            position: ['bottomCenter'],
            showSizeChanger: false,
            showQuickJumper: false,
            defaultPageSize: 10,
            size: 'small'
          }}
        />
      </div>

      {/* 实例详情弹窗 */}
      <InstanceDetailModal 
        instance={selectedInstance} 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onStatusChange={handleStatusChange}
        currentUser={currentUser}
      />
    </div>
  );
};

export default InstanceList;