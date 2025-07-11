import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Tabs, Button, Space, Table, Row, Col, Tooltip, Tag } from 'antd';
import { ArrowLeftOutlined, CopyOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { Title, Text } = Typography;

interface TeamInfo {
  id: string;
  name: string;
  type: 'personal' | 'team';
}

interface WorkspacePermissions {
  canDelete: boolean;
  canEdit: boolean;
  canView: boolean;
}

interface BucketData {
  name: string;
  fileNum: number;
  storageSize: string;
  dateCreated: string;
}

interface WorkspaceData {
  label: string;
  location: string;
  tier: string;
  dataStorage: string;
  outgoingTraffic: string;
  hostname: string;
  secretKey: string;
  accessKey: string;
  storageUsage: string;
  bandwidthUsage: string;
  currentCharges: string;
  team: TeamInfo;
  permissions: WorkspacePermissions;
}

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual API calls
  const workspaceData: WorkspaceData = {
    label: id || '',
    location: 'Canada',
    tier: 'Standard',
    dataStorage: '$0.008/GB/month',
    outgoingTraffic: '$0.01/GB',
    hostname: 's3-us-east.nebulablock.com',
    secretKey: '******',
    accessKey: 'HTgBI70Sa...tNJ1jTDyX',
    storageUsage: '0.000 B',
    bandwidthUsage: '0.000 B',
    currentCharges: '$0',
    team: {
      id: '1',
      name: 'My Team',
      type: 'team'
    },
    permissions: {
      canDelete: true,
      canEdit: true,
      canView: true
    }
  };

  const buckets: BucketData[] = [
    {
      name: '123456',
      fileNum: 0,
      storageSize: '0.000 B',
      dateCreated: '2025-05-29 05:27:27 EST'
    },
    // Add more buckets as needed
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add a notification here if desired
  };

  const handleRegenerateKey = () => {
    // Implement key regeneration logic
  };

  const handleDeleteBucket = (bucketName: string) => {
    // Implement delete bucket logic
    console.log('Deleting bucket:', bucketName);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'File Num',
      dataIndex: 'fileNum',
      key: 'fileNum',
    },
    {
      title: 'Storage Size',
      dataIndex: 'storageSize',
      key: 'storageSize',
    },
    {
      title: 'Date Created',
      dataIndex: 'dateCreated',
      key: 'dateCreated',
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: BucketData) => (
        workspaceData.permissions.canDelete ? (
          <Button 
            type="text" 
            danger 
            onClick={() => handleDeleteBucket(record.name)}
          >
            Delete
          </Button>
        ) : null
      ),
    },
  ];

  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Text>Storage Usage</Text>
                <Title level={2} style={{ color: '#6366f1', margin: '8px 0' }}>{workspaceData.storageUsage}</Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Text>Bandwidth Usage</Text>
                <Title level={2} style={{ color: '#6366f1', margin: '8px 0' }}>{workspaceData.bandwidthUsage}</Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Text>Current Charges</Text>
                <Title level={2} style={{ color: '#6366f1', margin: '8px 0' }}>{workspaceData.currentCharges}</Title>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col span={12}>
              <Card title="Storage Information" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Label:</Text>
                    <Space>
                      <Text>{workspaceData.label}</Text>
                      <Tag icon={workspaceData.team.type === 'personal' ? <UserOutlined /> : <TeamOutlined />}>
                        {workspaceData.team.type === 'personal' ? 'Personal' : workspaceData.team.name}
                      </Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Location:</Text>
                    <Space>
                      <span>🇨🇦</span>
                      <Text>{workspaceData.location}</Text>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Tier:</Text>
                    <Text>{workspaceData.tier}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Data Storage:</Text>
                    <Text>{workspaceData.dataStorage}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Outgoing Traffic:</Text>
                    <Text>{workspaceData.outgoingTraffic}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="S3 Credentials" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Hostname:</Text>
                    <Space>
                      <Text>{workspaceData.hostname}</Text>
                      <Tooltip title="Copy">
                        <Button icon={<CopyOutlined />} type="text" onClick={() => handleCopy(workspaceData.hostname)} />
                      </Tooltip>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Secret Key:</Text>
                    <Space>
                      <Text>{workspaceData.secretKey}</Text>
                      <Tooltip title="Copy">
                        <Button icon={<CopyOutlined />} type="text" onClick={() => handleCopy(workspaceData.secretKey)} />
                      </Tooltip>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Access Key:</Text>
                    <Space>
                      <Text>{workspaceData.accessKey}</Text>
                      <Tooltip title="Copy">
                        <Button icon={<CopyOutlined />} type="text" onClick={() => handleCopy(workspaceData.accessKey)} />
                      </Tooltip>
                    </Space>
                  </div>
                  <Button type="primary" onClick={handleRegenerateKey} style={{ marginTop: '16px' }}>
                    Regenerate Key
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'buckets',
      label: 'Buckets',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
            <Button type="primary">Create Bucket</Button>
            <Button icon={<ReloadOutlined />}>Refresh</Button>
          </div>
          <Table
            columns={columns}
            dataSource={buckets}
            rowKey="name"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          type="text"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>{id}</Title>
      </Space>

      <Tabs 
        activeKey={activeTab} 
        items={items} 
        onChange={(key) => setActiveTab(key)}
      />
    </div>
  );
};

export default WorkspaceDetail; 