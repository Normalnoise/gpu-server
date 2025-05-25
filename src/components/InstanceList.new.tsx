import React from 'react';
import { Button, Table, Tag, Typography } from 'antd';
import { CloudServerOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

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
    navigate('/instances', { state: { creatingInstance: true } });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      running: { color: 'green', text: 'Running' },
      stopped: { color: 'orange', text: 'Stopped' },
      terminated: { color: 'red', text: 'Terminated' },
      pending: { color: 'blue', text: 'Pending' },
      error: { color: 'red', text: 'Error' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: 'Instance Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Team',
      dataIndex: 'teamName',
      key: 'team',
      render: (teamName: string) => teamName || 'Personal',
    },
    {
      title: 'Created By',
      dataIndex: 'creatorName',
      key: 'creator',
      render: (creator: string, record: InstanceData) => 
        creator || record.createdBy || 'Unknown',
    },
    {
      title: 'GPU Count',
      dataIndex: 'gpuCount',
      key: 'gpuCount',
      align: 'right' as const,
    },
    {
      title: 'Storage',
      dataIndex: 'storageSize',
      key: 'storage',
      render: (size: number) => `${size} GB`,
      align: 'right' as const,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleString();
      },
    },
  ];

  return (
    <div className="instance-list" style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <Button 
          type="primary" 
          icon={<CloudServerOutlined />}
          onClick={handleDeployClick}
        >
          Deploy New Instance
        </Button>
        <Button 
          onClick={onRefresh}
          loading={loading}
          icon={<LoadingOutlined />}
        >
          Refresh
        </Button>
      </div>
      
      <Table 
        dataSource={instances}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} instances`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        style={{ 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)'
        }}
      />
    </div>
  );
};

export default InstanceList;
