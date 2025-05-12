import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Divider, Checkbox } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  SettingOutlined, 
  ArrowLeftOutlined, 
  MailOutlined, 
  IdcardOutlined, 
  ClockCircleOutlined, 
  KeyOutlined, 
  CopyOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  YoutubeOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  invitedAt: string;
  expiresAt?: string;
  invitedBy?: string;
  isCurrentUser?: boolean;
}

interface TeamApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'disabled';
  lastUsed?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member';
  apiKeys: TeamApiKey[];
}

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const TeamManagement: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKeyNameValue, setApiKeyNameValue] = useState('');
  const [form] = Form.useForm();
  const [apiKeyForm] = Form.useForm();
  const [apiKeyVisibility, setApiKeyVisibility] = useState<Record<string, boolean>>({});

  // 模拟团队数据
  const [team] = useState<Team>({
    id: teamId || '',
    name: 'ML Development',
    description: 'Machine Learning Development Team',
    currentUserRole: 'admin',
    members: [
      { id: '1', email: 'owner@example.com', role: 'owner', status: 'active', invitedAt: '2024-04-01', invitedBy: 'System' },
      { id: '2', email: 'admin@example.com', role: 'admin', status: 'active', invitedAt: '2024-04-01', invitedBy: 'owner@example.com', isCurrentUser: true },
      { id: '3', email: 'member1@example.com', role: 'member', status: 'active', invitedAt: '2024-04-01', invitedBy: 'admin@example.com' },
      { id: '4', email: 'pending1@example.com', role: 'member', status: 'pending', invitedAt: '2024-04-01', expiresAt: '2024-05-01', invitedBy: 'admin@example.com' },
    ],
    apiKeys: [
      { id: '1', name: 'Production API Key', key: 'sk_prod_123456789', createdAt: '2024-04-01', createdBy: 'owner@example.com', status: 'active', lastUsed: '2024-04-10' },
      { id: '2', name: 'Development API Key', key: 'sk_dev_987654321', createdAt: '2024-04-05', createdBy: 'admin@example.com', status: 'active', lastUsed: '2024-04-09' },
      { id: '3', name: 'Testing API Key', key: 'sk_test_123123123', createdAt: '2024-04-07', createdBy: 'member1@example.com', status: 'disabled', lastUsed: '2024-04-08' },
    ]
  });

  // 初始化API密钥的可见性状态
  React.useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    team.apiKeys.forEach(key => {
      initialVisibility[key.id] = false; // 默认所有API密钥都隐藏
    });
    setApiKeyVisibility(initialVisibility);
  }, [team.apiKeys]);

  const toggleApiKeyVisibility = (keyId: string) => {
    setApiKeyVisibility(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // 格式化API密钥显示
  const formatApiKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    // 只显示前4位和后4位，其余用*代替
    const prefix = key.substring(0, 4);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'*'.repeat(Math.max(0, key.length - 8))}${suffix}`;
  };

  const handleInviteMember = async (values: { email: string; role: string }) => {
    try {
      // TODO: 实现邀请成员的API调用
      console.log('Inviting member:', values);
      message.success('Invitation sent successfully');
      setInviteModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to send invitation');
    }
  };

  const handleCreateApiKey = async (values: { name: string }) => {
    try {
      // TODO: 实现创建API Key的API调用
      console.log('Creating API Key:', values);
      message.success('API Key created successfully');
      setApiKeyModalVisible(false);
      apiKeyForm.resetFields();
      setApiKeyNameValue('');
    } catch (error) {
      message.error('Failed to create API Key');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      // TODO: 实现更新角色的API调用
      console.log('Updating role:', { memberId, newRole });
      message.success('Role updated successfully');
    } catch (error) {
      message.error('Failed to update role');
    }
  };

  const handleRemoveMember = (memberId: string, email: string) => {
    confirm({
      title: 'Are you sure you want to remove this member?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `You are about to remove ${email} from this team. This action cannot be undone.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          // TODO: 实现移除成员的API调用
          console.log('Removing member:', memberId);
          message.success('Member removed successfully');
        } catch (error) {
          message.error('Failed to remove member');
        }
      },
    });
  };

  const handleCancelInvite = (memberId: string, email: string) => {
    confirm({
      title: 'Are you sure you want to cancel this invitation?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `You are about to cancel the invitation for ${email}. They will no longer be able to join the team with this invitation.`,
      okText: 'Cancel Invitation',
      okType: 'danger',
      cancelText: 'Keep Invitation',
      async onOk() {
        try {
          // TODO: 实现取消邀请的API调用
          console.log('Canceling invite:', memberId);
          message.success('Invitation canceled successfully');
        } catch (error) {
          message.error('Failed to cancel invite');
        }
      },
    });
  };

  const handleToggleApiKeyStatus = (keyId: string, currentStatus: string, keyName: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const title = currentStatus === 'active' 
      ? 'Are you sure you want to disable this API key?' 
      : 'Are you sure you want to enable this API key?';
    const content = currentStatus === 'active'
      ? `The API key "${keyName}" will no longer work until re-enabled.`
      : `The API key "${keyName}" will be active again and can be used to access resources.`;
    
    confirm({
      title,
      icon: <ExclamationCircleOutlined style={{ color: currentStatus === 'active' ? '#ff4d4f' : '#52c41a' }} />,
      content,
      okText: currentStatus === 'active' ? 'Disable' : 'Enable',
      okType: currentStatus === 'active' ? 'danger' : 'primary',
      cancelText: 'Cancel',
      async onOk() {
        try {
          // TODO: 实现启用/禁用API Key的API调用
          console.log('Toggling API Key status:', { keyId, newStatus });
          message.success(`API Key ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
        } catch (error) {
          message.error('Failed to update API Key status');
        }
      },
    });
  };

  const handleDeleteApiKey = (keyId: string, keyName: string) => {
    confirm({
      title: 'Are you sure you want to delete this API key?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `You are about to delete the API key "${keyName}". This action cannot be undone and any services using this key will stop working immediately.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          // TODO: 实现删除API Key的API调用
          console.log('Deleting API Key:', keyId);
          message.success('API Key deleted successfully');
        } catch (error) {
          message.error('Failed to delete API Key');
        }
      },
    });
  };

  const handleDeleteTeam = () => {
    confirm({
      title: 'Are you sure you want to delete this team?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'This action will permanently delete the team, including all member relationships and associated data. This action cannot be undone.',
      okText: 'Delete Team',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          // TODO: 实现删除团队的API调用
          console.log('Deleting team:', teamId);
          message.success('Team deleted successfully');
          navigate('/teams');
        } catch (error) {
          message.error('Failed to delete team');
        }
      },
    });
  };

  const handleTransferOwnership = () => {
    confirm({
      title: 'Are you sure you want to transfer ownership?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'Transfer team ownership to another member. After transfer, you will lose team owner privileges.',
      okText: 'Transfer Ownership',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        // 转移所有权需要更多步骤，这里应该打开一个选择新所有者的模态框
        // 简化处理，这里只是消息提示
        message.info('Please select a member to transfer ownership to');
      },
    });
  };

  // 设计统一的表头样式
  const renderTableTitle = (title: string, icon: React.ReactNode, count: number) => (
    <div className="member-table-header">
      <div className="member-table-title">
        {icon}
        <Text strong style={{ color: '#ffffff', fontSize: '16px', marginLeft: '8px' }}>
          {title}
        </Text>
      </div>
      <Tag className="member-count-tag">
        {count}
      </Tag>
    </div>
  );

  const columns: ColumnsType<TeamMember> = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <MailOutlined style={{ marginRight: '8px' }} />
          Email
        </Text>
      ),
      dataIndex: 'email',
      key: 'email',
      width: '30%',
      render: (email: string, record: TeamMember) => (
        <Text style={{ color: '#ffffff' }}>
          {email}
          {record.isCurrentUser && <Tag color="blue" style={{ marginLeft: '8px' }}>You</Tag>}
        </Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <IdcardOutlined style={{ marginRight: '8px' }} />
          Role
        </Text>
      ),
      dataIndex: 'role',
      key: 'role',
      width: '20%',
      render: (role: string, record: TeamMember) => {
        const colorMap = {
          owner: 'gold',
          admin: 'blue',
          member: 'green',
        };
        return (
          <Space>
            <Tag color={colorMap[role as keyof typeof colorMap]} style={{ fontWeight: 500, padding: '2px 8px' }}>
              {role.toUpperCase()}
            </Tag>
            {record.status === 'pending' && (
              <Tag color="orange" style={{ fontWeight: 500, padding: '2px 8px' }}>
                PENDING
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Invited By
        </Text>
      ),
      dataIndex: 'invitedBy',
      key: 'invitedBy',
      width: '20%',
      render: (invitedBy: string) => (
        <Text style={{ color: '#ffffff' }}>{invitedBy}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
          Actions
        </Text>
      ),
      key: 'action',
      width: '30%',
      align: 'right',
      render: (_: any, record: TeamMember) => {
        if (team.currentUserRole !== 'owner' && record.role === 'owner') {
          return null;
        }
        return (
          <Space>
            {team.currentUserRole === 'owner' && record.role !== 'owner' && (
              <Select
                defaultValue={record.role}
                style={{ width: 100 }}
                onChange={(value) => handleUpdateRole(record.id, value)}
                dropdownClassName="role-select-dropdown"
              >
                <Select.Option value="admin">Admin</Select.Option>
                <Select.Option value="member">Member</Select.Option>
              </Select>
            )}
            {((team.currentUserRole === 'owner') ||
              (team.currentUserRole === 'admin' && record.role === 'member')) && (
              <Button
                type="text"
                danger
                className="member-action-btn"
                onClick={() => handleRemoveMember(record.id, record.email)}
              >
                Remove
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const pendingColumns: ColumnsType<TeamMember> = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <MailOutlined style={{ marginRight: '8px' }} />
          Email
        </Text>
      ),
      dataIndex: 'email',
      key: 'email',
      width: '25%',
      render: (email: string) => (
        <Text style={{ color: '#ffffff' }}>{email}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <ClockCircleOutlined style={{ marginRight: '8px' }} />
          Invited At
        </Text>
      ),
      dataIndex: 'invitedAt',
      key: 'invitedAt',
      width: '20%',
      render: (invitedAt: string) => {
        return <Text style={{ color: '#ffffff' }}>{invitedAt}</Text>;
      },
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Invited By
        </Text>
      ),
      dataIndex: 'invitedBy',
      key: 'invitedBy',
      width: '20%',
      render: (invitedBy: string) => (
        <Text style={{ color: '#ffffff' }}>{invitedBy}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <ClockCircleOutlined style={{ marginRight: '8px', color: '#ff7875' }} />
          Expires At
        </Text>
      ),
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: '20%',
      render: (expiresAt: string) => {
        return <Text style={{ color: '#ffffff' }}>{expiresAt}</Text>;
      },
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
          Actions
        </Text>
      ),
      key: 'action',
      width: '15%',
      align: 'right',
      render: (_: any, record: TeamMember) => (
        <Button
          type="text"
          danger
          className="member-action-btn"
          onClick={() => handleCancelInvite(record.id, record.email)}
        >
          Cancel
        </Button>
      ),
    },
  ];

  const apiKeyColumns: ColumnsType<TeamApiKey> = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <KeyOutlined style={{ marginRight: '8px' }} />
          Name
        </Text>
      ),
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      render: (name: string) => (
        <Text style={{ color: '#ffffff' }}>{name}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <KeyOutlined style={{ marginRight: '8px' }} />
          API Key
        </Text>
      ),
      dataIndex: 'key',
      key: 'key',
      width: '25%',
      render: (key: string, record: TeamApiKey) => {
        const isVisible = apiKeyVisibility[record.id] || false;
        return (
          <Space>
            <Text style={{ color: '#ffffff', fontFamily: 'monospace' }}>
              {formatApiKey(key, isVisible)}
            </Text>
            <Button
              type="text"
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => toggleApiKeyVisibility(record.id)}
              title={isVisible ? "Hide API Key" : "Show API Key"}
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(key);
                message.success('API Key copied to clipboard');
              }}
              title="Copy API Key"
            />
          </Space>
        );
      },
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Created By
        </Text>
      ),
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: '15%',
      render: (createdBy: string) => (
        <Text style={{ color: '#ffffff' }}>{createdBy}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <ClockCircleOutlined style={{ marginRight: '8px' }} />
          Created At
        </Text>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '10%',
      render: (createdAt: string) => (
        <Text style={{ color: '#ffffff' }}>{createdAt}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <ClockCircleOutlined style={{ marginRight: '8px' }} />
          Last Used
        </Text>
      ),
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      width: '10%',
      render: (lastUsed: string) => (
        <Text style={{ color: '#ffffff' }}>{lastUsed || 'Never'}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Status
        </Text>
      ),
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Active' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
          Actions
        </Text>
      ),
      key: 'action',
      width: '10%',
      align: 'right',
      render: (_: any, record: TeamApiKey) => (
        <Space>
          <Button
            type="text"
            icon={record.status === 'active' ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            onClick={() => handleToggleApiKeyStatus(record.id, record.status, record.name)}
            title={record.status === 'active' ? 'Disable API Key' : 'Enable API Key'}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteApiKey(record.id, record.name)}
            title="Delete API Key"
          />
        </Space>
      ),
    },
  ];

  const activeMembers = team.members.filter(m => m.status === 'active');
  const pendingMembers = team.members.filter(m => m.status === 'pending');

  return (
    <Card style={{ background: '#141414', border: '1px solid #303030' }} className="team-management-card">
      <Space style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/teams')}
        >
          Back to Team Overview
        </Button>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <TeamOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          <Typography.Title level={4} style={{ margin: 0, color: '#ffffff' }}>{team.name}</Typography.Title>
        </Space>
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => setInviteModalVisible(true)}
          disabled={team.currentUserRole === 'member'}
        >
          Invite Member
        </Button>
      </Space>
      <Tabs defaultActiveKey="members" className="team-management-tabs">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Member Management
            </span>
          }
          key="members"
        >
          <div className="table-container">
            {renderTableTitle('Active Members', <UserOutlined style={{ color: '#52c41a' }} />, activeMembers.length)}
            <Table
              columns={columns}
              dataSource={activeMembers}
              rowKey="id"
              pagination={false}
              className="members-table"
              tableLayout="fixed"
            />
          </div>

          <div className="table-container" style={{ marginTop: '32px' }}>
            {renderTableTitle('Pending Invites', <ClockCircleOutlined style={{ color: '#faad14' }} />, pendingMembers.length)}
            <Table
              columns={pendingColumns}
              dataSource={pendingMembers}
              rowKey="id"
              pagination={false}
              className="members-table"
              tableLayout="fixed"
            />
          </div>

          <div className="danger-zone">
            <Title level={4} style={{ color: '#ff4d4f' }}>Danger Zone</Title>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={5}>Delete Team</Title>
                <p>This action will permanently delete the team, including all member relationships and associated data. This action cannot be undone.</p>
                <Button danger onClick={handleDeleteTeam}>Delete Team</Button>
              </div>
              <Divider />
              <div>
                <Title level={5}>Transfer Ownership</Title>
                <p>Transfer team ownership to another member. After transfer, you will lose team owner privileges.</p>
                <Button danger onClick={handleTransferOwnership}>Transfer Ownership</Button>
              </div>
            </Space>
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <KeyOutlined />
              API Keys
            </span>
          }
          key="apikeys"
        >
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#ffffff' }}>Team API Keys</Title>
              <Text type="secondary">Manage API keys for team access</Text>
            </div>
            {team.currentUserRole !== 'member' && (
              <Button
                type="primary"
                icon={<KeyOutlined />}
                onClick={() => setApiKeyModalVisible(true)}
              >
                Create API Key
              </Button>
            )}
          </div>

          <div className="api-keys-alert ant-alert ant-alert-info" style={{ marginBottom: '20px', padding: '12px 16px' }}>
            <div className="ant-alert-message">API Key Security</div>
            <div className="ant-alert-description">
              API keys provide full access to your team's resources. Keep them secure and never share them in publicly accessible areas.
            </div>
          </div>

          <div className="table-container">
            {renderTableTitle('Team API Keys', <KeyOutlined style={{ color: '#1890ff' }} />, team.apiKeys.length)}
            <Table
              columns={apiKeyColumns}
              dataSource={team.apiKeys}
              rowKey="id"
              pagination={false}
              className="members-table"
              tableLayout="fixed"
            />
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Team Settings
            </span>
          }
          key="settings"
        >
          {/* TODO: 实现团队设置功能 */}
          <p style={{ color: '#fff' }}>Team settings feature is under development...</p>
        </TabPane>
      </Tabs>

      <Modal
        title="Invite New Member"
        open={inviteModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setInviteModalVisible(false);
          form.resetFields();
        }}
        okText="Send Invitation"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInviteMember}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email address' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="member"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Select.Option value="admin">Administrator</Select.Option>
              <Select.Option value="member">Member</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="permissions" label="Permissions">
            <Checkbox.Group>
              <Checkbox value="create_inference_api_key">Create Inference API Key</Checkbox>
              <Checkbox value="create_storage_secret_key">Create Storage Secret Key</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create API Key"
        open={apiKeyModalVisible}
        onOk={() => apiKeyForm.submit()}
        onCancel={() => {
          setApiKeyModalVisible(false);
          apiKeyForm.resetFields();
          setApiKeyNameValue('');
        }}
        okText="Create"
        cancelText="Cancel"
      >
        <Form
          form={apiKeyForm}
          layout="vertical"
          onFinish={handleCreateApiKey}
        >
          <Form.Item
            name="name"
            label="Key Name"
            rules={[{ required: true, message: 'Please enter a key name' }]}
          >
            <Input 
              placeholder="e.g. Production API Key" 
              value={apiKeyNameValue}
              onChange={(e) => setApiKeyNameValue(e.target.value)}
            />
          </Form.Item>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            The API key will provide access to resources within this team. Key will only be displayed once upon creation.
          </Paragraph>
        </Form>
      </Modal>
    </Card>
  );
};

export default TeamManagement;