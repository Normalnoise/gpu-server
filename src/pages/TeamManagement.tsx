import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Divider, Checkbox } from 'antd';
import { UserOutlined, TeamOutlined, SettingOutlined, ArrowLeftOutlined, MailOutlined, IdcardOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  invitedAt: string;
  expiresAt?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member';
}

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const TeamManagement: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 模拟团队数据
  const [team] = useState<Team>({
    id: teamId || '',
    name: 'ML Development',
    description: 'Machine Learning Development Team',
    currentUserRole: 'admin',
    members: [
      { id: '1', email: 'owner@example.com', role: 'owner', status: 'active', invitedAt: '2024-04-01' },
      { id: '2', email: 'admin@example.com', role: 'admin', status: 'active', invitedAt: '2024-04-01' },
      { id: '3', email: 'member1@example.com', role: 'member', status: 'active', invitedAt: '2024-04-01' },
      { id: '4', email: 'pending1@example.com', role: 'member', status: 'pending', invitedAt: '2024-04-01', expiresAt: '2024-05-01' },
    ]
  });

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

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      // TODO: 实现更新角色的API调用
      console.log('Updating role:', { memberId, newRole });
      message.success('Role updated successfully');
    } catch (error) {
      message.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      // TODO: 实现移除成员的API调用
      console.log('Removing member:', memberId);
      message.success('Member removed successfully');
    } catch (error) {
      message.error('Failed to remove member');
    }
  };

  const handleCancelInvite = async (memberId: string) => {
    try {
      // TODO: 实现取消邀请的API调用
      console.log('Canceling invite:', memberId);
      message.success('Invitation canceled successfully');
    } catch (error) {
      message.error('Failed to cancel invite');
    }
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

  const activeMembers = team.members.filter(m => m.status === 'active');
  const pendingMembers = team.members.filter(m => m.status === 'pending');

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
      width: '40%',
      render: (email: string) => (
        <Text style={{ color: '#ffffff' }}>{email}</Text>
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
      width: '25%',
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
        <Text strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
          Actions
        </Text>
      ),
      key: 'action',
      width: '35%',
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
                onClick={() => handleRemoveMember(record.id)}
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
      width: '30%',
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
      width: '25%',
      render: (invitedAt: string) => {
        return <Text style={{ color: '#ffffff' }}>{invitedAt}</Text>;
      },
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
      width: '25%',
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
      width: '20%',
      align: 'right',
      render: (_: any, record: TeamMember) => (
        <Button
          type="text"
          danger
          className="member-action-btn"
          onClick={() => handleCancelInvite(record.id)}
        >
          Cancel
        </Button>
      ),
    },
  ];

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
                <Button danger>Delete Team</Button>
              </div>
              <Divider />
              <div>
                <Title level={5}>Transfer Ownership</Title>
                <p>Transfer team ownership to another member. After transfer, you will lose team owner privileges.</p>
                <Button danger>Transfer Ownership</Button>
              </div>
            </Space>
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
    </Card>
  );
};

export default TeamManagement;