import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Form, Input, Select, Radio, Tooltip, Divider, Tag, message, Row, Col, Table, Space } from 'antd';
import { CloudOutlined, InfoCircleOutlined, TeamOutlined, FlagOutlined, SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Team {
  id: string;
  name: string;
  description: string;
  role: 'owner' | 'admin' | 'member';
}

interface Creator {
  id: string;
  name: string;
}

interface Workspace {
  id: string;
  name: string;
  location: string;
  charges: string;
  tier: string;
  status: string;
  team: string;
  teamName: string;
  creator: string;
  creatorName: string;
}

interface LocationState {
  fromFirstTime?: boolean;
  selectedTeam?: string;
  creatingStorage?: boolean;
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

  .storage-type-card {
    height: 100%;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
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
    justify-content: center;
    padding: 16px;
  }
  
  .region-card.selected {
    border-color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }

  .pricing-card {
    height: 100%;
    position: sticky;
    top: 20px;
  }

  .filter-row {
    margin-bottom: 16px;
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .status-tag-ready {
    background-color: rgba(82, 196, 26, 0.2);
    color: #52c41a;
    border: 1px solid #52c41a;
  }

  .status-tag-pending {
    background-color: rgba(250, 173, 20, 0.2);
    color: #faad14;
    border: 1px solid #faad14;
  }

  .status-tag-error {
    background-color: rgba(255, 77, 79, 0.2);
    color: #ff4d4f;
    border: 1px solid #ff4d4f;
  }
`;

const Storage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [teams, setTeams] = useState<Team[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 筛选条件状态
  const [nameFilter, setNameFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  // Load teams, creators and workspaces
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Mock data - in a real app, this would come from an API
        const mockTeams: Team[] = [
          { id: '1', name: 'ML Development', description: 'Machine Learning Development Team', role: 'owner' },
          { id: '2', name: 'Research Team', description: 'AI Research Group', role: 'admin' },
          { id: '3', name: 'Production', description: 'Production Environment', role: 'member' },
        ];
        
        const mockCreators: Creator[] = [
          { id: '1', name: 'Leo Zhang' },
          { id: '2', name: 'Alex Chen' },
          { id: '3', name: 'Sarah Johnson' },
        ];
        
        const mockWorkspaces: Workspace[] = [
          { 
            id: '1', 
            name: '1234', 
            location: 'Canada', 
            charges: '$0', 
            tier: 'Standard', 
            status: 'Ready',
            team: '1',
            teamName: 'ML Development',
            creator: '1',
            creatorName: 'Leo Zhang'
          },
          { 
            id: '2', 
            name: 'data-storage', 
            location: 'US', 
            charges: '$2.50', 
            tier: 'Performance', 
            status: 'Ready',
            team: '2',
            teamName: 'Research Team',
            creator: '2',
            creatorName: 'Alex Chen'
          },
          { 
            id: '3', 
            name: 'backup-files', 
            location: 'Canada', 
            charges: '$5.75', 
            tier: 'Accelerated', 
            status: 'Pending',
            team: 'personal',
            teamName: 'Personal',
            creator: '1',
            creatorName: 'Leo Zhang'
          },
          { 
            id: '4', 
            name: 'ml-datasets', 
            location: 'US', 
            charges: '$10.20', 
            tier: 'Standard', 
            status: 'Error',
            team: '3',
            teamName: 'Production',
            creator: '3',
            creatorName: 'Sarah Johnson'
          },
        ];
        
        setTeams(mockTeams);
        setCreators(mockCreators);
        setWorkspaces(mockWorkspaces);
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 处理筛选后的数据
  const getFilteredWorkspaces = () => {
    return workspaces.filter(workspace => {
      // 按名称筛选
      if (nameFilter && !workspace.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      
      // 按团队筛选
      if (teamFilter && workspace.team !== teamFilter) {
        return false;
      }
      
      // 按创建者筛选
      if (creatorFilter && workspace.creator !== creatorFilter) {
        return false;
      }
      
      // 按状态筛选
      if (statusFilter && workspace.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  };

  // 重置所有筛选条件
  const resetFilters = () => {
    setNameFilter('');
    setTeamFilter(null);
    setCreatorFilter(null);
    setStatusFilter(null);
  };

  // 创建新的workspace
  const handleCreateWorkspace = () => {
    navigate('/storage/create');
  };

  // 查看workspace详情
  const handleViewWorkspace = (id: string) => {
    navigate(`/storage/${id}`);
  };

  // 删除workspace
  const handleDeleteWorkspace = (id: string) => {
    message.success(`Workspace ${id} deleted successfully`);
    setWorkspaces(workspaces.filter(workspace => workspace.id !== id));
  };

  // 表格列定义
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8 }}>{location === 'Canada' ? '🇨🇦' : '🇺🇸'}</span>
          <span>{location}</span>
        </div>
      ),
    },
    {
      title: 'Team',
      dataIndex: 'teamName',
      key: 'team',
    },
    {
      title: 'Creator',
      dataIndex: 'creatorName',
      key: 'creator',
    },
    {
      title: 'Charges',
      dataIndex: 'charges',
      key: 'charges',
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let className = '';
        switch (status) {
          case 'Ready':
            className = 'status-tag-ready';
            break;
          case 'Pending':
            className = 'status-tag-pending';
            break;
          case 'Error':
            className = 'status-tag-error';
            break;
          default:
            className = '';
        }
        
        return (
          <span className={className} style={{ padding: '2px 8px', borderRadius: '10px' }}>
            {status === 'Ready' && <span style={{ marginRight: 4 }}>●</span>}
            {status}
          </span>
        );
      },
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: Workspace) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewWorkspace(record.id)}>View</Button>
          <Button type="link" danger onClick={() => handleDeleteWorkspace(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={2}>Object Storage</Title>
        <div style={{ display: 'flex', gap: 16 }}>
          <Button type="link">Pricing</Button>
          <Button type="link">Docs</Button>
          <Button type="link">Referral</Button>
          <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
            <Text strong>$22.60</Text>
          </div>
          <Button type="primary">Deposit</Button>
          <Button>leo zhang <span style={{ marginLeft: 8 }}>▼</span></Button>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="filter-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 60 }}>Name:</Text>
          <Input 
            placeholder="All" 
            value={nameFilter || "All"}
            onChange={(e) => setNameFilter(e.target.value === "All" ? "" : e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 60 }}>Team:</Text>
          <Select
            placeholder="All"
            style={{ width: 150 }}
            value={teamFilter || "All"}
            onChange={(value) => setTeamFilter(value === "All" ? null : value)}
            allowClear
          >
            <Option value="All">All</Option>
            <Option value="personal">Personal</Option>
            {teams.map(team => (
              <Option key={team.id} value={team.id}>{team.name}</Option>
            ))}
          </Select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 60 }}>Creator:</Text>
          <Select
            placeholder="All"
            style={{ width: 150 }}
            value={creatorFilter || "All"}
            onChange={(value) => setCreatorFilter(value === "All" ? null : value)}
            allowClear
          >
            <Option value="All">All</Option>
            {creators.map(creator => (
              <Option key={creator.id} value={creator.id}>{creator.name}</Option>
            ))}
          </Select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 60 }}>Status:</Text>
          <Select
            placeholder="All"
            style={{ width: 150 }}
            value={statusFilter || "All"}
            onChange={(value) => setStatusFilter(value === "All" ? null : value)}
            allowClear
          >
            <Option value="All">All</Option>
            <Option value="Ready">Ready</Option>
            <Option value="Pending">Pending</Option>
            <Option value="Error">Error</Option>
          </Select>
        </div>
        
        <Button 
          icon={<ReloadOutlined />} 
          onClick={resetFilters}
        >
          Reset
        </Button>
        
        <div style={{ flex: 1 }}></div>
        
        <Button type="primary" onClick={handleCreateWorkspace}>Create Workspace</Button>
      </div>

      {/* Workspace列表 */}
      <Table 
        dataSource={getFilteredWorkspaces()} 
        columns={columns} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Storage;