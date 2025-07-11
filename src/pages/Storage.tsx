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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 筛选条件状态
  const [nameFilter, setNameFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
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

  // Load teams and workspaces
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
    return workspaces.filter(ws => {
      const nameMatch = nameFilter ? ws.name.toLowerCase().includes(nameFilter.toLowerCase()) : true;
      const teamMatch = teamFilter ? ws.team === teamFilter : true;
      const statusMatch = statusFilter ? ws.status === statusFilter : true;
      return nameMatch && teamMatch && statusMatch;
    });
  };

  // 重置筛选条件
  const resetFilters = () => {
    setNameFilter('');
    setTeamFilter(null);
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
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <CloudOutlined style={{ marginRight: '8px' }} />
          Workspace Name
        </Text>
      ),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <FlagOutlined style={{ marginRight: '8px' }} />
          Location
        </Text>
      ),
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
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          Team
        </Text>
      ),
      dataIndex: 'teamName',
      key: 'team',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <InfoCircleOutlined style={{ marginRight: '8px' }} />
          Status
        </Text>
      ),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let tagClass = '';
        if (status === 'Ready') tagClass = 'status-tag-ready';
        else if (status === 'Pending') tagClass = 'status-tag-pending';
        else if (status === 'Error') tagClass = 'status-tag-error';
        return <Tag className={tagClass}>{status}</Tag>;
      }
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
          Actions
        </Text>
      ),
      key: 'action',
      align: 'right' as const,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 /* Increased margin */ }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>Object Storage Workspaces</Title>
          <Paragraph type="secondary" style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)' /* Lighter color for better readability */ }}>
            Manage and organize your object storage resources by creating workspaces. Each workspace acts as a container for your storage buckets, allowing for better project isolation and resource management.
          </Paragraph>
        </div>
        <Button type="primary" icon={<CloudOutlined />} onClick={handleCreateWorkspace} size="large">
          Create Workspace
        </Button>
      </div>

      {/* 筛选区域 */}
      <div className="filter-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 60 }}>Name:</Text>
          <Input 
            placeholder="Search by Workspace Name" 
            prefix={<SearchOutlined />} 
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={{ width: 200 }}
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