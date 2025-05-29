import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Descriptions, Tag, Space, Spin, Divider, Row, Col } from 'antd';
import { ArrowLeftOutlined, CloudServerOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Assume this interface is consistent with InstanceData in InstanceList.tsx
interface InstanceData {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'terminated' | 'pending' | 'error' | 'failed' | 'creating' | string;
  teamId: string;
  teamName?: string;
  createdBy: string;
  creatorName?: string;
  gpuType: string;
  gpuCount?: number;
  vcpu?: number;
  memory?: string;
  storageSize: number;
  ipAddress?: string;
  createdAt: string | Date;
  region?: string;
  hourlyRate?: number;
}

const InstanceDetail: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInstanceDetails = async () => {
      setLoading(true);
      try {
        // This should be code to get instance details from the API
      // Since there is no actual API, we use mock data
        const mockInstance: InstanceData = {
          id: instanceId || 'unknown',
          name: `Instance-${instanceId?.substring(0, 6)}`,
          status: 'running',
          teamId: 'personal',
          teamName: 'Personal',
          createdBy: 'user@example.com',
          creatorName: 'Current User',
          gpuType: 'a100',
          gpuCount: 1,
          vcpu: 8,
          memory: '32 GB',
          storageSize: 100,
          ipAddress: '192.168.1.100',
          createdAt: new Date().toISOString(),
          region: 'US',
          hourlyRate: 1.99
        };

        // Simulate API delay
        setTimeout(() => {
          setInstance(mockInstance);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching instance details:', error);
        setLoading(false);
      }
    };

    if (instanceId) {
      fetchInstanceDetails();
    }
  }, [instanceId]);

  const getStatusDisplay = (status: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'running':
        return <Tag color="green">Running</Tag>;
      case 'stopped':
        return <Tag color="orange">Stopped</Tag>;
      case 'terminated':
        return <Tag color="red">Terminated</Tag>;
      case 'pending':
      case 'creating':
        return <Tag color="blue">Pending</Tag>;
      case 'failed':
        return <Tag color="red">Failed</Tag>;
      case 'error':
        return <Tag color="red">Error</Tag>;
      default:
        return <Tag>{status || 'Unknown'}</Tag>;
    }
  };

  const getInstanceTypeDisplay = (gpuType: string, gpuCount?: number) => {
    if (gpuType?.toLowerCase() === 'cpu') return 'CPU';
    if (gpuType?.toLowerCase() === 'a100') return `A100-80G-PCIe${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
    if (gpuType?.toLowerCase() === 'h100') return `H100-80G-HBM3${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
    if (gpuType?.toLowerCase() === 'rtx-4090' || gpuType?.toLowerCase() === 'rtx4090') return `RTX-4090${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
    if (gpuType?.toLowerCase() === 'l4') return `L4 Tensor Core${gpuCount && gpuCount > 1 ? ` x${gpuCount}` : ''}`;
    return gpuType || 'N/A';
  };

  const handleBackClick = () => {
    navigate('/instances');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>
          <Text>Loading instance details...</Text>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text>Instance not found or an error occurred.</Text>
          <div style={{ marginTop: '20px' }}>
            <Button type="primary" onClick={handleBackClick}>
              <ArrowLeftOutlined /> Back to Instances
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button type="link" onClick={handleBackClick} style={{ paddingLeft: 0 }}>
          <ArrowLeftOutlined /> Back to Instances
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudServerOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
            <Title level={4} style={{ margin: 0 }}>{instance.name}</Title>
          </div>
          <Space>
            {getStatusDisplay(instance.status)}
          </Space>
        </div>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Descriptions title="Instance Details" bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Instance ID">{instance.id}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusDisplay(instance.status)}</Descriptions.Item>
              <Descriptions.Item label="Region">{instance.region}</Descriptions.Item>
              <Descriptions.Item label="Created At">{new Date(instance.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="GPU Type">{getInstanceTypeDisplay(instance.gpuType, instance.gpuCount)}</Descriptions.Item>
              <Descriptions.Item label="vCPU">{instance.vcpu}</Descriptions.Item>
              <Descriptions.Item label="Memory">{instance.memory}</Descriptions.Item>
              <Descriptions.Item label="Storage">{instance.storageSize} GB</Descriptions.Item>
              <Descriptions.Item label="IP Address">{instance.ipAddress || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Hourly Rate">${instance.hourlyRate?.toFixed(2) || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Team">{instance.teamName || 'Personal'}</Descriptions.Item>
              <Descriptions.Item label="Created By">{instance.creatorName || instance.createdBy}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button type="primary" danger disabled={instance.status !== 'running'}>
              Stop Instance
            </Button>
            <Button type="primary" disabled={instance.status !== 'stopped'}>
              Start Instance
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default InstanceDetail;