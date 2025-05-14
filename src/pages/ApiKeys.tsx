import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert, Space, Tag, Typography, Tooltip, message, Input } from 'antd';
import { PlusOutlined, ReloadOutlined, CopyOutlined, ExclamationCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CustomSelect from '../components/CustomSelect';

const { Text, Paragraph } = Typography;
const { Option } = CustomSelect;

// 模拟API调用的接口
interface Team {
  id: string;
  name: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  ownerType: 'personal' | 'team';
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

// 模拟API调用
const mockFetchTeams = async (): Promise<Team[]> => {
  // 真实环境应该从后端获取
  return [
    { id: '1', name: 'AI Research Team' },
    { id: '2', name: 'ML Development' },
    { id: '3', name: 'Data Science Group' },
  ];
};

const mockFetchApiKeys = async (): Promise<ApiKey[]> => {
  // 真实环境应该从后端获取
  return [
    {
      id: '1',
      name: 'Personal API Key',
      key: 'sk-personalkey123456789abcdefghijklmnopqrstuvwxyz',
      ownerType: 'personal',
      ownerId: 'user1',
      ownerName: 'Your Personal Key',
      createdAt: '2023-06-10'
    },
    {
      id: '2',
      name: 'Team API Key',
      key: 'sk-teamkey123456789abcdefghijklmnopqrstuvwxyz',
      ownerType: 'team',
      ownerId: '1',
      ownerName: 'AI Research Team',
      createdAt: '2023-06-15'
    }
  ];
};

const ApiKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newKeyVisible, setNewKeyVisible] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // 已有的key owners (用于检查是否已经存在)
  const [existingOwners, setExistingOwners] = useState<{
    personal: boolean;
    teamIds: string[];
  }>({
    personal: false,
    teamIds: [],
  });

  useEffect(() => {
    fetchApiKeys();
    fetchTeams();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const keys = await mockFetchApiKeys();
      setApiKeys(keys);
      
      // 更新已存在的key owners
      const personal = keys.some(key => key.ownerType === 'personal');
      const teamIds = keys
        .filter(key => key.ownerType === 'team')
        .map(key => key.ownerId);
      
      setExistingOwners({
        personal,
        teamIds,
      });
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      message.error('Failed to load API keys');
    }
  };

  const fetchTeams = async () => {
    try {
      const teamList = await mockFetchTeams();
      setTeams(teamList);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      message.error('Failed to load teams');
    }
  };

  const showCreateModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      // 模拟API调用
      setTimeout(() => {
        // 生成随机的API key (真实环境中应该是后端生成)
        const newKey = `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
        let ownerName = 'Your Personal Key';
        if (values.ownerType === 'team') {
          const team = teams.find(t => t.id === values.ownerId);
          ownerName = team?.name || '';
        }
        
        const newApiKey: ApiKey = {
          id: Date.now().toString(),
          name: values.name,
          key: newKey, // 直接存储完整的key
          ownerType: values.ownerType,
          ownerId: values.ownerType === 'personal' ? 'user1' : values.ownerId,
          ownerName,
          createdAt: new Date().toISOString().split('T')[0]
        };
        
        setApiKeys([...apiKeys, newApiKey]);
        
        // 更新已存在的owners
        if (values.ownerType === 'personal') {
          setExistingOwners({ ...existingOwners, personal: true });
        } else {
          setExistingOwners({
            ...existingOwners,
            teamIds: [...existingOwners.teamIds, values.ownerId]
          });
        }
        
        setConfirmLoading(false);
        setIsModalVisible(false);
        setNewKeyVisible(true);
        setNewKeyValue(newKey);
      }, 1000);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
      .then(() => {
        message.success('API key copied to clipboard');
      })
      .catch(() => {
        message.error('Failed to copy API key');
      });
  };

  const handleRegenerateKey = (record: ApiKey) => {
    Modal.confirm({
      title: 'Regenerate API Key',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: 'Are you sure you want to regenerate this API key? The current key will be invalidated immediately.',
      onOk() {
        setRegenerateLoading(record.id);
        
        // 模拟API调用
        setTimeout(() => {
          // 生成随机的API key (真实环境中应该是后端生成)
          const newKey = `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
          
          // 更新record中的key
          const updatedKeys = apiKeys.map(key => {
            if (key.id === record.id) {
              return { ...key, key: newKey };
            }
            return key;
          });
          
          setApiKeys(updatedKeys);
          setRegenerateLoading(null);
          setNewKeyVisible(true);
          setNewKeyValue(newKey);
        }, 1000);
      },
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatApiKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    // 显示前6个字符和后4个字符，中间用 •••• 替代
    return `${key.substring(0, 6)}${'•'.repeat(20)}${key.substring(key.length - 4)}`;
  };

  const columns: ColumnsType<ApiKey> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Account Type',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (text, record) => (
        <>
          {record.ownerType === 'personal' ? (
            <Tag color="blue">Personal</Tag>
          ) : (
            <Tag color="green">Team</Tag>
          )}
          {text}
        </>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'key',
      key: 'key',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text code style={{ fontFamily: 'monospace', flex: 1 }}>
            {formatApiKey(text, visibleKeys.has(record.id))}
          </Text>
          <Button 
            type="text" 
            icon={visibleKeys.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />} 
            onClick={() => toggleKeyVisibility(record.id)}
            style={{ marginLeft: 8 }}
          />
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => handleCopyKey(text)}
            style={{ marginLeft: 4 }}
          />
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Regenerate API Key" overlayStyle={{ fontSize: '14px' }}>
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={() => handleRegenerateKey(record)}
              loading={regenerateLoading === record.id}
              className="regenerate-btn"
            >
              Regenerate
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="API Keys"
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showCreateModal}
        >
          Generate New API Key
        </Button>
      }
      style={{ background: '#141414', border: '1px solid #303030' }}
    >
      <Alert
        message="API Keys allow you to authenticate with our API"
        description="Keep your API keys secure - do not share them in publicly accessible areas. These keys provide full access to your account."
        type="info"
        showIcon
        className="api-keys-alert"
        style={{ marginBottom: 20 }}
      />

      <Table
        columns={columns}
        dataSource={apiKeys}
        rowKey="id"
        style={{ marginTop: 16 }}
      />

      {/* Create API Key Modal */}
      <Modal
        title="Generate API Key"
        open={isModalVisible}
        onOk={handleCreate}
        onCancel={handleCancel}
        confirmLoading={confirmLoading}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="API Key Name"
            rules={[{ required: true, message: 'Please enter a name for this API key' }]}
          >
            <Input placeholder="Enter a name to identify this API key" />
          </Form.Item>

          <Form.Item
            name="ownerType"
            label="Key Owner"
            rules={[{ required: true, message: 'Please select the owner type' }]}
          >
            <CustomSelect
              placeholder="Select key owner type"
              onChange={(value) => {
                if (value === 'personal') {
                  form.setFieldsValue({ ownerId: 'personal' });
                } else {
                  form.setFieldsValue({ ownerId: undefined });
                }
              }}
            >
              <Option value="personal" disabled={existingOwners.personal}>
                Personal {existingOwners.personal && '(Already exists)'}
              </Option>
              <Option value="team">Team</Option>
            </CustomSelect>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.ownerType !== currentValues.ownerType}
          >
            {({ getFieldValue }) => {
              const ownerType = getFieldValue('ownerType');
              return ownerType === 'team' ? (
                <Form.Item
                  name="ownerId"
                  label="Team"
                  rules={[{ required: true, message: 'Please select a team' }]}
                >
                  <CustomSelect placeholder="Select a team">
                    {teams.map(team => (
                      <Option 
                        key={team.id} 
                        value={team.id} 
                        disabled={existingOwners.teamIds.includes(team.id)}
                      >
                        {team.name} {existingOwners.teamIds.includes(team.id) && '(Already has a key)'}
                      </Option>
                    ))}
                  </CustomSelect>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Display New API Key Modal */}
      <Modal
        title="Your New API Key"
        open={newKeyVisible}
        onCancel={() => setNewKeyVisible(false)}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => handleCopyKey(newKeyValue)}>
            Copy to Clipboard
          </Button>,
          <Button key="close" onClick={() => setNewKeyVisible(false)}>
            Close
          </Button>
        ]}
        className="api-key-display-modal"
        width={580}
        centered
      >
        <Alert
          message="API Key Generated Successfully"
          description="Your API key has been generated and is now available for use. You can always view it again in the API Keys list."
          type="success"
          showIcon
          className="api-keys-alert"
          style={{ marginBottom: 24 }}
        />
        <Paragraph>
          <Text strong style={{ fontSize: '15px', color: '#ffffff', display: 'block', marginBottom: '12px' }}>Your API Key:</Text>
        </Paragraph>
        <div style={{ position: 'relative' }}>
          <Text 
            code 
            copyable={false} 
            style={{ 
              wordBreak: 'break-all', 
              display: 'block', 
              padding: '20px', 
              backgroundColor: '#0c1524', 
              border: '1px solid #234372', 
              borderRadius: '6px', 
              fontSize: '14px',
              color: '#1890ff',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
            }}
          >
            {newKeyValue}
          </Text>
          <div 
            style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px',
              background: 'rgba(12, 21, 36, 0.6)',
              borderRadius: '4px',
              padding: '4px'
            }}
          >
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopyKey(newKeyValue)}
              style={{ color: '#1890ff' }}
            />
          </div>
        </div>
        <Paragraph style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>
          Use this key to authenticate your API requests. For security, do not share this key publicly.
        </Paragraph>
      </Modal>
    </Card>
  );
};

export default ApiKeys; 