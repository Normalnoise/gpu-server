import React from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

interface TeamFormData {
  name: string;
  description: string;
}

const CreateTeam: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values: TeamFormData) => {
    const teamId = '1'; // 实际项目中应从API响应中获取
    try {
      // TODO: 实现团队创建逻辑
      console.log('Creating team:', values);
      message.success('Team created successfully');
      navigate(`/teams/${teamId}/manage`); // 导航到新创建的团队管理页面
    } catch (error) {
      message.error('Failed to create team, please try again');
      console.error('Failed to create team:', error);
    }
  };

  return (
    <Card
      title="Create New Team"
      style={{
        maxWidth: 600,
        margin: '0 auto',
        background: '#141414',
        border: '1px solid #303030'
      }}
      headStyle={{ color: '#fff', borderBottom: '1px solid #303030' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ color: '#fff' }}
      >
        <Form.Item
          name="name"
          label={<span style={{ color: '#fff' }}>Team Name</span>}
          rules={[{ required: true, message: 'Please enter team name' }]}
        >
          <Input placeholder="Enter team name" />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span style={{ color: '#fff' }}>Team Description</span>}
          rules={[{ required: true, message: 'Please enter team description' }]}
        >
          <Input.TextArea
            placeholder="Enter team description"
            rows={4}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            Create Team
          </Button>
          <Button onClick={() => navigate('/teams')}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CreateTeam;