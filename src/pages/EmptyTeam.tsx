import React from 'react';
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const EmptyTeam: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      background: '#141414',
      borderRadius: '8px',
      padding: '2rem'
    }}>
      <Title level={1} style={{ color: '#fff', marginBottom: '1rem' }}>
        Team Management
      </Title>
      <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.2rem', marginBottom: '2rem' }}>
        You don't have any teams
      </Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.65)', marginBottom: '2rem' }}>
        Create a team to invite and manage members.
      </Text>
      <Button
        type="primary"
        icon={<TeamOutlined />}
        size="large"
        onClick={() => navigate('/teams/create')}
        style={{
          height: '48px',
          padding: '0 32px',
          fontSize: '16px',
          background: '#1890ff'
        }}
      >
        Create Team
      </Button>
    </div>
  );
};

export default EmptyTeam;