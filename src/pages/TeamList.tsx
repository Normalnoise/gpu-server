import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, message } from 'antd';
import { TeamOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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

  const columns = [
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Your Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => role.charAt(0).toUpperCase() + role.slice(1),
    },
    {
      title: 'Members',
      dataIndex: 'memberCount',
      key: 'memberCount',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Team) => (
        <Space>
          {(record.role === 'owner' || record.role === 'admin') && (
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleManageTeam(record.id)}
            >
              Manage
            </Button>
          )}
          {record.role === 'owner' && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => showDeleteConfirm(record)}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Team Management"
      extra={
        <Button type="primary" icon={<TeamOutlined />} onClick={handleCreateTeam}>
          Create Team
        </Button>
      }
      style={{ background: '#141414', border: '1px solid #303030' }}
    >
      <Table
        columns={columns}
        dataSource={teams}
        rowKey="id"
        style={{ marginTop: '16px' }}
      />

      <Modal
        title="Delete Team"
        open={deleteModalVisible}
        onOk={handleDeleteTeam}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedTeam(null);
        }}
        okText="Delete"
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete team "{selectedTeam?.name}"? This action cannot be undone.</p>
      </Modal>
    </Card>
  );
};

export default TeamList;