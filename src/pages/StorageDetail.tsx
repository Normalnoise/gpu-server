import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Row, Col, Tag, Tooltip, message, Tabs, Table, Switch } from 'antd';
import { CopyOutlined, ArrowLeftOutlined, TeamOutlined, UserOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Add CSS styles
const styles = `
  .storage-detail-tabs {
    margin-top: -24px;
  }
  .storage-detail-tabs .ant-tabs-nav {
    margin-bottom: 24px;
  }
  .storage-detail-tabs .ant-tabs-tab {
    color: #666;
  }
  .storage-detail-tabs .ant-tabs-tab-active {
    color: #fff !important;
  }
  .storage-detail-tabs .ant-tabs-ink-bar {
    background: #4F46E5;
  }
  .bucket-table {
    background: #1f1f1f;
    border-radius: 8px;
  }
  .bucket-table .ant-table {
    background: transparent;
  }
  .bucket-table .ant-table-thead > tr > th {
    background: #1f1f1f;
    color: #666;
    border-bottom: 1px solid #303030;
  }
  .bucket-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #303030;
    color: #fff;
  }
  .bucket-table .ant-table-tbody > tr:hover > td {
    background: #2f2f2f !important;
  }
  .bucket-table .ant-switch-checked {
    background: #4F46E5;
  }
  .bucket-delete-btn {
    background: transparent;
    border: 1px solid #303030;
    color: #fff;
  }
  .bucket-delete-btn:hover {
    border-color: #ff4d4f;
    color: #ff4d4f;
  }
`;

interface StorageDetailProps {
  // Add props if needed
}

const StorageDetail: React.FC<StorageDetailProps> = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with real API call
  const storageData = {
    label: '1234',
    type: 'Personal', // or 'Team'
    location: '🇨🇦 Canada',
    tier: 'Standard',
    dataStorage: 'Free',
    outgoingTraffic: '$0.01/GB',
    hostname: 's3-us-east.nebulablock.com',
    secretKey: '******',
    accessKey: 'HTgBl70Sa...tNJijTDyX',
    storageUsage: '2,913 KB',
    bandwidthUsage: '5,904 KB',
    currentCharges: '$0'
  };

  // Mock buckets data
  const bucketsData = [
    {
      key: '1',
      name: '123456',
      fileNum: 1,
      storageSize: '2.913 KB',
      privacy: true,
      dateCreated: '2025-05-29 05:27:27 EST'
    },
    {
      key: '2',
      name: '1234567',
      fileNum: 0,
      storageSize: '0.000 B',
      privacy: false,
      dateCreated: '2025-05-29 05:27:36 EST'
    },
    {
      key: '3',
      name: '12345678',
      fileNum: 0,
      storageSize: '0.000 B',
      privacy: false,
      dateCreated: '2025-05-29 05:27:41 EST'
    },
    {
      key: '4',
      name: '123456789',
      fileNum: 0,
      storageSize: '0.000 B',
      privacy: false,
      dateCreated: '2025-05-29 05:27:47 EST'
    }
  ];

  // Add styles to the page
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const handleDeleteBucket = (name: string) => {
    message.success(`Bucket ${name} deleted`);
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
      title: (
        <span>
          Privacy <Tooltip title="Set bucket access permission"><InfoCircleOutlined style={{ color: '#666' }} /></Tooltip>
        </span>
      ),
      dataIndex: 'privacy',
      key: 'privacy',
      render: (privacy: boolean) => (
        <Switch
          checked={privacy}
          checkedChildren="Private"
          unCheckedChildren="Public"
        />
      ),
    },
    {
      title: 'Date Created',
      dataIndex: 'dateCreated',
      key: 'dateCreated',
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          onClick={() => handleDeleteBucket(record.name)}
          className="bucket-delete-btn"
        >
          Delete
        </Button>
      ),
    },
  ];

  const OverviewContent = () => (
    <>
      {/* Overview Cards */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card 
            bordered={false} 
            style={{ background: '#1f1f1f', borderRadius: '8px' }}
          >
            <Text style={{ color: '#666' }}>Storage Usage</Text>
            <Title level={3} style={{ color: '#4F46E5', margin: '8px 0 0 0' }}>{storageData.storageUsage}</Title>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            bordered={false} 
            style={{ background: '#1f1f1f', borderRadius: '8px' }}
          >
            <Text style={{ color: '#666' }}>Bandwidth Usage</Text>
            <Title level={3} style={{ color: '#4F46E5', margin: '8px 0 0 0' }}>{storageData.bandwidthUsage}</Title>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            bordered={false} 
            style={{ background: '#1f1f1f', borderRadius: '8px' }}
          >
            <Text style={{ color: '#666' }}>Current Charges</Text>
            <Title level={3} style={{ color: '#4F46E5', margin: '8px 0 0 0' }}>{storageData.currentCharges}</Title>
          </Card>
        </Col>
      </Row>

      {/* Detail Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Storage Information</span>
                <Tag 
                  icon={storageData.type === 'Personal' ? <UserOutlined /> : <TeamOutlined />}
                  style={{ 
                    margin: 0,
                    background: 'transparent',
                    border: '1px solid #4F46E5',
                    color: '#4F46E5'
                  }}
                >
                  {storageData.type}
                </Tag>
              </div>
            }
            bordered={false}
            style={{ background: '#1f1f1f', borderRadius: '8px' }}
            headStyle={{ background: '#1f1f1f', borderBottom: '1px solid #303030' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Text style={{ color: '#666' }}>Label:</Text>
                <div style={{ color: '#fff', marginTop: '4px' }}>{storageData.label}</div>
              </div>
              <div>
                <Text style={{ color: '#666' }}>Location:</Text>
                <div style={{ color: '#fff', marginTop: '4px' }}>{storageData.location}</div>
              </div>
              <div>
                <Text style={{ color: '#666' }}>Tier:</Text>
                <div style={{ color: '#fff', marginTop: '4px' }}>{storageData.tier}</div>
              </div>
              <div>
                <Text style={{ color: '#666' }}>Data Storage:</Text>
                <div style={{ color: '#fff', marginTop: '4px' }}>{storageData.dataStorage}</div>
              </div>
              <div>
                <Text style={{ color: '#666' }}>Outgoing Traffic:</Text>
                <div style={{ color: '#fff', marginTop: '4px' }}>{storageData.outgoingTraffic}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="S3 Credentials"
            bordered={false}
            style={{ background: '#1f1f1f', borderRadius: '8px' }}
            headStyle={{ background: '#1f1f1f', borderBottom: '1px solid #303030' }}
            extra={
              <Button type="primary" style={{ background: '#4F46E5' }}>Regenerate Key</Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Text style={{ color: '#666' }}>Hostname:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Text style={{ color: '#fff' }}>{storageData.hostname}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined style={{ color: '#4F46E5' }} />}
                    onClick={() => copyToClipboard(storageData.hostname)}
                  />
                </div>
              </div>
              <div>
                <Text style={{ color: '#666' }}>Secret Key:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Text style={{ color: '#fff' }}>{storageData.secretKey}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined style={{ color: '#4F46E5' }} />}
                    onClick={() => copyToClipboard(storageData.secretKey)}
                  />
                </div>
              </div>
              <div>
                <Text style={{ color: '#666' }}>Access Key:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Text style={{ color: '#fff' }}>{storageData.accessKey}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined style={{ color: '#4F46E5' }} />}
                    onClick={() => copyToClipboard(storageData.accessKey)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

  const BucketsContent = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <Button type="primary" style={{ background: '#4F46E5' }}>Create Bucket</Button>
        <Button icon={<ReloadOutlined />}>Refresh</Button>
      </div>
      <Table
        columns={columns}
        dataSource={bucketsData}
        pagination={false}
        className="bucket-table"
      />
    </div>
  );

  return (
    <div style={{ padding: '24px', background: '#141414', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        borderBottom: '1px solid #303030',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            onClick={() => navigate('/storage')} 
            type="text" 
            icon={<ArrowLeftOutlined />}
            style={{ color: '#fff' }}
          >
            Back
          </Button>
          <div style={{ width: '1px', height: '20px', background: '#303030' }} />
          <Text style={{ color: '#fff' }}>{storageData.label}</Text>
          <Tag 
            icon={storageData.type === 'Personal' ? <UserOutlined /> : <TeamOutlined />}
            style={{ 
              margin: 0,
              background: 'transparent',
              border: '1px solid #4F46E5',
              color: '#4F46E5'
            }}
          >
            {storageData.type}
          </Tag>
          <div style={{ width: '1px', height: '20px', background: '#303030' }} />
          <Button type="text" style={{ padding: 0 }}>🗑</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            label: 'Overview',
            key: 'overview',
            children: <OverviewContent />
          },
          {
            label: 'Buckets',
            key: 'buckets',
            children: <BucketsContent />
          }
        ]}
        className="storage-detail-tabs"
      />
    </div>
  );
};

export default StorageDetail; 