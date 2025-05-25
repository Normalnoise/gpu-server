import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Typography, 
  Button, 
  Space, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  DatePicker, 
  Modal, 
  Tooltip,
  Input
} from 'antd';
import {
  CloudServerOutlined,
  PoweroffOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { InstanceData, updateInstanceStatus } from '../services/instanceService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

interface TeamInstanceListProps {
  instances: InstanceData[];
  teamMembers: Array<{
    id: string;
    email: string;
    name?: string;
    role: 'owner' | 'admin' | 'member';
    isCurrentUser?: boolean;
  }>;
  currentUserRole: 'owner' | 'admin' | 'member';
  currentUserEmail: string;
  onRefresh: () => void;
}

const TeamInstanceList: React.FC<TeamInstanceListProps> = ({
  instances,
  teamMembers,
  currentUserRole,
  currentUserEmail,
  onRefresh
}) => {
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Calculate summary statistics based on Member and Date filters
  const summary = React.useMemo(() => {
    let totalInstances = 0;
    let runningInstances = 0;
    let totalCost = 0;

    instances.forEach(instance => {
      // Apply member filter
      if (memberFilter !== 'all' && instance.createdBy !== memberFilter) {
        return;
      }

      // Apply date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const instanceDate = dayjs(instance.createdAt);
        if (instanceDate.isBefore(dateRange[0], 'day') || instanceDate.isAfter(dateRange[1], 'day')) {
          return;
        }
      }
      
      totalInstances++;
      if (instance.status === 'running') {
        runningInstances++;
      }
      totalCost += instance.totalCost;
    });

    return {
      total: totalInstances,
      running: runningInstances,
      cost: totalCost.toFixed(2)
    };
  }, [instances, memberFilter, dateRange]);

  // Filter instances for the table based on ALL filters
  const filteredInstances = React.useMemo(() => {
    return instances.filter(instance => {
      // Apply member filter
      if (memberFilter !== 'all' && instance.createdBy !== memberFilter) {
        return false;
      }

      // Apply status filter
      if (statusFilter !== 'all' && instance.status !== statusFilter) {
        return false;
      }

      // Apply date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const instanceDate = dayjs(instance.createdAt);
        if (instanceDate.isBefore(dateRange[0], 'day') || instanceDate.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }

      // Apply search text
      if (searchText && !instance.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [instances, memberFilter, statusFilter, dateRange, searchText]);

  // Check if user has permission to manage instances
  const hasManagePermission = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Handle instance status change (stop/terminate)
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

  // Format status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'creating':
        return <Tag color="processing">Creating</Tag>;
      case 'running':
        return <Tag color="success">Running</Tag>;
      case 'stopped':
        return <Tag color="warning">Stopped</Tag>;
      case 'terminated':
        return <Tag color="error">Terminated</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Find member name by email
  const getMemberName = (email: string) => {
    const member = teamMembers.find(m => m.email === email);
    return member?.name || member?.email || email;
  };

  // Table columns
  const columns = [
    {
      title: 'Instance Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Text strong style={{ color: 'white' }}>{text}</Text>
      )
    },
    {
      title: 'Created By',
      key: 'creator',
      render: (_: any, record: InstanceData) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text>{getMemberName(record.createdBy)}</Text>
          {record.creatorRole && (
            <Tag 
              color={
                record.creatorRole === 'owner' ? 'gold' : 
                record.creatorRole === 'admin' ? 'blue' : 'green'
              } 
              style={{ marginLeft: '8px' }}
            >
              {record.creatorRole.toUpperCase()}
            </Tag>
          )}
          {record.createdBy === currentUserEmail && (
            <Tag color="cyan" style={{ marginLeft: '4px' }}>YOU</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Created On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => (
        <Text>{dayjs(date).format('YYYY-MM-DD HH:mm')}</Text>
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
        <Text>{`${record.gpuType.toUpperCase()} (${record.gpuCount}x)`}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusDisplay(status)
    },
    {
      title: 'Cost',
      key: 'cost',
      render: (_: any, record: InstanceData) => (
        <Text>${record.totalCost.toFixed(2)}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InstanceData) => (
        <Space>
          {hasManagePermission || record.createdBy === currentUserEmail ? (
            <>
              {record.status === 'running' && (
                <Tooltip title="Power Off">
                  <Button 
                    icon={<PoweroffOutlined />} 
                    loading={loadingStates[record.id]} 
                    onClick={() => handleStatusChange(record.id, 'stopped')}
                  />
                </Tooltip>
              )}
              {record.status === 'stopped' && (
                <Tooltip title="Start">
                  <Button 
                    type="primary" 
                    ghost 
                    icon={<PoweroffOutlined />} 
                    loading={loadingStates[record.id]} 
                    onClick={() => handleStatusChange(record.id, 'running')}
                  />
                </Tooltip>
              )}
              <Tooltip title="Terminate">
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  loading={loadingStates[record.id]} 
                  onClick={() => handleStatusChange(record.id, 'terminated')}
                  disabled={record.status === 'terminated'}
                />
              </Tooltip>
            </>
          ) : (
            <Text type="secondary">No permission</Text>
          )}
        </Space>
      )
    }
  ];

  // Custom table CSS styles
  const tableStyles = {
    '.ant-table': {
      backgroundColor: 'transparent !important',
      color: 'white !important',
    },
    '.ant-table-thead > tr > th': {
      backgroundColor: '#141414 !important',
      color: 'rgba(255, 255, 255, 0.85) !important',
      borderBottom: '1px solid #303030 !important',
    },
    '.ant-table-tbody > tr > td': {
      borderBottom: '1px solid #262626 !important',
      color: 'rgba(255, 255, 255, 0.65) !important',
    },
    '.ant-table-tbody > tr:hover > td': {
      backgroundColor: 'rgba(255, 255, 255, 0.04) !important',
    },
    '.filter-bar': {
      marginBottom: '16px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      alignItems: 'center',
    },
    '.stat-card': {
      backgroundColor: '#1a1a1a',
      borderColor: '#303030',
    }
  };

  useEffect(() => {
    // Add custom styles to page
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = Object.entries(tableStyles)
      .map(([selector, rules]) => {
        if (typeof rules === 'string') {
          return `${selector} { ${rules} }`;
        }
        return Object.entries(rules)
          .map(([prop, value]) => `${selector} { ${prop}: ${value}; }`)
          .join('\n');
      })
      .join('\n');
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div>
      {/* Top Filters (Member and Date Range) */}
      <Space wrap style={{ marginBottom: '16px', width: '100%', alignItems: 'center' }} size={12}>
        <Text strong style={{ color: 'white' }}>Member:</Text>
        <Select
          placeholder="Team Member"
          style={{ width: 180 }}
          value={memberFilter}
          onChange={setMemberFilter}
        >
          <Option value="all">All</Option>
          {teamMembers.map(member => {
            const displayName = member.name ? `${member.name} (${member.email})` : member.email;
            return (
              <Option key={member.id} value={member.email}>
                {displayName} {member.isCurrentUser && '(You)'}
              </Option>
            );
          })}
        </Select>
        
        <Text strong style={{ color: 'white' }}>Date Range:</Text>
        <RangePicker 
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          style={{ width: 230 }}
          className="dark-theme-rangepicker"
          popupClassName="dark-theme-rangepicker-popup"
        />
      </Space>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title={<Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Total Instances</Text>}
              value={summary.total}
              valueStyle={{ color: '#ffffff' }}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title={<Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Running Instances</Text>}
              value={summary.running}
              valueStyle={{ color: '#52c41a' }}
              prefix={<PoweroffOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title={<Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Total Cost</Text>}
              value={summary.cost}
              precision={2}
              valueStyle={{ color: '#ffffff' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Bottom Filter Bar (Status, Search, Refresh) */}
      <div className="filter-bar" style={{ alignItems: 'center' }}>
        <Text strong style={{ color: 'white' }}>Status:</Text>
        <Select
          placeholder="Status"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="all">All</Option>
          <Option value="creating">Creating</Option>
          <Option value="running">Running</Option>
          <Option value="stopped">Stopped</Option>
          <Option value="terminated">Terminated</Option>
        </Select>
        
        <Text strong style={{ color: 'white' }}>Name:</Text>
        <Input
          placeholder="Search by name"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        
        <Button 
          icon={<ReloadOutlined />} 
          onClick={onRefresh}
          style={{ marginLeft: 'auto' }}
        >
          Refresh
        </Button>
      </div>

      {/* Instances Table */}
      <Table
        columns={columns}
        dataSource={filteredInstances}
        rowKey="id"
        pagination={{ 
          pageSize: 10,
          showSizeChanger: false
        }}
      />

      {/* Permission Info */}
      {!hasManagePermission && (
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">
            <InfoCircleOutlined style={{ marginRight: '8px' }} />
            Note: Only team owners and admins can manage instances created by other team members.
            You can manage instances you created yourself.
          </Text>
        </div>
      )}
    </div>
  );
};

export default TeamInstanceList; 