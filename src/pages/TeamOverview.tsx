import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Typography } from 'antd';
import { TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

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
  memberCount: number;
  createdAt: string;
  members: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member';
}

const TeamOverview: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock team data
  const [teams] = useState<Team[]>([
    {
      id: '1',
      name: 'AI Research Team',
      description: 'AI Research Team',
      memberCount: 5,
      createdAt: '2023-01-15',
      currentUserRole: 'owner',
      members: [
        { id: '1', email: 'owner@example.com', role: 'owner', status: 'active' },
        { id: '2', email: 'admin@example.com', role: 'admin', status: 'active' },
        { id: '3', email: 'member1@example.com', role: 'member', status: 'active' },
        { id: '4', email: 'pending1@example.com', role: 'member', status: 'pending' },
      ]
    },
    {
      id: '2',
      name: 'ML Development',
      description: 'Machine Learning Development Team',
      memberCount: 3,
      createdAt: '2023-03-20',
      currentUserRole: 'admin',
      members: [
        { id: '5', email: 'teamlead@example.com', role: 'owner', status: 'active' },
        { id: '6', email: 'current@example.com', role: 'admin', status: 'active' },
        { id: '7', email: 'pending2@example.com', role: 'member', status: 'pending' },
      ]
    },
    {
      id: '3',
      name: 'Data Science Group',
      description: 'Data Science Group',
      memberCount: 4,
      createdAt: '2023-05-10',
      currentUserRole: 'member',
      members: [
        { id: '8', email: 'dsowner@example.com', role: 'owner', status: 'active' },
        { id: '9', email: 'current@example.com', role: 'member', status: 'active' },
        { id: '10', email: 'pending3@example.com', role: 'member', status: 'pending' },
      ]
    },
  ]);

  const handleCreateTeam = () => {
    navigate('/teams/create');
  };

  if (teams.length === 0) {
    return (
      <Card
        style={{ 
          background: '#141414', 
          border: '1px solid #303030',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          textAlign: 'center'
        }}
      >
        <Typography.Title level={1} style={{ marginBottom: '16px' }}>
          Team Management
        </Typography.Title>
        <Typography.Text type="secondary" style={{ marginBottom: '24px' }}>
          Create a team to invite and manage members.
        </Typography.Text>
        <Button type="primary" size="large" onClick={handleCreateTeam}>
          Create Team
        </Button>
      </Card>
    );
  }

  const handleManageTeam = (teamId: string) => {
    navigate(`/teams/${teamId}/manage`);
  };

  const columns = [
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Team) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </Space>
      ),
    },
    {
      title: 'Your Role',
      dataIndex: 'currentUserRole',
      key: 'currentUserRole',
      render: (role: string) => {
        const colorMap = {
          owner: 'gold',
          admin: 'blue',
          member: 'green',
        };
        return <Tag color={colorMap[role as keyof typeof colorMap]}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Members',
      key: 'members',
      render: (_: any, record: Team) => (
        <Space direction="vertical" size={0}>
          <Text>{record.memberCount} members</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.members.filter(m => m.status === 'pending').length} pending invitations
          </Text>
        </Space>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('en-US'),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: Team) => (
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => handleManageTeam(record.id)}
          disabled={record.currentUserRole === 'member'}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          Team Management
        </Space>
      }
      style={{ background: '#141414', border: '1px solid #303030' }}
    >
      <Table
        columns={columns}
        dataSource={teams}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );
};

export default TeamOverview;