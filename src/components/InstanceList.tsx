import React from 'react';
import { Button, Table, Tag } from 'antd';
import { CloudServerOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export interface InstanceData {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'terminated' | 'pending' | 'error' | string;
  teamId: string;
  teamName?: string;
  createdBy: string;
  creatorName?: string;
  gpuCount: number;
  storageSize: number;
  ipAddress?: string;
  createdAt: string | Date;
  region?: string;
  vcpu?: number;
  memory?: string;
  os?: string;
  publicIpAddress?: string;
  disk?: number;
  bandwidth?: string;
  hourlyRate?: number;
  role?: string;
}

interface InstanceListProps {
  instances: InstanceData[];
  onRefresh: () => void;
  loading?: boolean;
}

const InstanceList: React.FC<InstanceListProps> = ({ 
  instances = [], 
  onRefresh, 
  loading = false 
}) => {
  const navigate = useNavigate();
  
  const handleDeployClick = () => {
    // Navigate to the instances page with creatingInstance set to true
    navigate('/instances', { state: { creatingInstance: true } });
  };

  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return <Tag color="success">Running</Tag>;
      case 'stopped':
        return <Tag color="warning">Stopped</Tag>;
      case 'terminated':
        return <Tag color="error">Terminated</Tag>;
      case 'pending':
        return <Tag color="processing">Pending</Tag>;
      case 'error':
        return <Tag color="error">Error</Tag>;
      default:
        return <Tag>{status || 'Unknown'}</Tag>;
    }
  };

  const getRoleTagColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'red';
      case 'member':
        return 'blue';
      case 'viewer':
        return 'green';
      default:
        return 'default';
    }
  };

  const handleViewInstance = (instance: InstanceData) => {
    navigate(`/instances/${instance.id}`);
  };

  const columns = [
    {
      title: 'Instance Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: InstanceData) => (
        <Button 
          type="link" 
          onClick={() => handleViewInstance(record)}
          style={{ padding: 0 }}
        >
          {text || 'Untitled Instance'}
        </Button>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusDisplay(status)
    },
    {
      title: 'Team/Personal',
      key: 'team',
      render: (_: any, record: InstanceData) => (
        <div>
          {record.teamName ? (
            <Tag color="blue">{record.teamName}</Tag>
          ) : (
            <Tag>Personal</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Creator',
      key: 'creator',
      render: (_: any, record: InstanceData) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{record.creatorName || record.createdBy}</span>
          {record.role && (
            <Tag color={getRoleTagColor(record.role)}>
              {record.role.charAt(0).toUpperCase() + record.role.slice(1)}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'region',
      key: 'region',
      render: (text: string) => text || 'N/A'
    },
    {
      title: 'vCPU',
      key: 'vcpu',
      render: (_: any, record: InstanceData) => record.vcpu || 'N/A'
    },
    {
      title: 'Memory',
      key: 'memory',
      render: (_: any, record: InstanceData) => record.memory || 'N/A'
    },
    {
      title: 'Storage',
      dataIndex: 'storageSize',
      key: 'storage',
      render: (size: number) => size ? `${size}GB` : 'N/A'
    },
    {
      title: 'Price',
      dataIndex: 'hourlyRate',
      key: 'price',
      render: (rate: number) => rate ? `$${rate.toFixed(2)}/hr` : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InstanceData) => (
        <Button 
          type="link" 
          onClick={() => handleViewInstance(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="instance-list" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>GPU Instances</h2>
        <div>
          <Button 
            icon={<SyncOutlined spin={loading} />} 
            onClick={onRefresh}
            style={{ marginRight: 8 }}
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
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={instances}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} instances`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        style={{ 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        }}
      />
    </div>
  );
};

export default InstanceList;
