import React, { useState, useMemo } from 'react';
import { Button, Table, Tag, Select, Space, Typography, Input, Tooltip, Modal, Descriptions, Row, Col, Divider, message } from 'antd';
import { CloudServerOutlined, SyncOutlined, DownOutlined, SearchOutlined, InfoCircleOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text, Title } = Typography;

// Simplified CurrentUser interface based on what Instances.tsx provides
export interface CurrentUser {
  email: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  role?: 'owner' | 'admin' | 'member'; // Added role
}

export interface InstanceData {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'terminated' | 'pending' | 'error' | 'failed' | 'creating' | string; // Added 'failed', 'creating'
  teamId: string; // Can be 'personal' for personal instances
  teamName?: string;
  createdBy: string; // User ID or email
  creatorName?: string;
  gpuType: string; // e.g., 'a100', 'rtx4090', 'cpu'
  gpuCount?: number; // Relevant for GPU types
  vcpu?: number;
  memory?: string; // e.g., "16 GB"
  storageSize: number; // e.g., 100 for 100 GB
  ipAddress?: string;
  createdAt: string | Date;
  region?: string; // e.g., "CANADA", "NORWAY"
  hourlyRate?: number;
  // role?: string; // Creator's role, if needed for other logic, not directly in table based on image
  osImage?: string;
  lanIpAddress?: string;
  publicIpAddress?: string; // Explicit public IP
  servedHours?: number;
  totalCost?: number;
  bandwidth?: string;
  username?: string;
  password?: string; // Consider security implications for displaying/handling passwords
  instanceTypeTag?: string; // e.g., "Virtual Machine-CPU" or "GPU Instance"
}

interface InstanceListProps {
  instances: InstanceData[];
  onRefresh: () => void;
  loading?: boolean;
  currentUser: CurrentUser;
  teams: Team[];
}

// Helper to get more descriptive type names
const getInstanceTypeDisplay = (gpuType: string, gpuCount?: number) => {
  if (gpuType?.toLowerCase() === 'cpu') return 'CPU';
  if (gpuType?.toLowerCase() === 'a100') return `A100-80G-PCIe${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
  if (gpuType?.toLowerCase() === 'h100') return `H100-80G-HBM3${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
  if (gpuType?.toLowerCase() === 'rtx-4090' || gpuType?.toLowerCase() === 'rtx4090') return `RTX-4090${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
  if (gpuType?.toLowerCase() === 'l4') return `L4 Tensor Core${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
  return gpuType || 'N/A';
};

// Helper function to create title with info icon
const getColumnTitleWithInfo = (titleText: string, infoText: string) => (
  <Space size={4}>
    <span>{titleText}</span>
    <Tooltip title={infoText}>
      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.45)', cursor: 'help' }} />
    </Tooltip>
  </Space>
);

const InstanceList: React.FC<InstanceListProps> = ({ 
  instances = [], 
  onRefresh, 
  loading = false, 
  currentUser,
  teams
}) => {
  const navigate = useNavigate();
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedCreatorFilter, setSelectedCreatorFilter] = useState<string>('all');
  const [instanceNameSearch, setInstanceNameSearch] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // State for the modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<InstanceData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleDeployClick = () => {
    navigate('/instances', { state: { creatingInstance: true } });
  };

  const getStatusDisplay = (status: string, inModal: boolean = false) => {
    const lowerStatus = status?.toLowerCase();
    let style: React.CSSProperties = inModal ? { fontSize: '14px' } : {};
    switch (lowerStatus) {
      case 'running':
        return <Text style={{ color: '#52c41a', ...style }}>Running</Text>;
      case 'stopped':
        return <Text style={{ color: '#faad14', ...style }}>Stopped</Text>;
      case 'deleted': // Matching image
      case 'terminated':
        return <Text style={{ color: '#f5222d', ...style }}>Deleted</Text>;
      case 'pending':
      case 'creating':
        return <Text style={{ color: '#1890ff', ...style }}>Pending</Text>;
      case 'failed': // As per previous logic, 'Failed' is green, image shows 'Deleted'
        return <Text style={{ color: '#f5222d', ...style }}>Failed</Text>; 
      case 'error':
        return <Text style={{ color: '#f5222d', ...style }}>Error</Text>;
      default:
        return <Text style={{ color: '#bfbfbf', ...style }}>{status || 'Unknown'}</Text>;
    }
  };

  const handleViewInstance = (instance: InstanceData) => {
    // For demonstration, let's fill in some missing fields if not present in instance data
    const instanceWithFallback: InstanceData = {
      ...instance,
      instanceTypeTag: instance.instanceTypeTag || (instance.gpuType && instance.gpuType.toLowerCase() !== 'cpu' ? `${instance.gpuType.toUpperCase()} Instance` : 'Virtual Machine-CPU'),
      osImage: instance.osImage || 'Ubuntu 22.04 LTS x64', // Mocked
      lanIpAddress: instance.lanIpAddress || '172.20.0.17', // Mocked
      publicIpAddress: instance.publicIpAddress || instance.ipAddress || '38.80.81.174', // Mocked
      servedHours: instance.servedHours || 0.3120, // Mocked
      totalCost: instance.totalCost || instance.hourlyRate ? instance.hourlyRate! * (instance.servedHours || 0.3120) : 0.0131, // Mocked
      bandwidth: instance.bandwidth || '1 Gbps', // Mocked
      username: instance.username || 'root', // Mocked
      password: instance.password || '**********', // Mocked
      vcpu: instance.vcpu || 4, // Mocked
      memory: instance.memory || '16 GB' // Mocked
    };
    setSelectedInstance(instanceWithFallback);
    setIsModalVisible(true);
    setShowPassword(false); // Reset password visibility
  };
  
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedInstance(null);
  };

  const uniqueCreators = useMemo(() => {
    const creators = new Map<string, string>();
    instances.forEach(inst => {
      if (inst.createdBy && !creators.has(inst.createdBy)) {
        creators.set(inst.createdBy, inst.creatorName || inst.createdBy);
      }
    });
    return Array.from(creators.entries());
  }, [instances]);

  const filteredInstances = useMemo(() => {
    return instances.filter(instance => {
      const teamMatch = selectedTeamFilter === 'all' || 
                        (selectedTeamFilter === 'personal' && (instance.teamId === 'personal' || !instance.teamId)) || // Also handle undefined teamId as personal
                        instance.teamId === selectedTeamFilter;
      const creatorMatch = selectedCreatorFilter === 'all' || instance.createdBy === selectedCreatorFilter;
      const nameMatch = instance.name.toLowerCase().includes(instanceNameSearch.toLowerCase());
      const statusMatch = selectedStatusFilter === 'all' || instance.status.toLowerCase() === selectedStatusFilter;
      return teamMatch && creatorMatch && nameMatch && statusMatch;
    });
  }, [instances, selectedTeamFilter, selectedCreatorFilter, instanceNameSearch, selectedStatusFilter]);

  const columns = [
    {
      title: 'Instance Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: InstanceData) => (
        <Button 
          type="link" 
          onClick={() => handleViewInstance(record)}
          style={{ padding: 0, color: '#1890ff' }}
        >
          {text || 'Untitled Instance'}
        </Button>
      ),
    },
    {
      title: getColumnTitleWithInfo('Team', 'The team or project the instance belongs to. \'Personal\' indicates an instance for individual use.'),
      dataIndex: 'teamId',
      key: 'team',
      render: (teamId: string, record: InstanceData) => {
        if (teamId === 'personal' || !record.teamName) {
          return <Tag color="blue">Personal</Tag>;
        }
        
        // Find the team details from the teams prop to get the role
        const teamDetails = teams.find(t => t.id === teamId);
        const userRoleInTeam = teamDetails?.role;
        let roleTag = null;

        if (userRoleInTeam) {
          let roleColor = 'default';
          if (userRoleInTeam === 'owner') roleColor = 'gold';
          else if (userRoleInTeam === 'admin') roleColor = 'purple';
          else if (userRoleInTeam === 'member') roleColor = 'green';
          roleTag = <Tag color={roleColor} style={{ marginLeft: '8px' }}>{userRoleInTeam.toUpperCase()}</Tag>;
        }

        return (
          <Space>
            <Text style={{ color: '#e0e0e0' }}>{record.teamName}</Text>
            {roleTag}
          </Space>
        );
      },
    },
    {
      title: getColumnTitleWithInfo('Created By', 'The user who created the instance. \'YOU\' indicates the current logged-in user.'),
      key: 'creator',
      render: (_: any, record: InstanceData) => {
        const isCurrentUserCreator = currentUser && currentUser.email === record.createdBy;
        const displayLabelText = isCurrentUserCreator ? 'YOU' : (record.creatorName || record.createdBy.split('@')[0]);
        
        const displayElement = isCurrentUserCreator ? 
          <Tag color="cyan">YOU</Tag> : 
          <Text style={{ color: '#e0e0e0' }}>{displayLabelText}</Text>;

        return (
          <Tooltip title={record.createdBy}>
            <span style={{ cursor: 'default' }}>
              {displayElement}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Location',
      dataIndex: 'region',
      key: 'location',
      render: (region?: string) => <Text style={{ color: '#e0e0e0' }}>{region?.toUpperCase() || 'N/A'}</Text>,
    },
    {
      title: 'Type',
      key: 'type',
      render: (_: any, record: InstanceData) => (
        <Space>
          {record.gpuType && record.gpuType.toLowerCase() !== 'cpu' && (
            <img src="/nvidia.svg" alt="NVIDIA" style={{ width: '20px', height: 'auto', verticalAlign: 'middle', marginRight: '4px' }} /> 
          )}
          <Text style={{ color: '#e0e0e0' }}>{getInstanceTypeDisplay(record.gpuType, record.gpuCount)}</Text>
        </Space>
      )
    },
    {
      title: 'vCPU',
      dataIndex: 'vcpu',
      key: 'vcpu',
      render: (vcpu?: number) => <Text style={{ color: '#e0e0e0' }}>{vcpu || 'N/A'}</Text>,
    },
    {
      title: 'Memory',
      dataIndex: 'memory',
      key: 'memory',
      render: (memory?: string) => <Text style={{ color: '#e0e0e0' }}>{memory || 'N/A'}</Text>,
    },
    {
      title: 'Storage',
      dataIndex: 'storageSize',
      key: 'storage',
      render: (size?: number) => <Text style={{ color: '#e0e0e0' }}>{size ? `${size} GB` : 'N/A'}</Text>,
    },
    {
      title: getColumnTitleWithInfo('Price', 'Estimated hourly cost for using the instance.'),
      dataIndex: 'hourlyRate',
      key: 'price',
      render: (rate?: number) => <Text style={{ color: '#e0e0e0' }}>{typeof rate === 'number' ? `$${rate.toFixed(3)}/hr` : 'N/A'}</Text>,
    },
    {
      title: getColumnTitleWithInfo('Status', 'Current operational state of the instance (e.g., Running, Stopped).'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusDisplay(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: InstanceData) => (
        <Button 
          type="primary"
          ghost
          size="small"
          onClick={() => handleViewInstance(record)}
          style={{ borderColor: '#40a9ff', color: '#40a9ff' }}
        >
          View
        </Button>
      ),
    },
  ];

  const modalTitle = (
    <Space align="center">
      <Title level={4} style={{ margin: 0, color: "white" }}>Instance Details</Title>
      {selectedInstance?.instanceTypeTag && (
        <Tag color="processing" style={{ marginLeft: 8, fontSize: '13px', padding: '2px 8px' }}>
          {selectedInstance.instanceTypeTag}
        </Tag>
      )}
    </Space>
  );

  return (
    <>
    <style>
        {`
          .instance-list-dark .ant-table {
            background: #141414; // Dark background for the table
            color: #e0e0e0; // Light text color
          }
          .instance-list-dark .ant-table-thead > tr > th {
            background: #1f1f1f; // Slightly lighter header background
            color: #fafafa; // Header text color
            border-bottom: 1px solid #303030;
            font-weight: 500;
          }
          .instance-list-dark .ant-table-tbody > tr > td {
            border-bottom: 1px solid #303030; // Darker border for rows
            padding: 12px 16px; // Adjust padding as needed
          }
          .instance-list-dark .ant-table-tbody > tr.ant-table-row:hover > td {
            background: #262626; // Row hover background
          }
          .instance-list-dark .ant-table-tbody > tr.ant-table-row-selected > td {
            background: #383838;
          }
          .instance-list-dark .ant-pagination-item a {
            color: #e0e0e0;
          }
          .instance-list-dark .ant-pagination-item-active a {
            color: #1890ff;
          }
          .instance-list-dark .ant-pagination-item-active {
            border-color: #1890ff;
          }
          .instance-list-dark .ant-select-selector {
            background-color: #1f1f1f !important;
            border-color: #434343 !important;
            color: #e0e0e0 !important;
          }
          .instance-list-dark .ant-select-arrow {
            color: #e0e0e0 !important;
          }
          .instance-list-dark .ant-table-pagination.ant-pagination {
            margin-top: 24px;
          }
          .instance-list-dark .ant-empty-description {
            color: #777;
          }
          .filter-select .ant-select-selection-item, .filter-select .ant-select-selection-placeholder {
             color: #e0e0e0 !important;
          }
          .search-input .ant-input {
            background-color: #1f1f1f !important;
            border-color: #434343 !important;
            color: #e0e0e0 !important;
          }
          .search-input .ant-input-prefix .anticon {
            color: #e0e0e0 !important;
          }
        `}
      </style>
    <div className="instance-list-dark" style={{ padding: '24px', background: '#000' }}>
      {/* Main container for filters and actions */}
      <Space 
        style={{ 
          marginBottom: 24, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          flexWrap: 'wrap',
          gap: '16px' // Adds space when items wrap
        }}
      >
        {/* Group for filter controls */}
        <Space size="middle" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
          <Text style={{ color: '#e0e0e0' }}>Team:</Text>
          <Select 
            value={selectedTeamFilter} 
            onChange={setSelectedTeamFilter} 
            style={{ width: 200 }}
            className="filter-select"
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ background: '#1f1f1f', color: '#e0e0e0', minWidth: 230 }}
            suffixIcon={<DownOutlined style={{ color: '#e0e0e0' }}/>}
          >
            <Option value="all" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>All</Option>
            <Option value="personal" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>
              <Tag color="blue" style={{ marginRight: "5px" }}>Personal</Tag>Personal Instances
            </Option>
            {teams.map(team => (
              <Option key={team.id} value={team.id} style={{ color: '#e0e0e0', background: '#1f1f1f' }}>{team.name}</Option>
            ))}
          </Select>

          <Text style={{ color: '#e0e0e0' }}>Creator:</Text>
          <Select 
            value={selectedCreatorFilter} 
            onChange={setSelectedCreatorFilter} 
            style={{ width: 200 }}
            className="filter-select"
            dropdownStyle={{ background: '#1f1f1f', color: '#e0e0e0'}}
            suffixIcon={<DownOutlined style={{ color: '#e0e0e0' }}/>}
          >
            <Option value="all" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>All</Option>
            {uniqueCreators.map(([id, name]) => {
              const displayName = currentUser && currentUser.email === id ? 'YOU' : name.split('@')[0];
              return (
                <Option key={id} value={id} style={{ color: '#e0e0e0', background: '#1f1f1f' }}>
                  {displayName}
                </Option>
              );
            })}
          </Select>

          <Text style={{ color: '#e0e0e0' }}>Status:</Text>
          <Select
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            style={{ width: 150 }}
            className="filter-select"
            dropdownStyle={{ background: '#1f1f1f', color: '#e0e0e0'}}
            suffixIcon={<DownOutlined style={{ color: '#e0e0e0' }}/>}
          >
            <Option value="all" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>All</Option>
            <Option value="running" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Running</Option>
            <Option value="stopped" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Stopped</Option>
            <Option value="pending" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Pending</Option>
            <Option value="creating" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Creating</Option>
            <Option value="terminated" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Deleted</Option>
            <Option value="failed" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Failed</Option>
            <Option value="error" style={{ color: '#e0e0e0', background: '#1f1f1f' }}>Error</Option>
          </Select>

          <Input
            placeholder="Search by name"
            value={instanceNameSearch}
            onChange={(e) => setInstanceNameSearch(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            className="search-input"
          />
        </Space>
        
        {/* Group for action buttons */}
        <Space>
          <Button 
            icon={<SyncOutlined spin={loading} />}
            onClick={onRefresh}
            style={{ background: '#1f1f1f', borderColor: '#434343', color: '#e0e0e0' }}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<CloudServerOutlined />}
            onClick={handleDeployClick}
          >
            Deploy
          </Button>
        </Space>
      </Space>
      
      <Table
        columns={columns}
        dataSource={filteredInstances}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total, range) => <Text style={{ color: '#aaa'}}>{`${range[0]}-${range[1]} of ${total} instances`}</Text>,
          pageSizeOptions: ['10', '20', '50', '100'],
          style: { color: '#e0e0e0' }
        }}
      />
    </div>

    {selectedInstance && (
        <Modal
          title={modalTitle}
          open={isModalVisible}
          onCancel={handleCloseModal}
          footer={null}
          width={800}
          destroyOnClose
          bodyStyle={{ backgroundColor: '#1f1f1f', color: 'white', paddingTop: '20px' }}
          maskStyle={{backdropFilter: 'blur(3px)'}}
        >
          {(() => { // IIFE to define constants for the entire modal body
            const labelColor = '#a0a0a0';
            const valueTextStyle: React.CSSProperties = { fontSize: '14px', color: 'rgba(255, 255, 255, 0.95)' };
            const summaryValueTextStyle: React.CSSProperties = { fontSize: '14px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: 'bold' };
            const nameValueTextStyle: React.CSSProperties = { fontSize: '15px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: 'bold' };

            return (
              <div style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                {/* Top Section */}
                <Row gutter={[16,16]} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #303030' }}>
                  <Col span={4}><Text style={{color: labelColor}}>Name:</Text><br/><Text style={nameValueTextStyle}>{selectedInstance.name}</Text></Col>
                  <Col span={4}><Text style={{color: labelColor}}>Status:</Text><br/>{getStatusDisplay(selectedInstance.status, true)}</Col>
                  <Col span={4}><Text style={{color: labelColor}}>Location:</Text><br/><Text style={summaryValueTextStyle}>{selectedInstance.region?.toUpperCase()}</Text></Col>
                  <Col span={5}><Text style={{color: labelColor}}>Served:</Text><br/><Text style={summaryValueTextStyle}>{selectedInstance.servedHours?.toFixed(4)} hours</Text></Col>
                  <Col span={5}><Text style={{color: labelColor}}>Total Cost:</Text><br/><Text style={summaryValueTextStyle}>${selectedInstance.totalCost?.toFixed(4)}</Text></Col>
                </Row>

                {/* Main Details Section */}
                <Row gutter={[32, 24]}>
                  <Col span={8}>
                    <div style={{ marginBottom: '16px'}}><Text style={{color: labelColor}}>Instance Started:</Text><br/><Text style={valueTextStyle}>{dayjs(selectedInstance.createdAt).format('YYYY-MM-DD hh:mm:ss A EST')}</Text></div>
                    <div style={{ marginBottom: '16px'}}><Text style={{color: labelColor}}>vCPU:</Text><br/><Text style={valueTextStyle}>{selectedInstance.vcpu}</Text></div>
                    <div><Text style={{color: labelColor}}>Username:</Text><br/><Text style={valueTextStyle}>{selectedInstance.username}</Text></div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: '16px'}}><Text style={{color: labelColor}}>OS/Image:</Text><br/><Text style={valueTextStyle}>{selectedInstance.osImage}</Text></div>
                    <div style={{ marginBottom: '16px'}}><Text style={{color: labelColor}}>Memory:</Text><br/><Text style={valueTextStyle}>{selectedInstance.memory}</Text></div>
                    <div>
                      <Text style={{color: labelColor}}>Password:</Text><br/>
                      <Space>
                        <Text style={valueTextStyle}>{showPassword ? selectedInstance.password : '******'}</Text>
                        <Tooltip title={showPassword ? "Hide" : "Show"}>
                          <Button icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowPassword(!showPassword)} type="text" size="small" style={{color: 'rgba(255,255,255,0.65)'}}/>
                        </Tooltip>
                        <Tooltip title="Copy Password">
                          <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(selectedInstance.password || ''); message.success("Password copied!");}} type="text" size="small" style={{color: 'rgba(255,255,255,0.65)'}}/>
                        </Tooltip>
                      </Space>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: '16px'}}><Text style={{color: labelColor}}>LAN IP Address:</Text><br/><Text style={valueTextStyle}>{selectedInstance.lanIpAddress}</Text></div>
                    <div style={{ marginBottom: '16px'}}><Text style={{color: labelColor}}>Disk:</Text><br/><Text style={valueTextStyle}>{selectedInstance.storageSize} GB</Text></div>
                    <div><Text style={{color: labelColor}}>Bandwidth:</Text><br/><Text style={valueTextStyle}>{selectedInstance.bandwidth || 'N/A'}</Text></div>
                  </Col>
                  <Col span={24} style={{marginTop: '8px'}}>
                    <Text style={{color: labelColor}}>Public IP Address:</Text><br/><Text style={valueTextStyle}>{selectedInstance.publicIpAddress}</Text>
                  </Col>
                </Row>
                
                <Divider style={{ margin: '24px 0', borderColor: '#303030' }} />
                <Row gutter={[32,16]}>
                    <Col span={8}>
                        <Text style={{color: labelColor}}>Team:</Text><br/>
                        <Text style={valueTextStyle}>{selectedInstance.teamName || (selectedInstance.teamId === 'personal' || !selectedInstance.teamId ? 'Personal' : selectedInstance.teamId)}</Text>
                    </Col>
                    <Col span={8}>
                        <Text style={{color: labelColor}}>Creator:</Text><br/>
                        <Text style={valueTextStyle}>{selectedInstance.creatorName || selectedInstance.createdBy.split('@')[0]}</Text>
                        {currentUser && currentUser.email === selectedInstance.createdBy && <Tag color="cyan" style={{marginLeft: '8px'}}>YOU</Tag>}
                    </Col>
                </Row>
              </div>
            );
          })()} 
        </Modal>
      )}
    </>
  );
};

export default InstanceList;

// Note: For the NVIDIA icon in the 'Type' column, ensure you have an nvidia.svg 
// in your public folder (e.g., public/nvidia.svg).
// You can find one by searching for "nvidia logo svg".
