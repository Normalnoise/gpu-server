import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Divider, Checkbox, Row, Col, DatePicker, Statistic, Tooltip, Radio } from 'antd';
import ModelUsageDetailModal from '../components/ModelUsageDetailModal';
import type { RadioChangeEvent } from 'antd';
import dayjs from 'dayjs';
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
  EyeInvisibleOutlined,
  AreaChartOutlined,
  DollarOutlined,
  FileTextOutlined,
  ApiOutlined,
  FullscreenOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  ExportOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { createInvitation, sendInvitationEmail } from '../services/invitationService';

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

interface UsageRecord {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  app: string;
  tokensInput: number;
  tokensOutput: number;
  totalTokens: number;
  cost: number;
  speed: number;
  status: string;
  user: string;
  date: string; // Date in YYYY-MM-DD format for grouping
}

interface UsageSummary {
  spend: {
    lastDay: string;
    lastWeek: string;
  };
  tokens: {
    lastDay: number;
    lastWeek: number;
  };
  requests: {
    lastDay: number;
    lastWeek: number;
  };
}

interface ModelUsageSummary {
  model: string;
  provider: string;
  cost: number;
  tokens: number;
  requests: number;
  color: string;
}

interface DailyUsage {
  date: string;
  id?: string;
  models: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
  total: {
    cost: number;
    tokens: number;
    requests: number;
  };
}

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const TeamManagement: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKeyNameValue, setApiKeyNameValue] = useState('');
  const [form] = Form.useForm();
  const [apiKeyForm] = Form.useForm();
  const [apiKeyVisibility, setApiKeyVisibility] = useState<Record<string, boolean>>({});
  const [usageFilter, setUsageFilter] = useState<string>('team');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [chartType, setChartType] = useState<string>('spend');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modelDetailVisible, setModelDetailVisible] = useState(false);
  const [selectedModelData, setSelectedModelData] = useState<any>(null);

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

  // 模拟使用统计数据
  const [teamUsageSummary] = useState<UsageSummary>({
    spend: {
      lastDay: '$0.579',
      lastWeek: '$7.97',
    },
    tokens: {
      lastDay: 497000,
      lastWeek: 3770000,
    },
    requests: {
      lastDay: 868,
      lastWeek: 4950,
    }
  });

  // 模拟每日使用数据
  const [dailyUsage] = useState<DailyUsage[]>([
    {
      date: '2024-04-27',
      models: {
        'microsoft/wizardlm-2-8x22b': { cost: 0.000627, tokens: 698, requests: 1 },
        'gryphe/mythomax-l2-13b': { cost: 0.000082, tokens: 184, requests: 1 },
      },
      total: { cost: 0.000709, tokens: 882, requests: 2 }
    },
    {
      date: '2024-04-28',
      models: {},
      total: { cost: 0, tokens: 0, requests: 0 }
    },
    {
      date: '2024-04-29',
      models: {},
      total: { cost: 0, tokens: 0, requests: 0 }
    },
    {
      date: '2024-04-30',
      models: {
        'cohere/command-r-plus': { cost: 0.001073, tokens: 631, requests: 1 },
      },
      total: { cost: 0.001073, tokens: 631, requests: 1 }
    },
    {
      date: '2024-05-01',
      models: {
        'openai/gpt-4-turbo': { cost: 0.002444, tokens: 1880, requests: 2 },
      },
      total: { cost: 0.002444, tokens: 1880, requests: 2 }
    },
    {
      date: '2024-05-02',
      models: {
        'anthropic/claude-3-haiku-20240307': { cost: 0.000477, tokens: 795, requests: 2 },
      },
      total: { cost: 0.000477, tokens: 795, requests: 2 }
    },
    {
      date: '2024-05-03',
      models: {
        'mistral/mistral-large-latest': { cost: 0.002109, tokens: 1045, requests: 2 },
      },
      total: { cost: 0.002109, tokens: 1045, requests: 2 }
    },
    {
      date: '2024-05-04',
      models: {
        'openai/gpt-4o': { cost: 0.00267, tokens: 2054, requests: 2 },
      },
      total: { cost: 0.00267, tokens: 2054, requests: 2 }
    },
    {
      date: '2024-05-05',
      models: {
        'anthropic/claude-3-opus-20240229': { cost: 0.004356, tokens: 1452, requests: 2 },
      },
      total: { cost: 0.004356, tokens: 1452, requests: 2 }
    },
    {
      date: '2024-05-06',
      models: {},
      total: { cost: 0, tokens: 0, requests: 0 }
    },
    {
      date: '2024-05-07',
      models: {
        'google/gemini-2.0-flash-exp:free': { cost: 0, tokens: 589, requests: 3 },
      },
      total: { cost: 0, tokens: 589, requests: 3 }
    },
    {
      date: '2024-05-08',
      models: {},
      total: { cost: 0, tokens: 0, requests: 0 }
    },
    {
      date: '2024-05-09',
      models: {
        'google/gemini-2.0-flash-exp:free': { cost: 0, tokens: 506, requests: 3 },
        'openai/gpt-4o-mini': { cost: 0.0000072, tokens: 18, requests: 1 },
      },
      total: { cost: 0.0000072, tokens: 524, requests: 4 }
    },
    {
      id: '9',
      timestamp: '2024-05-07 03:21 PM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 76,
      tokensOutput: 144,
      totalTokens: 220,
      cost: 0,
      speed: 147.5,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-07'
    },
  ]);

  // 模拟模型使用汇总
  const [modelUsage] = useState<ModelUsageSummary[]>([
    { 
      model: 'microsoft/wizardlm-2-8x22b', 
      provider: 'Microsoft', 
      cost: 0.000627, 
      tokens: 698, 
      requests: 1,
      color: '#1890ff'
    },
    { 
      model: 'gryphe/mythomax-l2-13b', 
      provider: 'Gryphe', 
      cost: 0.000082, 
      tokens: 184, 
      requests: 1,
      color: '#13c2c2'
    },
    { 
      model: 'openai/gpt-4o-mini', 
      provider: 'OpenAI', 
      cost: 0.0000072, 
      tokens: 18, 
      requests: 1,
      color: '#faad14'
    },
    { 
      model: 'google/gemini-2.0-flash-exp:free', 
      provider: 'Google', 
      cost: 0, 
      tokens: 1095, 
      requests: 6,
      color: '#52c41a'
    },
    { 
      model: 'anthropic/claude-3-opus-20240229', 
      provider: 'Anthropic', 
      cost: 0.004356, 
      tokens: 1452, 
      requests: 2,
      color: '#eb2f96'
    },
    { 
      model: 'anthropic/claude-3-haiku-20240307', 
      provider: 'Anthropic', 
      cost: 0.000477, 
      tokens: 795, 
      requests: 2,
      color: '#722ed1'
    },
    { 
      model: 'openai/gpt-4o', 
      provider: 'OpenAI', 
      cost: 0.00267, 
      tokens: 2054, 
      requests: 2,
      color: '#fa8c16'
    },
    { 
      model: 'openai/gpt-4-turbo', 
      provider: 'OpenAI', 
      cost: 0.002444, 
      tokens: 1880, 
      requests: 2,
      color: '#fa541c'
    },
    { 
      model: 'mistral/mistral-large-latest', 
      provider: 'Mistral', 
      cost: 0.002109, 
      tokens: 1045, 
      requests: 2,
      color: '#391085'
    },
    { 
      model: 'cohere/command-r-plus', 
      provider: 'Cohere', 
      cost: 0.001073, 
      tokens: 631, 
      requests: 1,
      color: '#cf1322'
    }
  ]);

  // 模拟团队成员使用统计
  const [membersUsage] = useState<Record<string, UsageSummary>>({
    'owner@example.com': {
      spend: {
        lastDay: '$0.0000072',
        lastWeek: '$0.008417',
      },
      tokens: {
        lastDay: 506,
        lastWeek: 4314,
      },
      requests: {
        lastDay: 2,
        lastWeek: 8,
      }
    },
    'admin@example.com': {
      spend: {
        lastDay: '$0',
        lastWeek: '$0.005331',
      },
      tokens: {
        lastDay: 14,
        lastWeek: 3690,
      },
      requests: {
        lastDay: 1,
        lastWeek: 7,
      }
    },
    'member1@example.com': {
      spend: {
        lastDay: '$0',
        lastWeek: '$0.004392',
      },
      tokens: {
        lastDay: 0,
        lastWeek: 3247,
      },
      requests: {
        lastDay: 0,
        lastWeek: 6,
      }
    },
  });

  // 模拟使用记录
  const [usageRecords] = useState<UsageRecord[]>([
    {
      id: '1',
      timestamp: '2024-05-09 02:32 PM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 241,
      tokensOutput: 12,
      totalTokens: 253,
      cost: 0,
      speed: 157.9,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-09'
    },
    {
      id: '2',
      timestamp: '2024-05-09 02:31 PM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 15,
      tokensOutput: 224,
      totalTokens: 239,
      cost: 0,
      speed: 159.8,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-09'
    },
    {
      id: '3',
      timestamp: '2024-05-09 02:31 PM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 2,
      tokensOutput: 12,
      totalTokens: 14,
      cost: 0,
      speed: 82.2,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-09'
    },
    {
      id: '4',
      timestamp: '2024-05-09 10:49 AM',
      provider: 'OpenAI',
      model: 'gpt-4o-mini',
      app: 'OpenRouter: Chatroom',
      tokensInput: 8,
      tokensOutput: 10,
      totalTokens: 18,
      cost: 0.0000072,
      speed: 95.2,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-09'
    },
    {
      id: '5',
      timestamp: '2024-04-27 10:03 AM',
      provider: 'Microsoft',
      model: 'wizardlm-2-8x22b',
      app: 'OpenRouter: Chatroom',
      tokensInput: 58,
      tokensOutput: 640,
      totalTokens: 698,
      cost: 0.000627,
      speed: 38.8,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-04-27'
    },
    {
      id: '6',
      timestamp: '2024-04-27 10:15 AM',
      provider: 'Gryphe',
      model: 'mythomax-l2-13b',
      app: 'OpenRouter: Chatroom',
      tokensInput: 61,
      tokensOutput: 123,
      totalTokens: 184,
      cost: 0.000082,
      speed: 71.3,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-04-27'
    },
    {
      id: '7',
      timestamp: '2024-05-07 11:32 AM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 82,
      tokensOutput: 165,
      totalTokens: 247,
      cost: 0,
      speed: 143.2,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-07'
    },
    {
      id: '8',
      timestamp: '2024-05-07 11:45 AM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 35,
      tokensOutput: 87,
      totalTokens: 122,
      cost: 0,
      speed: 135.7,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-07'
    },
    {
      id: '9',
      timestamp: '2024-05-07 03:21 PM',
      provider: 'Google',
      model: 'gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 76,
      tokensOutput: 144,
      totalTokens: 220,
      cost: 0,
      speed: 147.5,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-07'
    },
    {
      id: '10',
      timestamp: '2024-05-05 09:17 AM',
      provider: 'Anthropic',
      model: 'claude-3-opus-20240229',
      app: 'OpenRouter: API',
      tokensInput: 182,
      tokensOutput: 621,
      totalTokens: 803,
      cost: 0.002409,
      speed: 42.3,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-05'
    },
    {
      id: '11',
      timestamp: '2024-05-05 09:45 AM',
      provider: 'Anthropic',
      model: 'claude-3-opus-20240229',
      app: 'OpenRouter: API',
      tokensInput: 157,
      tokensOutput: 492,
      totalTokens: 649,
      cost: 0.001947,
      speed: 44.7,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-05'
    },
    {
      id: '12',
      timestamp: '2024-05-04 01:37 PM',
      provider: 'OpenAI',
      model: 'gpt-4o',
      app: 'OpenRouter: API',
      tokensInput: 321,
      tokensOutput: 746,
      totalTokens: 1067,
      cost: 0.001387,
      speed: 71.2,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-04'
    },
    {
      id: '13',
      timestamp: '2024-05-04 02:12 PM',
      provider: 'OpenAI',
      model: 'gpt-4o',
      app: 'OpenRouter: API',
      tokensInput: 135,
      tokensOutput: 852,
      totalTokens: 987,
      cost: 0.001283,
      speed: 68.9,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-04'
    },
    {
      id: '14',
      timestamp: '2024-05-03 10:28 AM',
      provider: 'Mistral',
      model: 'mistral-large-latest',
      app: 'OpenRouter: Chatroom',
      tokensInput: 91,
      tokensOutput: 324,
      totalTokens: 415,
      cost: 0.000837,
      speed: 89.5,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-03'
    },
    {
      id: '15',
      timestamp: '2024-05-03 11:05 AM',
      provider: 'Mistral',
      model: 'mistral-large-latest',
      app: 'OpenRouter: Chatroom',
      tokensInput: 143,
      tokensOutput: 487,
      totalTokens: 630,
      cost: 0.001272,
      speed: 91.2,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-03'
    },
    {
      id: '16',
      timestamp: '2024-05-02 03:45 PM',
      provider: 'Anthropic',
      model: 'claude-3-haiku-20240307',
      app: 'OpenRouter: API',
      tokensInput: 76,
      tokensOutput: 218,
      totalTokens: 294,
      cost: 0.000176,
      speed: 112.8,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-02'
    },
    {
      id: '17',
      timestamp: '2024-05-02 04:21 PM',
      provider: 'Anthropic',
      model: 'claude-3-haiku-20240307',
      app: 'OpenRouter: API',
      tokensInput: 112,
      tokensOutput: 389,
      totalTokens: 501,
      cost: 0.000301,
      speed: 124.6,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-02'
    },
    {
      id: '18',
      timestamp: '2024-05-01 09:32 AM',
      provider: 'OpenAI',
      model: 'gpt-4-turbo',
      app: 'OpenRouter: Chatroom',
      tokensInput: 287,
      tokensOutput: 825,
      totalTokens: 1112,
      cost: 0.001446,
      speed: 63.7,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-01'
    },
    {
      id: '19',
      timestamp: '2024-05-01 10:17 AM',
      provider: 'OpenAI',
      model: 'gpt-4-turbo',
      app: 'OpenRouter: Chatroom',
      tokensInput: 176,
      tokensOutput: 592,
      totalTokens: 768,
      cost: 0.000998,
      speed: 65.3,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-01'
    },
    {
      id: '20',
      timestamp: '2024-04-30 02:15 PM',
      provider: 'Cohere',
      model: 'command-r-plus',
      app: 'OpenRouter: API',
      tokensInput: 153,
      tokensOutput: 478,
      totalTokens: 631,
      cost: 0.001073,
      speed: 96.4,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-04-30'
    }
  ]);

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
      console.log('Inviting member:', values);
      
      // Create an invitation using our invitationService
      const invitation = createInvitation(
        team.id,
        team.name,
        values.email,
        values.role,
        team.members.find(m => m.isCurrentUser)?.email || 'current-user@example.com'
      );
      
      // Create the invitation link
      const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
      
      // Simulate sending an email invitation
      try {
        await sendInvitationEmail(
          values.email,
          inviteLink,
          team.name,
          team.members.find(m => m.isCurrentUser)?.email || 'current-user@example.com'
        );
      } catch (emailError) {
        // Handle email sending error, but still show the invite link
        console.error('Failed to send invitation email:', emailError);
        message.warning('Could not send invitation email, but the invitation has been created.');
      }
      
      // Show success message with the invitation link
      Modal.success({
        title: 'Invitation Sent Successfully',
        content: (
          <div>
            <p>An invitation has been sent to {values.email}</p>
            <p>They can also use this link to join your team:</p>
            <Input.TextArea
              value={inviteLink}
              readOnly
              rows={2}
              style={{ marginTop: 16, marginBottom: 16 }}
            />
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                message.success('Invitation link copied to clipboard');
              }}
            >
              Copy Link
            </Button>
          </div>
        ),
        okText: 'Done',
      });
      
      setInviteModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to create invitation:', error);
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

  // 根据选择的用户和模型筛选使用记录
  const filteredUsageRecords = usageRecords.filter(record => {
    // Filter by user/team
    const userMatch = usageFilter === 'team' || record.user === usageFilter;
    
    // Filter by model
    const modelMatch = modelFilter === 'all' || record.model === modelFilter;
    
    // Filter by date range
    const recordDate = dayjs(record.date);
    const dateMatch = recordDate.isAfter(dateRange[0], 'day') && 
                      recordDate.isBefore(dateRange[1], 'day');
    
    // Filter by selected day if any
    const dayMatch = !selectedDay || record.date === selectedDay;
    
    return userMatch && modelMatch && dateMatch && dayMatch;
  });

  // 获取用户显示名称
  const getUserDisplayName = (email: string) => {
    const member = team.members.find(m => m.email === email);
    if (member) {
      return member.email + (member.isCurrentUser ? ' (You)' : '');
    }
    return email;
  };
  
  // 获取使用该模型的用户列表
  const getModelUsers = (records: UsageRecord[]): string => {
    const userEmails = Array.from(new Set(records.map(record => record.user)));
    return userEmails.map(email => {
      const member = team.members.find(m => m.email === email);
      return member ? (member.email.split('@')[0] + (member.isCurrentUser ? ' (You)' : '')) : email;
    }).join(', ');
  };
  
  // 获取当前日期范围内的所有日期
  const getDatesInRange = (): string[] => {
    const dates: string[] = [];
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    let currentDate = startDate;
    
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'day');
    }
    
    return dates;
  };
  
  // 获取日期表显格式
  const formatDate = (dateStr: string): string => {
    return dayjs(dateStr).format('MMM D');
  };
  
  // 按日期和模型筛选使用记录的图表数据
  const getChartData = () => {
    const dates = getDatesInRange();
    
    return dates.map(date => {
      // Filter records for this date and the selected user/team
      const recordsForDate = usageRecords.filter(record => {
        return record.date === date && 
              (usageFilter === 'team' || record.user === usageFilter) &&
              (modelFilter === 'all' || record.model === modelFilter);
      });
      
      // Group data by model
      const modelData: Record<string, {cost: number, tokens: number, requests: number}> = {};
      recordsForDate.forEach(record => {
        if (!modelData[record.model]) {
          modelData[record.model] = {cost: 0, tokens: 0, requests: 0};
        }
        modelData[record.model].cost += record.cost;
        modelData[record.model].tokens += record.totalTokens;
        modelData[record.model].requests += 1;
      });
      
      // Calculate total
      const total = {
        cost: Object.values(modelData).reduce((sum, data) => sum + data.cost, 0),
        tokens: Object.values(modelData).reduce((sum, data) => sum + data.tokens, 0),
        requests: Object.values(modelData).reduce((sum, data) => sum + data.requests, 0)
      };
      
      return {
        date,
        formattedDate: formatDate(date),
        models: modelData,
        total
      };
    });
  };
  
  // 处理点击柱状图
  const handleBarClick = (date: string) => {
    setSelectedDay(selectedDay === date ? null : date);
  };
  
  // 处理点击模型详情
  const handleModelDetailClick = (modelData: any) => {
    setSelectedModelData(modelData);
    setModelDetailVisible(true);
  };
  
  // 处理图表类型切换
  const handleChartTypeChange = (e: RadioChangeEvent) => {
    setChartType(e.target.value);
  };

  // 使用记录表格列定义
  const usageColumns: ColumnsType<UsageRecord> = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Timestamp
        </Text>
      ),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => (
        <Text style={{ color: '#ffffff' }}>{timestamp}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Provider / Model
        </Text>
      ),
      dataIndex: 'model',
      key: 'model',
      render: (model: string, record: UsageRecord) => (
        <Text style={{ color: '#ffffff' }}>
          {record.provider} / {model}
        </Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Used by
        </Text>
      ),
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => {
        const member = team.members.find(m => m.email === user);
        return (
          <Space>
            <Text style={{ color: '#ffffff' }}>
              {member ? member.email.split('@')[0] : user}
              {member?.isCurrentUser && <Tag color="blue" style={{ marginLeft: 4 }}>You</Tag>}
            </Text>
          </Space>
        );
      },
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Tokens
        </Text>
      ),
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (totalTokens: number, record: UsageRecord) => (
        <Text style={{ color: '#ffffff' }}>
          {record.tokensInput} → {record.tokensOutput}
        </Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Cost
        </Text>
      ),
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => (
        <Text style={{ color: '#ffffff' }}>
          ${cost === 0 ? '0' : cost.toFixed(7)}
        </Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Speed
        </Text>
      ),
      dataIndex: 'speed',
      key: 'speed',
      render: (speed: number) => (
        <Text style={{ color: '#ffffff' }}>
          {speed.toFixed(1)} tps
        </Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Finish
        </Text>
      ),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Text style={{ color: '#ffffff' }}>
          {status}
        </Text>
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
              <AreaChartOutlined />
              Usage Analytics
            </span>
          }
          key="usage"
        >
          <div className="usage-header" style={{ marginBottom: '24px' }}>
            <Typography.Title level={5} style={{ color: '#ffffff', marginBottom: '16px' }}>
              See how you've been using models on Nebula Block
              <Tooltip title="Usage statistics for your team's inference requests">
                <InfoCircleOutlined style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.45)' }} />
              </Tooltip>
            </Typography.Title>
            
            <div className="usage-filters" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Space>
                <Text strong style={{ color: '#ffffff' }}>Filter by:</Text>
                <Select 
                  value={usageFilter} 
                  onChange={setUsageFilter}
                  style={{ width: '200px' }}
                  dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
                >
                  <Select.Option value="team">Entire Team</Select.Option>
                  {team.members.map(member => (
                    <Select.Option key={member.id} value={member.email}>
                      {member.email} {member.isCurrentUser && '(You)'}
                    </Select.Option>
                  ))}
                </Select>
                
                <Text strong style={{ color: '#ffffff', marginLeft: '16px' }}>Model:</Text>
                <Select 
                  value={modelFilter} 
                  onChange={setModelFilter}
                  style={{ width: '240px' }}
                  dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
                >
                  <Select.Option value="all">All Models</Select.Option>
                  {modelUsage.map(model => (
                    <Select.Option key={model.model} value={model.model}>
                      {model.provider}/{model.model.split('/').pop()}
                    </Select.Option>
                  ))}
                </Select>
                
                <Text strong style={{ color: '#ffffff', marginLeft: '16px' }}>Date Range:</Text>
                <DatePicker.RangePicker 
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  style={{ background: '#1a1a1a', borderColor: '#303030' }}
                />
              </Space>
            </div>
          </div>
          
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Card className="usage-stat-card" style={{ background: '#1a1a1a', borderColor: '#303030' }}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>Spend</Text>} 
                  value={teamUsageSummary.spend.lastDay} 
                  valueStyle={{ color: '#ffffff', fontSize: '28px' }}
                />
                <div className="stat-footer" style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last day</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last week: {teamUsageSummary.spend.lastWeek}</Text>
                  </div>
                </div>
                <div className="stat-chart" style={{ height: '80px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                    {getChartData().slice(-7).map((day, index) => (
                      <div 
                        key={day.date} 
                        className="day-bar"
                        style={{
                          flexGrow: 1,
                          height: day.total.cost ? `${Math.max(20, day.total.cost * 100000)}px` : '5px',
                          margin: '0 2px',
                          backgroundColor: day.date === selectedDay ? '#1890ff' : 'rgba(24, 144, 255, 0.6)',
                          borderTopLeftRadius: '3px',
                          borderTopRightRadius: '3px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleBarClick(day.date)}
                        title={`${day.formattedDate}: $${day.total.cost.toFixed(7)}`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="usage-stat-card" style={{ background: '#1a1a1a', borderColor: '#303030' }}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>Tokens</Text>} 
                  value={teamUsageSummary.tokens.lastDay.toLocaleString()} 
                  valueStyle={{ color: '#ffffff', fontSize: '28px' }}
                  suffix="K"
                />
                <div className="stat-footer" style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last day</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last week: {(teamUsageSummary.tokens.lastWeek / 1000000).toFixed(2)}M</Text>
                  </div>
                </div>
                <div className="stat-chart" style={{ height: '80px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                    {getChartData().slice(-7).map((day, index) => (
                      <div 
                        key={day.date} 
                        className="day-bar"
                        style={{
                          flexGrow: 1,
                          height: day.total.tokens ? `${Math.max(20, (day.total.tokens / 1000) * 80 / 30)}px` : '5px',
                          margin: '0 2px',
                          backgroundColor: day.date === selectedDay ? '#faad14' : 'rgba(250, 173, 20, 0.6)',
                          borderTopLeftRadius: '3px',
                          borderTopRightRadius: '3px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleBarClick(day.date)}
                        title={`${day.formattedDate}: ${day.total.tokens.toLocaleString()} tokens`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="usage-stat-card" style={{ background: '#1a1a1a', borderColor: '#303030' }}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>Requests</Text>} 
                  value={teamUsageSummary.requests.lastDay} 
                  valueStyle={{ color: '#ffffff', fontSize: '28px' }}
                />
                <div className="stat-footer" style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last day</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last week: {teamUsageSummary.requests.lastWeek.toLocaleString()}K</Text>
                  </div>
                </div>
                <div className="stat-chart" style={{ height: '80px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                    {getChartData().slice(-7).map((day, index) => (
                      <div 
                        key={day.date} 
                        className="day-bar"
                        style={{
                          flexGrow: 1,
                          height: day.total.requests ? `${Math.max(20, day.total.requests * 15)}px` : '5px',
                          margin: '0 2px',
                          backgroundColor: day.date === selectedDay ? '#52c41a' : 'rgba(82, 196, 26, 0.6)',
                          borderTopLeftRadius: '3px',
                          borderTopRightRadius: '3px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleBarClick(day.date)}
                        title={`${day.formattedDate}: ${day.total.requests} requests`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
          
          {selectedDay && (
            <div className="selected-day-details" style={{ marginBottom: '24px' }}>
              <Card style={{ background: '#1a1a1a', borderColor: '#303030' }}>
                <Typography.Title level={5} style={{ color: '#ffffff', marginBottom: '16px' }}>
                  Usage Details for {formatDate(selectedDay)}
                </Typography.Title>
                
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <div className="model-breakdown">
                      <Table
                        columns={[
                          {
                            title: 'Model',
                            dataIndex: 'model',
                            key: 'model',
                            render: (_, record: ModelUsageSummary) => (
                              <Space>
                                <div style={{ width: 12, height: 12, backgroundColor: record.color, borderRadius: '50%' }} />
                                <Text style={{ color: '#ffffff' }}>{record.model.split('/').pop()}</Text>
                              </Space>
                            )
                          },
                          {
                            title: 'Provider',
                            dataIndex: 'provider',
                            key: 'provider',
                            render: (provider) => <Text style={{ color: '#ffffff' }}>{provider}</Text>
                          },
                          {
                            title: 'Cost',
                            dataIndex: 'cost',
                            key: 'cost',
                            render: (cost) => <Text style={{ color: '#ffffff' }}>${cost.toFixed(7)}</Text>
                          },
                          {
                            title: 'Tokens',
                            dataIndex: 'tokens',
                            key: 'tokens',
                            render: (tokens) => <Text style={{ color: '#ffffff' }}>{tokens.toLocaleString()}</Text>
                          },
                          {
                            title: 'Requests',
                            dataIndex: 'requests',
                            key: 'requests',
                            render: (requests) => <Text style={{ color: '#ffffff' }}>{requests}</Text>
                          },
                          {
                            title: 'Users',
                            key: 'users',
                            render: (_, record: ModelUsageSummary) => {
                              const recordsForModel = filteredUsageRecords.filter(r => r.date === selectedDay && r.model === record.model);
                              return <Text style={{ color: '#ffffff' }}>{getModelUsers(recordsForModel)}</Text>;
                            }
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record: ModelUsageSummary) => (
                              <Button 
                                type="link" 
                                size="small"
                                onClick={() => handleModelDetailClick({...record, date: selectedDay})}
                              >
                                详情
                              </Button>
                            )
                          }
                        ]}
                        dataSource={modelUsage.filter(model => {
                          // Only include models that have data for the selected day
                          const recordsForDate = usageRecords.filter(r => 
                            r.date === selectedDay && 
                            r.model === model.model && 
                            (usageFilter === 'team' || r.user === usageFilter)
                          );
                          return recordsForDate.length > 0;
                        })}
                        pagination={false}
                        rowKey="model"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          )}
          
          <Table
            columns={usageColumns}
            dataSource={filteredUsageRecords}
            rowKey="id"
            className="usage-table"
            pagination={{ pageSize: 10 }}
            style={{ background: '#141414', borderRadius: '8px' }}
          />
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

      {/* 模型使用详情弹窗 */}
      <ModelUsageDetailModal
        visible={modelDetailVisible}
        onClose={() => setModelDetailVisible(false)}
        modelData={selectedModelData}
        usageRecords={usageRecords}
        date={selectedModelData?.date || ''}
      />
    </Card>
  );
};

export default TeamManagement;