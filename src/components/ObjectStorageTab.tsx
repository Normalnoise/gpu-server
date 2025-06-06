import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Input, Statistic, Table, Space, Button, Tag, Collapse, Typography, Divider, Modal, message } from 'antd';
import { 
  CloudOutlined, 
  SearchOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  DownOutlined,
  FolderOutlined,
  DatabaseOutlined,
  FileOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;
const { Text, Title } = Typography;

interface Bucket {
  id: string;
  name: string;
  region: string;
  size: string;
  fileCount: number;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  creator: string;
  region: string;
  cost: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  buckets: Bucket[];
}

interface ObjectStorageTabProps {
  teamId: string;
}

interface S3Credentials {
  hostname: string;
  secretKey: string;
  accessKey: string;
}

const ObjectStorageTab: React.FC<ObjectStorageTabProps> = ({ teamId }) => {
  // States for filters
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedCreator, setSelectedCreator] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  
  // States for data
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>([]);
  const [credentialsVisible, setCredentialsVisible] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [secretKeyVisible, setSecretKeyVisible] = useState(false);

  // Mock statistics
  const statistics = {
    totalWorkspaces: workspaces.length,
    totalBuckets: workspaces.reduce((acc, ws) => acc + ws.buckets.length, 0),
    totalStorage: '2.5 TB',
    totalFiles: workspaces.reduce((acc, ws) => 
      acc + ws.buckets.reduce((bacc, b) => bacc + b.fileCount, 0), 0
    ),
  };

  // Load mock data
  useEffect(() => {
    const mockData: Workspace[] = [
      {
        id: '1',
        name: 'ml-training',
        creator: 'John Doe',
        region: 'US East',
        cost: '$120.50',
        status: 'active',
        createdAt: '2024-03-15',
        buckets: [
          {
            id: 'b1',
            name: 'training-data',
            region: 'US East',
            size: '500 GB',
            fileCount: 1200,
            createdAt: '2024-03-15',
          },
          {
            id: 'b2',
            name: 'model-checkpoints',
            region: 'US East',
            size: '200 GB',
            fileCount: 50,
            createdAt: '2024-03-16',
          },
        ],
      },
      // Add more mock data as needed
    ];

    setWorkspaces(mockData);
    setMembers([
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ]);
  }, []);

  useEffect(() => {
    // Add custom styles for date picker
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-date-picker.ant-picker {
        background: #1f1f1f;
        border-color: #434343;
      }
      .custom-date-picker .ant-picker-input > input {
        color: #ffffff !important;
      }
      .custom-date-picker .ant-picker-separator {
        color: #ffffff !important;
      }
      .custom-date-picker .ant-picker-suffix {
        color: #ffffff !important;
      }
      .custom-date-picker .ant-picker-clear {
        background: #1f1f1f !important;
        color: #ffffff !important;
      }
      .custom-date-picker:hover,
      .custom-date-picker.ant-picker-focused {
        border-color: #1890ff !important;
      }
      .custom-date-picker .ant-picker-input > input::placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      document.head.removeChild(style);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Add table styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .workspace-table .ant-table-thead > tr > th {
        background: #1f1f1f !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        border-bottom: 2px solid #303030 !important;
      }

      .workspace-table .ant-table-tbody > tr > td {
        background: #141414 !important;
        border-bottom: 1px solid #303030 !important;
      }

      .workspace-table .ant-table-tbody > tr:hover > td {
        background: #1f1f1f !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Filter workspaces based on criteria
  const filteredWorkspaces = workspaces.filter(workspace => {
    if (selectedMember !== 'all' && workspace.creator !== selectedMember) return false;
    if (selectedCreator !== 'all' && workspace.creator !== selectedCreator) return false;
    if (dateRange) {
      const wsDate = dayjs(workspace.createdAt);
      if (wsDate.isBefore(dateRange[0]) || wsDate.isAfter(dateRange[1])) return false;
    }
    if (searchText && !workspace.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // Status tag renderer
  const renderStatus = (status: string) => {
    const colorMap = {
      active: 'success',
      inactive: 'warning',
      error: 'error',
    };
    return <Tag color={colorMap[status as keyof typeof colorMap]}>{status.toUpperCase()}</Tag>;
  };

  // Handle workspace deletion
  const handleDeleteWorkspace = (workspace: Workspace) => {
    Modal.confirm({
      title: 'Delete Workspace',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to delete workspace "{workspace.name}"?</p>
          <p style={{ color: '#ff4d4f' }}>This will delete all buckets and their contents.</p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => {
        // TODO: Implement actual delete logic
        console.log('Deleting workspace:', workspace.id);
      },
    });
  };

  // Handle bucket deletion
  const handleDeleteBucket = (bucket: Bucket, workspace: Workspace) => {
    Modal.confirm({
      title: 'Delete Bucket',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to delete bucket "{bucket.name}"?</p>
          <p style={{ color: '#ff4d4f' }}>This will delete all files in this bucket ({bucket.fileCount} files).</p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => {
        // TODO: Implement actual delete logic
        console.log('Deleting bucket:', bucket.id);
      },
    });
  };

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Copied to clipboard');
    });
  };

  // Mock S3 credentials
  const getS3Credentials = (workspace: Workspace): S3Credentials => {
    return {
      hostname: 's3-us-east.nebulablock.com',
      secretKey: '******',
      accessKey: 'HTgBl70Sa...tNJ1jTDyX'
    };
  };

  // Handle view credentials
  const handleViewCredentials = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setCredentialsVisible(true);
    setSecretKeyVisible(false);
  };

  // Credentials Modal
  const renderCredentialsModal = () => {
    if (!selectedWorkspace) return null;

    const credentials = getS3Credentials(selectedWorkspace);

    return (
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>S3 Credentials</Title>}
        open={credentialsVisible}
        onCancel={() => setCredentialsVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '8px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Space size="large" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c' }}>Hostname:</Text>
                <Space>
                  <Text>{credentials.hostname}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={() => handleCopy(credentials.hostname)}
                  />
                </Space>
              </Space>
            </div>

            <div>
              <Space size="large" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c' }}>Secret Key:</Text>
                <Space>
                  <Text>{secretKeyVisible ? 'actual-secret-key-here' : credentials.secretKey}</Text>
                  <Button 
                    type="text" 
                    icon={secretKeyVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setSecretKeyVisible(!secretKeyVisible)}
                  />
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={() => handleCopy('actual-secret-key-here')}
                  />
                </Space>
              </Space>
            </div>

            <div>
              <Space size="large" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c' }}>Access Key:</Text>
                <Space>
                  <Text>{credentials.accessKey}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={() => handleCopy(credentials.accessKey)}
                  />
                </Space>
              </Space>
            </div>
          </Space>
        </div>
      </Modal>
    );
  };

  // Workspace table columns
  const columns = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Workspace Name
        </Text>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Creator
        </Text>
      ),
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Region
        </Text>
      ),
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Cost
        </Text>
      ),
      dataIndex: 'cost',
      key: 'cost',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Create Time
        </Text>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Status
        </Text>
      ),
      dataIndex: 'status',
      key: 'status',
      render: renderStatus,
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Actions
        </Text>
      ),
      key: 'actions',
      render: (_: any, record: Workspace) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />}
            onClick={() => handleViewCredentials(record)}
          >
            View
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteWorkspace(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Update bucket columns to use new delete handler
  const bucketColumns = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Bucket Name
        </Text>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Size
        </Text>
      ),
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Files
        </Text>
      ),
      dataIndex: 'fileCount',
      key: 'fileCount',
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Created At
        </Text>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Actions
        </Text>
      ),
      key: 'actions',
      render: (_: any, record: Bucket) => {
        const parentRow = (document.querySelector(`tr[data-row-key="${record.id}"]`)?.closest('tr[data-parent]') as HTMLElement);
        const workspaceData = parentRow?.dataset.parent ? JSON.parse(parentRow.dataset.parent) : null;
        
        return (
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBucket(record, workspaceData)}
          >
            Delete
          </Button>
        );
      },
    },
  ];

  // Update expandedRowRender to pass parent workspace data
  const expandedRowRender = (workspace: Workspace) => (
    <Table
      columns={bucketColumns}
      dataSource={workspace.buckets}
      pagination={false}
      rowKey="id"
      components={{
        body: {
          row: (props: any) => <tr {...props} data-parent={JSON.stringify(workspace)} />
        }
      }}
    />
  );

  return (
    <div>
      {/* Member Filter */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle">
          <Col>
            <Text strong style={{ display: 'inline-block', width: 140 }}>Filter by Member:</Text>
          </Col>
          <Col flex="300px">
            <Select
              placeholder="Select Member"
              style={{ width: '100%' }}
              value={selectedMember}
              onChange={setSelectedMember}
            >
              <Option value="all">All Members</Option>
              {members.map(member => (
                <Option key={member.id} value={member.id}>{member.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={<Text strong>Total Workspaces</Text>}
              value={statistics.totalWorkspaces}
              prefix={<FolderOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={<Text strong>Total Buckets</Text>}
              value={statistics.totalBuckets}
              prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={<Text strong>Total Storage</Text>}
              value={statistics.totalStorage}
              prefix={<CloudOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={<Text strong>Total Files</Text>}
              value={statistics.totalFiles}
              prefix={<FileOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Workspace List with Filters */}
      <Card>
        {/* Filters */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="none">
              <Text strong>Creator:</Text>
            </Col>
            <Col flex="200px">
              <Select
                placeholder="Select Creator"
                style={{ width: '100%' }}
                value={selectedCreator}
                onChange={setSelectedCreator}
              >
                <Option value="all">All Creators</Option>
                {members.map(member => (
                  <Option key={member.id} value={member.id}>{member.name}</Option>
                ))}
              </Select>
            </Col>
            <Col flex="none">
              <Text strong>Time Range:</Text>
            </Col>
            <Col flex="300px">
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                placeholder={['Start Date', 'End Date']}
                format="YYYY-MM-DD"
                allowClear={true}
                className="custom-date-picker"
              />
            </Col>
            <Col flex="none">
              <Text strong>Workspace Name:</Text>
            </Col>
            <Col flex="300px">
              <Input
                placeholder="Search workspace name"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Workspace Table */}
        <Table
          columns={columns}
          dataSource={filteredWorkspaces}
          rowKey="id"
          className="workspace-table"
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) => (
              <DownOutlined
                rotate={expanded ? 180 : 0}
                onClick={e => onExpand(record, e)}
                style={{ marginRight: 8, transition: '0.3s' }}
              />
            ),
          }}
          loading={loading}
        />
      </Card>
      {renderCredentialsModal()}
    </div>
  );
};

export default ObjectStorageTab; 