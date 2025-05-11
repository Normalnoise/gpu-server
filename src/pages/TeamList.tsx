import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, message, Tag, Typography, Tooltip } from 'antd';
import { TeamOutlined, DeleteOutlined, SettingOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface Team {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
  createdAt: string;
}

const TeamList: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([
    {
      id: '1',
      name: 'AI Research Team',
      role: 'owner',
      memberCount: 5,
      createdAt: '2023-01-15'
    },
    {
      id: '2',
      name: 'ML Development',
      role: 'admin',
      memberCount: 3,
      createdAt: '2023-03-20'
    },
    {
      id: '3',
      name: 'Data Science Group',
      role: 'member',
      memberCount: 4,
      createdAt: '2023-05-10'
    },
  ]); // 使用示例数据
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const handleCreateTeam = () => {
    navigate('/teams/create');
  };

  const handleManageTeam = (teamId: string) => {
    navigate(`/teams/${teamId}/manage`);
  };

  const showDeleteConfirm = (team: Team) => {
    setSelectedTeam(team);
    setDeleteModalVisible(true);
  };

  const handleDeleteTeam = async () => {
    if (selectedTeam) {
      try {
        // TODO: 实现删除团队的API调用
        setTeams(teams.filter(team => team.id !== selectedTeam.id));
        message.success('Team deleted successfully');
      } catch (error) {
        message.error('Failed to delete team');
      }
      setDeleteModalVisible(false);
      setSelectedTeam(null);
    }
  };

  // 获取角色标签颜色
  const getRoleTagColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#1890ff';
      case 'admin':
        return '#52c41a';
      case 'member':
        return '#722ed1';
      default:
        return '#d9d9d9';
    }
  };

  const columns: ColumnsType<Team> = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>Team Name</Text>
      ),
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text) => (
        <Text style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500 }}>{text}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>Your Role</Text>
      ),
      dataIndex: 'role',
      key: 'role',
      width: '15%',
      render: (role: string) => (
        <Tag color={getRoleTagColor(role)} style={{ padding: '2px 10px', borderRadius: '4px' }}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      ),
    },
    {
      title: () => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: '6px', color: '#ffffff' }} />
          <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>Members</Text>
        </div>
      ),
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: '15%',
      render: (count: number) => (
        <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{count}</Text>
      ),
    },
    {
      title: () => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: '6px', color: '#ffffff' }} />
          <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>Created At</Text>
        </div>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '20%',
      render: (date: string) => (
        <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{date}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>Actions</Text>
      ),
      key: 'actions',
      width: '20%',
      render: (_: any, record: Team) => (
        <Space size="middle">
          {(record.role === 'owner' || record.role === 'admin') && (
            <Tooltip title="Manage team members and settings">
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => handleManageTeam(record.id)}
                className="team-action-btn"
              >
                Manage
              </Button>
            </Tooltip>
          )}
          {record.role === 'owner' && (
            <Tooltip title="Delete this team">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => showDeleteConfirm(record)}
                className="team-action-delete-btn"
              >
                Delete
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TeamOutlined style={{ fontSize: '18px', marginRight: '10px', color: '#1890ff' }} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Team Management</span>
        </div>
      }
      extra={
        <Button 
          type="primary" 
          icon={<TeamOutlined />} 
          onClick={handleCreateTeam}
          size="middle"
          style={{ fontWeight: 500, height: '36px' }}
        >
          Create Team
        </Button>
      }
      style={{ background: '#141414', border: '1px solid #303030' }}
      className="team-list-card"
    >
      <Table
        columns={columns}
        dataSource={teams}
        rowKey="id"
        style={{ marginTop: '16px' }}
        pagination={{ 
          pageSize: 10,
          hideOnSinglePage: true,
          showSizeChanger: false
        }}
        className="team-list-table"
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DeleteOutlined style={{ color: '#ff4d4f', marginRight: '10px' }} />
            <span>Delete Team</span>
          </div>
        }
        open={deleteModalVisible}
        onOk={handleDeleteTeam}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedTeam(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        className="team-delete-modal"
      >
        <p>Are you sure you want to delete team <Text strong>"{selectedTeam?.name}"</Text>? This action cannot be undone.</p>
      </Modal>
    </Card>
  );
};

export default TeamList;