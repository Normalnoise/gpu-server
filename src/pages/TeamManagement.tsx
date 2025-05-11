import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Divider, Checkbox } from 'antd';
import { UserOutlined, TeamOutlined, SettingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member';
}

const { TabPane } = Tabs;

const { Title } = Typography;

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
      { id: '1', email: 'owner@example.com', role: 'owner', status: 'active' },
      { id: '2', email: 'admin@example.com', role: 'admin', status: 'active' },
      { id: '3', email: 'member1@example.com', role: 'member', status: 'active' },
      { id: '4', email: 'pending1@example.com', role: 'member', status: 'pending' },
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

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: TeamMember) => {
        const colorMap = {
          owner: 'gold',
          admin: 'blue',
          member: 'green',
        };
        return (
          <Space>
            <Tag color={colorMap[role as keyof typeof colorMap]}>{role.toUpperCase()}</Tag>
            {record.status === 'pending' && <Tag color="orange">Pending</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
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

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          {team.name}
        </Space>
      }
      style={{ background: '#141414', border: '1px solid #303030' }}
      extra={
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => setInviteModalVisible(true)}
          disabled={team.currentUserRole === 'member'}
        >
          Invite Member
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/teams/${teamId}`)}
        >
          Back to Team Overview
        </Button>
      </Space>
      <Tabs defaultActiveKey="members">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Member Management
            </span>
          }
          key="members"
        >
          <Table
            columns={columns}
            dataSource={team.members}
            rowKey="id"
            pagination={false}
          />
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
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Pending Invites
            </span>
          }
          key="2"
        >
          <Table
            dataSource={team.members.filter(m => m.status === 'pending')}
            columns={columns}
            rowKey="id"
          />
        </TabPane>
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Danger Zone
            </span>
          }
          key="3"
        >
          <div style={{ padding: '24px', border: '1px solid #ff4d4f', borderRadius: '8px' }}>
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
              <Checkbox value="create_project">Create Project</Checkbox>
              <Checkbox value="manage_resources">Manage Resources</Checkbox>
              <Checkbox value="invite_members">Invite Members</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TeamManagement;