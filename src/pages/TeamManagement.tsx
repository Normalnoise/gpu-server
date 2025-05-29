import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Divider, Checkbox, Row, Col, DatePicker, Statistic, Tooltip, Radio, Spin } from 'antd';
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
  UserSwitchOutlined,
  DesktopOutlined,
  ReloadOutlined // Added ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { createInvitation, sendInvitationEmail } from '../services/invitationService';
import TeamInstanceList from '../components/TeamInstanceList';
import { 
  getTeamInstancesWithMemberInfo, 
  createMockTeamInstances, 
  InstanceData,
  updateInstanceStatus 
} from '../services/instanceService';

// Add type definitions
type PermissionPackageType = keyof typeof PERMISSION_PACKAGES | 'custom';

interface TeamMember {
  id: string;
  name?: string; // Added name property
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  invitedAt: string;
  expiresAt?: string;
  invitedBy?: string;
  isCurrentUser?: boolean;
  permissions?: string[]; // Added permissions
}

interface TeamApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'disabled'; // This might be redundant if we use balance check
  lastUsed?: string;
  // No ownerType/ownerId needed here as these keys belong to the current team
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  currentUserRole: 'owner' | 'admin' | 'member';
  apiKeys: TeamApiKey[];
  balance?: number; // Added team balance
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

const PERMISSION_GROUPS = {
  instance: {
    title: 'Instance',
    permissions: [
      {
        key: 'create_instance',
        label: 'Create Instance',
        description: 'Allow users to create new compute instances',
        group: 'instance'
      },
      {
        key: 'read_instance',
        label: 'Read Instance',
        description: 'Allow users to view compute instance information',
        group: 'instance'
      },
      {
        key: 'delete_instance',
        label: 'Delete Instance',
        description: 'Allow users to delete compute instances',
        group: 'instance'
      },
      { // New permission added here
        key: 'manage_instance',
        label: 'Manage Instance',
        description: 'Allow users to manage instance settings (e.g., start, stop, restart)',
        group: 'instance'
      }
    ]
  },
  storage: {
    title: 'Storage',
    permissions: [
      {
        key: 'create_storage',
        label: 'Create Storage',
        description: 'Allow users to create new storage spaces',
        group: 'storage'
      },
      {
        key: 'read_storage',
        label: 'Read Storage',
        description: 'Allow users to view storage contents',
        group: 'storage'
      },
      {
        key: 'delete_storage',
        label: 'Delete Storage',
        description: 'Allow users to delete storage contents',
        group: 'storage'
      },
      {
        key: 'manage_storage_access',
        label: 'Manage Storage Access',
        description: 'Allow users to manage storage access permissions',
        group: 'storage'
      }
    ]
  },
  inference: { // Moved Inference before Billing
    title: 'Inference',
    permissions: [
      {
        key: 'use_inference',
        label: 'Use Inference',
        description: 'Allow users to use inference services',
        group: 'inference'
      }
    ]
  },
  billing: {
    title: 'Billing',
    permissions: [
      {
        key: 'view_billing',
        label: 'View Billing',
        description: 'Allow users to view team billing information',
        group: 'billing'
      }
    ]
  }
};

const PERMISSION_PACKAGES = {
  developer: {
    name: 'Developer Package',
    permissions: [
      'read_instance',
      'create_storage',
      'read_storage',
      'use_inference'
    ]
  },
  admin: {
    name: 'Administrator Package',
    permissions: [
      'create_instance',
      'read_instance',
      'delete_instance',
      'create_storage',
      'read_storage',
      'delete_storage',
      'manage_storage_access',
      'view_billing',
      'use_inference'
    ]
  }
};

const TeamManagement: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabKey, setActiveTabKey] = useState('members');
  const [editPermissionModalVisible, setEditPermissionModalVisible] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedPermissionPreset, setSelectedPermissionPreset] = useState<string>('custom');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (location.hash === '#usage') {
      setActiveTabKey('usage');
    } else {
      setActiveTabKey('members'); // Default tab
    }
  }, [location.hash]);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKeyNameValue, setApiKeyNameValue] = useState('');
  const [form] = Form.useForm();
  const [apiKeyForm] = Form.useForm();
  const [apiKeyVisibility, setApiKeyVisibility] = useState<Record<string, boolean>>({});
  const [regenerateApiKeyLoading, setRegenerateApiKeyLoading] = useState<string | null>(null); // Added for regenerate loading state
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
  const [selectedPermissionPackage, setSelectedPermissionPackage] = useState<string>('custom');
  const [teamInstances, setTeamInstances] = useState<InstanceData[]>([]);
  const [instancesLoading, setInstancesLoading] = useState<boolean>(false);
  const [mockData] = useState<boolean>(true); // Set to true to generate mock data
  const [currentUserEmail] = useState<string>('user@example.com'); // Current user's email

  // Mock team data
  const [team, setTeam] = useState<Team>({ // Changed to useState with setTeam
    id: teamId || '',
    name: 'ML Development',
    description: 'Machine Learning Development Team',
    currentUserRole: 'owner', // Changed from 'admin' to 'owner'
    balance: 0, // Mock balance, set to 0 to test disabled state, or > 0 for active
    members: [
      { id: '1', name: 'Owner User', email: 'owner@example.com', role: 'owner', status: 'active', invitedAt: '2024-04-01', invitedBy: 'System', permissions: ['create_inference_api_key', 'create_storage_secret_key', 'manage_billing'], isCurrentUser: true }, // Added name and isCurrentUser: true
      { id: '2', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', invitedAt: '2024-04-01', invitedBy: 'owner@example.com', permissions: ['create_inference_api_key', 'create_storage_secret_key'] }, // Added name, removed isCurrentUser: true
      { id: '3', name: 'Member One', email: 'member1@example.com', role: 'member', status: 'active', invitedAt: '2024-04-01', invitedBy: 'admin@example.com', permissions: ['create_inference_api_key'] }, // Added name
      { id: '4', email: 'pending1@example.com', role: 'member', status: 'pending', invitedAt: '2024-04-01', expiresAt: '2024-05-01', invitedBy: 'admin@example.com', permissions: ['create_inference_api_key'] },
    ],
    apiKeys: [
      { id: '1', name: 'Production API Key', key: 'sk_prod_123456789', createdAt: '2024-04-01', createdBy: 'owner@example.com', status: 'active', lastUsed: '2024-04-10' },
      { id: '2', name: 'Development API Key', key: 'sk_dev_987654321', createdAt: '2024-04-05', createdBy: 'admin@example.com', status: 'active', lastUsed: '2024-04-09' },
      { id: '3', name: 'Testing API Key', key: 'sk_test_123123123', createdAt: '2024-04-07', createdBy: 'member1@example.com', status: 'disabled', lastUsed: '2024-04-08' },
    ]
  });

  // Mock usage statistics data
  const [teamUsageSummary] = useState<UsageSummary>({
    spend: {
      lastDay: '$1.579',
      lastWeek: '$18.97',
    },
    tokens: {
      lastDay: 1297000,
      lastWeek: 12770000,
    },
    requests: {
      lastDay: 2868,
      lastWeek: 14950,
    }
  });

  // Mock daily usage data
  const [dailyUsage] = useState<DailyUsage[]>([
    {
      date: '2024-04-27',
      models: {
        'microsoft/wizardlm-2-8x22b': { cost: 0.000627, tokens: 698, requests: 1 },
        'gryphe/mythomax-l2-13b': { cost: 0.000082, tokens: 184, requests: 1 },
        'openai/gpt-4o-mini': { cost: 0.0000135, tokens: 36, requests: 2 },
        'meta/llama-3-70b-instruct': { cost: 0.000235, tokens: 298, requests: 1 }
      },
      total: { cost: 0.0009575, tokens: 1216, requests: 5 }
    },
    {
      date: '2024-04-28',
      models: {
        'openai/gpt-4o': { cost: 0.00172, tokens: 1324, requests: 1 },
        'anthropic/claude-3-haiku-20240307': { cost: 0.000258, tokens: 430, requests: 1 },
        'groq/llama-3-70b-8192': { cost: 0.000356, tokens: 624, requests: 1 }
      },
      total: { cost: 0.002334, tokens: 2378, requests: 3 }
    },
    {
      date: '2024-04-29',
      models: {
        'anthropic/claude-3-opus-20240229': { cost: 0.003254, tokens: 1084, requests: 1 },
        'mistral/mistral-large-latest': { cost: 0.001023, tokens: 506, requests: 1 },
        'microsoft/wizardlm-2-8x22b': { cost: 0.000492, tokens: 547, requests: 1 }
      },
      total: { cost: 0.004769, tokens: 2137, requests: 3 }
    },
    {
      date: '2024-04-30',
      models: {
        'cohere/command-r-plus': { cost: 0.001073, tokens: 631, requests: 1 },
        'openai/gpt-4-turbo': { cost: 0.001845, tokens: 1418, requests: 1 },
        'google/gemini-2.0-flash-exp:free': { cost: 0, tokens: 236, requests: 2 },
        'anthropic/claude-3-haiku-20240307': { cost: 0.000188, tokens: 312, requests: 1 }
      },
      total: { cost: 0.003106, tokens: 2597, requests: 5 }
    },
    {
      date: '2024-05-01',
      models: {
        'openai/gpt-4-turbo': { cost: 0.002444, tokens: 1880, requests: 2 },
        'anthropic/claude-3-opus-20240229': { cost: 0.000893, tokens: 297, requests: 1 },
        'gryphe/mythomax-l2-13b': { cost: 0.000187, tokens: 416, requests: 1 }
      },
      total: { cost: 0.003524, tokens: 2593, requests: 4 }
    },
    {
      date: '2024-05-02',
      models: {
        'anthropic/claude-3-haiku-20240307': { cost: 0.000477, tokens: 795, requests: 2 },
        'mistral/mistral-large-latest': { cost: 0.000834, tokens: 412, requests: 1 },
        'openai/gpt-4o': { cost: 0.000946, tokens: 727, requests: 1 }
      },
      total: { cost: 0.002257, tokens: 1934, requests: 4 }
    },
    {
      date: '2024-05-03',
      models: {
        'mistral/mistral-large-latest': { cost: 0.002109, tokens: 1045, requests: 2 },
        'cohere/command-r-plus': { cost: 0.000867, tokens: 509, requests: 1 },
        'openai/gpt-4o-mini': { cost: 0.000092, tokens: 232, requests: 1 }
      },
      total: { cost: 0.003068, tokens: 1786, requests: 4 }
    },
    {
      date: '2024-05-04',
      models: {
        'openai/gpt-4o': { cost: 0.00267, tokens: 2054, requests: 2 },
        'meta/llama-3-70b-instruct': { cost: 0.000397, tokens: 352, requests: 1 },
        'groq/llama-3-70b-8192': { cost: 0.000215, tokens: 242, requests: 1 }
      },
      total: { cost: 0.003282, tokens: 2648, requests: 4 }
    },
    {
      date: '2024-05-05',
      models: {
        'anthropic/claude-3-opus-20240229': { cost: 0.004356, tokens: 1452, requests: 2 },
        'openai/gpt-4-turbo': { cost: 0.001327, tokens: 1021, requests: 1 },
        'gryphe/mythomax-l2-13b': { cost: 0.000201, tokens: 449, requests: 1 }
      },
      total: { cost: 0.005884, tokens: 2922, requests: 4 }
    },
    {
      date: '2024-05-06',
      models: {
        'microsoft/wizardlm-2-8x22b': { cost: 0.000815, tokens: 907, requests: 1 },
        'openai/gpt-4o-mini': { cost: 0.000098, tokens: 245, requests: 1 }
      },
      total: { cost: 0.000913, tokens: 1152, requests: 2 }
    },
    {
      date: '2024-05-07',
      models: {
        'google/gemini-2.0-flash-exp:free': { cost: 0, tokens: 589, requests: 3 },
        'cohere/command-r-plus': { cost: 0.000927, tokens: 544, requests: 1 },
        'anthropic/claude-3-haiku-20240307': { cost: 0.000274, tokens: 458, requests: 1 }
      },
      total: { cost: 0.001201, tokens: 1591, requests: 5 }
    },
    {
      date: '2024-05-08',
      models: {
        'openai/gpt-4o': { cost: 0.001358, tokens: 1045, requests: 1 },
        'meta/llama-3-70b-instruct': { cost: 0.000472, tokens: 419, requests: 1 }
      },
      total: { cost: 0.00183, tokens: 1464, requests: 2 }
    },
    {
      date: '2024-05-09',
      models: {
        'google/gemini-2.0-flash-exp:free': { cost: 0, tokens: 506, requests: 3 },
        'openai/gpt-4o-mini': { cost: 0.0000072, tokens: 18, requests: 1 },
      },
      total: { cost: 0.0000072, tokens: 524, requests: 4 }
    }
  ]);

  // Mock model usage summary
  const [modelUsage] = useState<ModelUsageSummary[]>([
    { 
      model: 'microsoft/wizardlm-2-8x22b', 
      provider: 'Microsoft', 
      cost: 0.004127, 
      tokens: 4596, 
      requests: 7,
      color: '#4285F4'
    },
    { 
      model: 'gryphe/mythomax-l2-13b', 
      provider: 'Gryphe', 
      cost: 0.000752, 
      tokens: 1675, 
      requests: 5,
      color: '#34A853'
    },
    { 
      model: 'openai/gpt-4o-mini', 
      provider: 'OpenAI', 
      cost: 0.000386, 
      tokens: 812, 
      requests: 9,
      color: '#10B981'
    },
    { 
      model: 'google/gemini-2.0-flash-exp:free', 
      provider: 'Google', 
      cost: 0, 
      tokens: 4982, 
      requests: 18,
      color: '#FBBC05'
    },
    { 
      model: 'anthropic/claude-3-opus-20240229', 
      provider: 'Anthropic', 
      cost: 0.012458, 
      tokens: 4152, 
      requests: 8,
      color: '#9B59B6'
    },
    { 
      model: 'anthropic/claude-3-haiku-20240307', 
      provider: 'Anthropic', 
      cost: 0.003275, 
      tokens: 5462, 
      requests: 11,
      color: '#8E44AD'
    },
    { 
      model: 'openai/gpt-4o', 
      provider: 'OpenAI', 
      cost: 0.009864, 
      tokens: 7592, 
      requests: 8,
      color: '#0EA5E9'
    },
    { 
      model: 'openai/gpt-4-turbo', 
      provider: 'OpenAI', 
      cost: 0.007952, 
      tokens: 6114, 
      requests: 6,
      color: '#0D9488'
    },
    { 
      model: 'mistral/mistral-large-latest', 
      provider: 'Mistral', 
      cost: 0.008316, 
      tokens: 4123, 
      requests: 9,
      color: '#6366F1'
    },
    { 
      model: 'cohere/command-r-plus', 
      provider: 'Cohere', 
      cost: 0.005218, 
      tokens: 3067, 
      requests: 6,
      color: '#EC4899'
    },
    { 
      model: 'meta/llama-3-70b-instruct', 
      provider: 'Meta', 
      cost: 0.002865, 
      tokens: 2548, 
      requests: 7,
      color: '#3B82F6'
    },
    { 
      model: 'groq/llama-3-70b-8192', 
      provider: 'Groq', 
      cost: 0.001756, 
      tokens: 1982, 
      requests: 4,
      color: '#9254de'
    }
  ]);

  // Mock team member usage statistics
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

  // Mock usage records
  const [usageRecords] = useState<UsageRecord[]>([
    // Today's records (May 9)
    {
      id: '101',
      timestamp: '2024-05-09 17:45 PM',
      provider: 'Meta',
      model: 'meta/llama-3-70b-instruct',
      app: 'OpenRouter: Chatroom',
      tokensInput: 312,
      tokensOutput: 876,
      totalTokens: 1188,
      cost: 0.000953,
      speed: 152.6,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-09'
    },
    {
      id: '102',
      timestamp: '2024-05-09 16:12 PM',
      provider: 'Groq',
      model: 'groq/llama-3-70b-8192',
      app: 'OpenRouter: API',
      tokensInput: 145,
      tokensOutput: 573,
      totalTokens: 718,
      cost: 0.000639,
      speed: 264.8,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-09'
    },
    {
      id: '103',
      timestamp: '2024-05-09 14:38 PM',
      provider: 'Anthropic',
      model: 'anthropic/claude-3-haiku-20240307',
      app: 'OpenRouter: Chatroom',
      tokensInput: 201,
      tokensOutput: 754,
      totalTokens: 955,
      cost: 0.000573,
      speed: 138.7,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-09'
    },
    {
      id: '1',
      timestamp: '2024-05-09 02:32 PM',
      provider: 'Google',
      model: 'google/gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 241,
      tokensOutput: 612,
      totalTokens: 853,
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
      model: 'google/gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 115,
      tokensOutput: 424,
      totalTokens: 539,
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
      model: 'google/gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 42,
      tokensOutput: 212,
      totalTokens: 254,
      cost: 0,
      speed: 152.2,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-09'
    },
    {
      id: '4',
      timestamp: '2024-05-09 10:49 AM',
      provider: 'OpenAI',
      model: 'openai/gpt-4o-mini',
      app: 'OpenRouter: Chatroom',
      tokensInput: 98,
      tokensOutput: 210,
      totalTokens: 308,
      cost: 0.000124,
      speed: 95.2,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-09'
    },
    
    // May 8 records
    {
      id: '201',
      timestamp: '2024-05-08 18:47 PM',
      provider: 'OpenAI',
      model: 'openai/gpt-4o',
      app: 'OpenRouter: API',
      tokensInput: 267,
      tokensOutput: 935,
      totalTokens: 1202,
      cost: 0.001564,
      speed: 87.3,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-08'
    },
    {
      id: '202',
      timestamp: '2024-05-08 15:23 PM',
      provider: 'Anthropic',
      model: 'anthropic/claude-3-haiku-20240307',
      app: 'OpenRouter: Chatroom',
      tokensInput: 157,
      tokensOutput: 532,
      totalTokens: 689,
      cost: 0.000414,
      speed: 142.8,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-08'
    },
    
    // May 7 records
    {
      id: '301',
      timestamp: '2024-05-07 19:32 PM',
      provider: 'Meta',
      model: 'meta/llama-3-70b-instruct',
      app: 'OpenRouter: API',
      tokensInput: 178,
      tokensOutput: 724,
      totalTokens: 902,
      cost: 0.000723,
      speed: 151.8,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-07'
    },
    {
      id: '7',
      timestamp: '2024-05-07 11:32 AM',
      provider: 'Google',
      model: 'google/gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 182,
      tokensOutput: 465,
      totalTokens: 647,
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
      model: 'google/gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 135,
      tokensOutput: 387,
      totalTokens: 522,
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
      model: 'google/gemini-2.0-flash-exp:free',
      app: 'OpenRouter: Chatroom',
      tokensInput: 176,
      tokensOutput: 544,
      totalTokens: 720,
      cost: 0,
      speed: 147.5,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-07'
    },
    
    // May 6 records
    {
      id: '401',
      timestamp: '2024-05-06 14:16 PM',
      provider: 'Mistral',
      model: 'mistral/mistral-large-latest',
      app: 'OpenRouter: API',
      tokensInput: 183,
      tokensOutput: 556,
      totalTokens: 739,
      cost: 0.001493,
      speed: 96.7,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-06'
    },
    {
      id: '402',
      timestamp: '2024-05-06 10:50 AM',
      provider: 'OpenAI',
      model: 'openai/gpt-4-turbo',
      app: 'OpenRouter: Chatroom',
      tokensInput: 251,
      tokensOutput: 878,
      totalTokens: 1129,
      cost: 0.001468,
      speed: 65.9,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-06'
    },
    
    // May 5 records
    {
      id: '10',
      timestamp: '2024-05-05 09:17 AM',
      provider: 'Anthropic',
      model: 'anthropic/claude-3-opus-20240229',
      app: 'OpenRouter: API',
      tokensInput: 282,
      tokensOutput: 921,
      totalTokens: 1203,
      cost: 0.003609,
      speed: 42.3,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-05'
    },
    {
      id: '11',
      timestamp: '2024-05-05 09:45 AM',
      provider: 'Anthropic',
      model: 'anthropic/claude-3-opus-20240229',
      app: 'OpenRouter: API',
      tokensInput: 257,
      tokensOutput: 792,
      totalTokens: 1049,
      cost: 0.003147,
      speed: 44.7,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-05'
    },
    {
      id: '501',
      timestamp: '2024-05-05 15:07 PM',
      provider: 'Cohere',
      model: 'cohere/command-r-plus',
      app: 'OpenRouter: API',
      tokensInput: 166,
      tokensOutput: 523,
      totalTokens: 689,
      cost: 0.001172,
      speed: 98.2,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-05'
    },
    
    // May 4 records
    {
      id: '12',
      timestamp: '2024-05-04 01:37 PM',
      provider: 'OpenAI',
      model: 'openai/gpt-4o',
      app: 'OpenRouter: API',
      tokensInput: 321,
      tokensOutput: 946,
      totalTokens: 1267,
      cost: 0.001647,
      speed: 71.2,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-04'
    },
    {
      id: '13',
      timestamp: '2024-05-04 02:12 PM',
      provider: 'OpenAI',
      model: 'openai/gpt-4o',
      app: 'OpenRouter: API',
      tokensInput: 235,
      tokensOutput: 952,
      totalTokens: 1187,
      cost: 0.001543,
      speed: 68.9,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-04'
    },
    {
      id: '601',
      timestamp: '2024-05-04 11:24 AM',
      provider: 'Microsoft',
      model: 'microsoft/wizardlm-2-8x22b',
      app: 'OpenRouter: Chatroom',
      tokensInput: 187,
      tokensOutput: 734,
      totalTokens: 921,
      cost: 0.000829,
      speed: 41.6,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-04'
    },
    
    // Other days' records
    {
      id: '14',
      timestamp: '2024-05-03 10:28 AM',
      provider: 'Mistral',
      model: 'mistral/mistral-large-latest',
      app: 'OpenRouter: Chatroom',
      tokensInput: 191,
      tokensOutput: 624,
      totalTokens: 815,
      cost: 0.001647,
      speed: 89.5,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-03'
    },
    {
      id: '15',
      timestamp: '2024-05-03 11:05 AM',
      provider: 'Mistral',
      model: 'mistral/mistral-large-latest',
      app: 'OpenRouter: Chatroom',
      tokensInput: 243,
      tokensOutput: 787,
      totalTokens: 1030,
      cost: 0.002081,
      speed: 91.2,
      status: 'stop',
      user: 'member1@example.com',
      date: '2024-05-03'
    },
    {
      id: '16',
      timestamp: '2024-05-02 03:45 PM',
      provider: 'Anthropic',
      model: 'anthropic/claude-3-haiku-20240307',
      app: 'OpenRouter: API',
      tokensInput: 176,
      tokensOutput: 518,
      totalTokens: 694,
      cost: 0.000416,
      speed: 112.8,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-02'
    },
    {
      id: '17',
      timestamp: '2024-05-02 04:21 PM',
      provider: 'Anthropic',
      model: 'anthropic/claude-3-haiku-20240307',
      app: 'OpenRouter: API',
      tokensInput: 212,
      tokensOutput: 689,
      totalTokens: 901,
      cost: 0.000541,
      speed: 124.6,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-05-02'
    },
    {
      id: '18',
      timestamp: '2024-05-01 09:32 AM',
      provider: 'OpenAI',
      model: 'openai/gpt-4-turbo',
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
      model: 'openai/gpt-4-turbo',
      app: 'OpenRouter: Chatroom',
      tokensInput: 276,
      tokensOutput: 892,
      totalTokens: 1168,
      cost: 0.001518,
      speed: 65.3,
      status: 'stop',
      user: 'owner@example.com',
      date: '2024-05-01'
    },
    {
      id: '20',
      timestamp: '2024-04-30 02:15 PM',
      provider: 'Cohere',
      model: 'cohere/command-r-plus',
      app: 'OpenRouter: API',
      tokensInput: 253,
      tokensOutput: 678,
      totalTokens: 931,
      cost: 0.001582,
      speed: 96.4,
      status: 'stop',
      user: 'admin@example.com',
      date: '2024-04-30'
    }
  ]);

  // Initialize visibility state for API keys
  React.useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    team.apiKeys.forEach(key => {
      initialVisibility[key.id] = false; // Hide all API keys by default
    });
    setApiKeyVisibility(initialVisibility);
  }, [team.apiKeys]);

  const toggleApiKeyVisibility = (keyId: string) => {
    setApiKeyVisibility(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // Check if team balance is sufficient
  const checkTeamHasSufficientBalance = (): boolean => {
    // In a real app, this would come from fetched team data or props
    return (team?.balance || 0) > 0;
  };

  // Renamed from formatApiKey to avoid potential conflicts if another formatApiKey exists elsewhere.
  const formatTeamApiKeyDisplay = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    // Show first 6 characters and last 4 characters, replace middle with ••••
    return `${key.substring(0, 6)}${'•'.repeat(20)}${key.substring(key.length - 4)}`;
  };

  // Format API key display
  const formatApiKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    // Only show first 4 and last 4 characters, replace the rest with *
    const prefix = key.substring(0, 4);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'*'.repeat(Math.max(0, key.length - 8))}${suffix}`;
  };

  const handleInviteMember = async (values: { email: string; role: string; permissions: string[] }) => {
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

      // Add pending member to the team state for demonstration purposes
      const newPendingMember: TeamMember = {
        id: `pending-${Date.now()}`, // Simple unique ID for demo
        email: values.email,
        role: values.role as 'admin' | 'member',
        status: 'pending',
        invitedAt: dayjs().format('YYYY-MM-DD'),
        expiresAt: dayjs().add(7, 'days').format('YYYY-MM-DD'), // Example expiration
        invitedBy: team.members.find(m => m.isCurrentUser)?.email || 'current-user@example.com',
        permissions: values.permissions,
      };
      setTeam(prevTeam => ({
        ...prevTeam,
        members: [...prevTeam.members, newPendingMember],
      }));

    } catch (error) {
      console.error('Failed to create invitation:', error);
      message.error('Failed to send invitation');
    }
  };

  const handleCreateApiKey = async (values: { name: string }) => {
    try {
      // TODO: Implement API call for creating API Key
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
      // TODO: Implement API call for updating role
      console.log('Updating role:', { memberId, newRole });
      setTeam(prevTeam => ({
        ...prevTeam,
        members: prevTeam.members.map(member =>
          member.id === memberId ? { ...member, role: newRole as 'owner' | 'admin' | 'member' } : member
        ),
      }));
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
          // TODO: Implement API call for removing member
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
          // TODO: Implement API call for canceling invitation
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
          // TODO: Implement API call for enabling/disabling API Key
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
          // TODO: Implement API call for deleting API Key
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
          // TODO: Implement API call for deleting team
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
        // Transferring ownership requires more steps, should open a modal to select new owner
      // Simplified handling, just show a message here
        message.info('Please select a member to transfer ownership to');
      },
    });
  };

  // Design unified table header style
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
      width: '25%', // Adjusted width
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
      width: '15%', // Adjusted width
      render: (role: string, record: TeamMember) => {
        // Condition for showing dropdown: current user is owner, target is not owner, and target is not current user.
        if (team.currentUserRole === 'owner' && record.role !== 'owner' && !record.isCurrentUser) {
          return (
            <Select
              value={role} // Controlled component
              style={{ width: 120 }}
              onChange={(value) => handleUpdateRole(record.id, value)}
              dropdownClassName="role-select-dropdown"
            >
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
            </Select>
          );
        }
        // Default display for roles (Tag)
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
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Permissions
        </Text>
      ),
      dataIndex: 'permissions',
      key: 'permissions',
      width: '20%',
      render: (permissions: string[]) => (
        <div>
          {permissions && permissions.length > 0 ? (
            permissions.map(permission => (
              <Tag key={permission} color="geekblue" style={{ marginBottom: '4px' }}>
                {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Tag>
            ))
          ) : (
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>No specific permissions</Text>
          )}
        </div>
      ),
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
      render: (_: any, record: TeamMember) => {
        const canManage = 
          (team.currentUserRole === 'owner' && record.role !== 'owner' && !record.isCurrentUser) ||
          (team.currentUserRole === 'admin' && record.role === 'member' && !record.isCurrentUser);

        if (!canManage) {
          return null;
        }

        return (
          <Space>
            <Button
              type="text"
              className="member-action-btn"
              onClick={() => handleEditPermissions(record)}
              icon={<SettingOutlined />}
            >
              Edit
            </Button>
            <Button
              type="text"
              danger
              className="member-action-btn"
              onClick={() => handleRemoveMember(record.id, record.email)}
            >
              Remove
            </Button>
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
      render: (name: string, record: TeamApiKey) => {
        const isKeyDisabled = !checkTeamHasSufficientBalance();
        return (
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Text style={{ color: '#ffffff' }}>{name}</Text>
            {isKeyDisabled && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                Disabled
              </Tag>
            )}
          </div>
        );
      },
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
      width: '30%', // Adjusted width for better layout
      render: (key: string, record: TeamApiKey) => {
        const isVisible = apiKeyVisibility[record.id] || false;
        const isKeyDisabled = !checkTeamHasSufficientBalance();
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{
              color: isKeyDisabled ? '#999999' : '#ffffff',
              fontFamily: 'monospace',
              flex: 1,
              textDecoration: isKeyDisabled ? 'line-through' : undefined
            }}>
              {formatTeamApiKeyDisplay(key, isVisible)}
            </Text>
            <Button
              type="text"
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => toggleApiKeyVisibility(record.id)}
              title={isVisible ? "Hide API Key" : "Show API Key"}
              style={{ marginLeft: 8, color: isKeyDisabled ? '#999999' : undefined }}
              disabled={isKeyDisabled}
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(key);
                message.success('API Key copied to clipboard');
              }}
              title="Copy API Key"
              style={{ marginLeft: 4, color: isKeyDisabled ? '#999999' : undefined }}
              disabled={isKeyDisabled}
            />
          </div>
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
      render: (status: string, record: TeamApiKey) => {
        const isKeyDisabledByBalance = !checkTeamHasSufficientBalance();
        if (isKeyDisabledByBalance) {
          return (
            <Tooltip title="Team account has insufficient balance. API key functionality is limited.">
              <Tag color="red">Disabled</Tag>
            </Tooltip>
          );
        }
        return (
          <Tag color={record.status === 'active' ? 'green' : 'volcano'}>
            {record.status === 'active' ? 'Active' : 'Inactive'}
          </Tag>
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
      width: '15%', // Adjusted width
      align: 'right',
      render: (_: any, record: TeamApiKey) => {
        const isKeyDisabledByBalance = !checkTeamHasSufficientBalance();
        if (isKeyDisabledByBalance) {
          return (
            <Tooltip title="Please contact team administrator to recharge before using.">
              <Button 
                type="text" 
                danger
                onClick={() => message.warning('Please contact team administrator to recharge before using.')}
              >
                Contact for Recharge
              </Button>
            </Tooltip>
          );
        }
        return (
          <Space>
            <Tooltip title="Regenerate API Key">
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={() => handleRegenerateApiKey(record)}
                loading={regenerateApiKeyLoading === record.id}
                className="regenerate-btn"
              >
                Regenerate
              </Button>
            </Tooltip>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteApiKey(record.id, record.name)}
              title="Delete API Key"
            />
          </Space>
        );
      },
    },
  ];

  const handleRegenerateApiKey = (apiKeyToRegenerate: TeamApiKey) => {
    confirm({
      title: 'Regenerate API Key',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: 'Are you sure you want to regenerate this API key? The current key will be invalidated immediately.',
      async onOk() {
        setRegenerateApiKeyLoading(apiKeyToRegenerate.id);
        // Mock API call for regeneration
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const newKey = `sk-team-${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
        
        setTeam(prevTeam => {
          if (!prevTeam) return prevTeam;
          return {
            ...prevTeam,
            apiKeys: prevTeam.apiKeys.map(ak => 
              ak.id === apiKeyToRegenerate.id ? { ...ak, key: newKey, status: 'active', lastUsed: undefined } : ak
            ),
          };
        });
        setRegenerateApiKeyLoading(null);
        
        Modal.success({
          title: 'API Key Regenerated Successfully',
          content: (
            <div>
              <Paragraph>Your new API key has been generated. Please copy it now, as it will not be shown again:</Paragraph>
              <Text code copyable={{text: newKey}} style={{ wordBreak: 'break-all', display: 'block', background: '#f0f2f5', padding: '8px', borderRadius: '4px', color: '#333' }}>
                {newKey}
              </Text>
            </div>
          ),
          width: 580,
          okText: 'Close',
        });
      },
      onCancel() {
        setRegenerateApiKeyLoading(null);
        console.log('API key regeneration cancelled');
      },
    });
  };

  const activeMembers = team.members.filter(m => m.status === 'active');
  const pendingMembers = team.members.filter(m => m.status === 'pending');

  // Filter usage records by filter conditions
  const filteredUsageRecords = useMemo(() => {
    return usageRecords.filter(record => {
      const recordDate = record.date;
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      return (
        (usageFilter === 'team' || record.user === usageFilter) &&
        (modelFilter === 'all' || record.model === modelFilter) &&
        recordDate >= startDate && 
        recordDate <= endDate
      );
    });
  }, [usageRecords, usageFilter, modelFilter, dateRange]);

  // Get user display name
  const getUserDisplayName = (email: string) => {
    const member = team.members.find(m => m.email === email);
    if (member) {
      return member.email + (member.isCurrentUser ? ' (You)' : '');
    }
    return email;
  };
  
  // Get list of users who used this model
  const getModelUsers = (records: UsageRecord[]): string => {
    const userEmails = Array.from(new Set(records.map(record => record.user)));
    return userEmails.map(email => {
      const member = team.members.find(m => m.email === email);
      return member ? (member.email.split('@')[0] + (member.isCurrentUser ? ' (You)' : '')) : email;
    }).join(', ');
  };
  
  // Get all dates within the current date range
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
  
  // Get date display format
  const formatDate = (dateStr: string): string => {
    return dayjs(dateStr).format('MMM D');
  };
  
  // Filter chart data for usage records by date and model
  const getChartData = () => {
    const dates = getDatesInRange();
    
    return dates.map(date => {
      // Get the daily usage data directly from our mock data
      const dailyData = dailyUsage.find(d => d.date === date) || {
        date,
        models: {},
        total: { cost: 0, tokens: 0, requests: 0 }
      };
      
      // Convert model data to array for chart display
      const modelDataArray = Object.entries(dailyData.models).map(([modelId, data]) => {
        const model = modelUsage.find(m => m.model === modelId);
        return {
          model: modelId,
          cost: data.cost,
          tokens: data.tokens,
          requests: data.requests,
          color: model?.color || '#1890ff'
        };
      });
      
      return {
        date,
        formattedDate: formatDate(date),
        models: dailyData.models,
        modelDataArray,
        total: dailyData.total
      };
    });
  };
  
  // Handle bar chart click
  const handleBarClick = (date: string) => {
    setSelectedDay(selectedDay === date ? null : date);
  };
  
  // Handle model details click
  const handleModelDetailClick = (modelData: any) => {
    setSelectedModelData(modelData);
    setModelDetailVisible(true);
  };
  
  // Handle chart type switch
  const handleChartTypeChange = (e: RadioChangeEvent) => {
    setChartType(e.target.value);
  };

  // Usage record table column definition
  const usageColumns: ColumnsType<UsageRecord> = [
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Date
        </Text>
      ),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => (
        <Text style={{ color: '#ffffff' }}>{timestamp.split(' ')[0]}</Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Model
        </Text>
      ),
      dataIndex: 'model',
      key: 'model',
      render: (model: string, record: UsageRecord) => (
        <Text style={{ color: '#ffffff' }}>
          {model}
        </Text>
      ),
    },
    {
      title: () => (
        <Text strong style={{ fontSize: '14px', color: '#ffffff' }}>
          Users
        </Text>
      ),
      dataIndex: 'user',
      key: 'user',
      render: (user: string, record: UsageRecord) => {
        // Get all records for this model on this date
        const relatedRecords = usageRecords.filter(
          r => r.model === record.model && r.date === record.date
        );
        
        // Get unique users from those records
        const uniqueUsers = Array.from(new Set(relatedRecords.map(r => r.user)));
        
        return (
          <div>
            {uniqueUsers.map((email, index) => {
              const member = team.members.find(m => m.email === email);
              return (
                <Text key={email} style={{ color: '#ffffff', display: 'block', marginBottom: index < uniqueUsers.length - 1 ? '4px' : 0 }}>
                  {member ? member.email.split('@')[0] : email}
                  {member?.isCurrentUser && <Tag color="blue" style={{ marginLeft: 4 }}>You</Tag>}
                </Text>
              );
            })}
          </div>
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

  // Fetch team instances
  const fetchTeamInstances = useCallback(async () => {
    if (!teamId) return;
    
    setInstancesLoading(true);
    try {
      const instances = await getTeamInstancesWithMemberInfo(teamId);
      setTeamInstances(instances);
    } catch (error) {
      console.error('Failed to fetch team instances:', error);
      message.error('Failed to load team instances');
    } finally {
      setInstancesLoading(false);
    }
  }, [teamId]);

  // Load team instances when team data is loaded
  useEffect(() => {
    if (team.id && team.members.length > 0) {
      // Create mock instances if none exist
      if (mockData) {
        createMockTeamInstances(team.id, team.name, team.members);
      }
      
      fetchTeamInstances();
    }
  }, [team.id, team.members, mockData, fetchTeamInstances]);

  // Handle edit permissions
  const handleEditPermissions = (member: TeamMember) => {
    setEditingMember(member);
    setSelectedPermissions(member.permissions || []);
    setSelectedPermissionPreset('custom');
    setEditPermissionModalVisible(true);
  };

  // Handle permission update
  const handleUpdatePermissions = async () => {
    if (!editingMember) return;
    
    try {
      // In a real application, this should call an API to update permissions
      setTeam(prevTeam => ({
        ...prevTeam,
        members: prevTeam.members.map(member =>
          member.id === editingMember.id
            ? { ...member, permissions: selectedPermissions }
            : member
        ),
      }));
      
      message.success('Permissions updated successfully');
      setEditPermissionModalVisible(false);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      message.error('Failed to update permissions');
    }
  };

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
          onClick={() => navigate(`/teams/${teamId}/invite`)}
          disabled={team.currentUserRole === 'member'}
        >
          Invite Member
        </Button>
      </Space>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} className="team-management-tabs">
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
              <DesktopOutlined />
              Instances
            </span>
          }
          key="instances"
        >
          <div>
            <Typography.Title level={5} style={{ color: '#ffffff', marginBottom: '16px' }}>
              Team Instances
              <Tooltip title="All GPU instances created by team members">
                <InfoCircleOutlined style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.45)' }} />
              </Tooltip>
            </Typography.Title>
            
            {instancesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <TeamInstanceList 
                instances={teamInstances}
                teamMembers={team.members}
                currentUserRole={team.currentUserRole}
                currentUserEmail={currentUserEmail}
                onRefresh={fetchTeamInstances}
              />
            )}
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
            
            <div style={{ marginBottom: '24px' }}>
              <Space wrap style={{ marginBottom: '16px' }}>
                <Text strong style={{ color: '#ffffff' }}>Filter by:</Text>
                <Select 
                  value={usageFilter} 
                  onChange={(value) => {
                    setUsageFilter(value);
                    // If "Entire Team" is selected, set date range to display all data
                    if (value === 'team') {
                      const allDates = dailyUsage.map(d => d.date).sort();
                      if (allDates.length > 0) {
                        setDateRange([
                          dayjs(allDates[0]),
                          dayjs(allDates[allDates.length - 1])
                        ]);
                      }
                      setModelFilter('all');
                    }
                  }}
                  style={{ width: '200px' }}
                  dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
                >
                  <Select.Option value="team">Entire Team</Select.Option>
                  {team.members.map(member => {
                    const displayName = member.name ? `${member.name} (${member.email})` : member.email;
                    return (
                      <Select.Option key={member.id} value={member.email}>
                        {displayName} {member.isCurrentUser && '(You)'}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Space>
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
                  <div className="stat-chart" style={{ height: '120px', marginTop: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                      {getChartData().slice(-7).map((day, index) => (
                        <div 
                          key={day.date} 
                          className="day-bar-container"
                          style={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column-reverse',
                            alignItems: 'center',
                            margin: '0 2px',
                            cursor: 'pointer',
                            height: '100%',
                            position: 'relative'
                          }}
                          onClick={() => handleBarClick(day.date)}
                        >
                          {day.modelDataArray && day.modelDataArray.length > 0 ? (
                            day.modelDataArray.map((modelData, modelIndex) => (
                              <div
                                key={`${day.date}-${modelData.model}-${modelIndex}`}
                                style={{
                                  width: '100%',
                                  height: modelData.cost ? `${Math.max(5, modelData.cost * 100000)}px` : '0px',
                                  backgroundColor: modelData.color,
                                  borderTopLeftRadius: modelIndex === day.modelDataArray.length - 1 ? '3px' : '0',
                                  borderTopRightRadius: modelIndex === day.modelDataArray.length - 1 ? '3px' : '0',
                                  opacity: day.date === selectedDay ? 1 : 0.7,
                                  transition: 'all 0.3s ease'
                                }}
                                title={`${day.formattedDate}: ${modelData.model.split('/').pop()} - $${modelData.cost.toFixed(7)}`}
                              />
                            ))
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '5px',
                                backgroundColor: 'rgba(24, 144, 255, 0.2)',
                                borderTopLeftRadius: '3px',
                                borderTopRightRadius: '3px'
                              }}
                            />
                          )}
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'rgba(255, 255, 255, 0.65)',
                            marginTop: '4px',
                            textAlign: 'center',
                            position: 'absolute',
                            bottom: '-20px',
                            whiteSpace: 'nowrap'
                          }}>
                            {day.formattedDate}
                          </div>
                        </div>
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
                  <div className="stat-chart" style={{ height: '120px', marginTop: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                      {getChartData().slice(-7).map((day, index) => (
                        <div 
                          key={day.date} 
                          className="day-bar-container"
                          style={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column-reverse',
                            alignItems: 'center',
                            margin: '0 2px',
                            cursor: 'pointer',
                            height: '100%',
                            position: 'relative'
                          }}
                          onClick={() => handleBarClick(day.date)}
                        >
                          {day.modelDataArray && day.modelDataArray.length > 0 ? (
                            day.modelDataArray.map((modelData, modelIndex) => (
                              <div
                                key={`${day.date}-${modelData.model}-${modelIndex}`}
                                style={{
                                  width: '100%',
                                  height: modelData.tokens ? `${Math.max(5, (modelData.tokens / 500) * 75 / 30)}px` : '0px',
                                  backgroundColor: modelData.color,
                                  borderTopLeftRadius: modelIndex === day.modelDataArray.length - 1 ? '3px' : '0',
                                  borderTopRightRadius: modelIndex === day.modelDataArray.length - 1 ? '3px' : '0',
                                  opacity: day.date === selectedDay ? 1 : 0.7,
                                  transition: 'all 0.3s ease'
                                }}
                                title={`${day.formattedDate}: ${modelData.model.split('/').pop()} - ${modelData.tokens.toLocaleString()} tokens`}
                              />
                            ))
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '5px',
                                backgroundColor: 'rgba(250, 173, 20, 0.2)',
                                borderTopLeftRadius: '3px',
                                borderTopRightRadius: '3px'
                              }}
                            />
                          )}
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'rgba(255, 255, 255, 0.65)',
                            marginTop: '4px',
                            textAlign: 'center',
                            position: 'absolute',
                            bottom: '-20px',
                            whiteSpace: 'nowrap'
                          }}>
                            {day.formattedDate}
                          </div>
                        </div>
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
                  <div className="stat-chart" style={{ height: '120px', marginTop: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                      {getChartData().slice(-7).map((day, index) => (
                        <div 
                          key={day.date} 
                          className="day-bar-container"
                          style={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column-reverse',
                            alignItems: 'center',
                            margin: '0 2px',
                            cursor: 'pointer',
                            height: '100%',
                            position: 'relative'
                          }}
                          onClick={() => handleBarClick(day.date)}
                        >
                          {day.modelDataArray && day.modelDataArray.length > 0 ? (
                            day.modelDataArray.map((modelData, modelIndex) => (
                              <div
                                key={`${day.date}-${modelData.model}-${modelIndex}`}
                                style={{
                                  width: '100%',
                                  height: modelData.requests ? `${Math.max(5, modelData.requests * 12)}px` : '0px',
                                  backgroundColor: modelData.color,
                                  borderTopLeftRadius: modelIndex === day.modelDataArray.length - 1 ? '3px' : '0',
                                  borderTopRightRadius: modelIndex === day.modelDataArray.length - 1 ? '3px' : '0',
                                  opacity: day.date === selectedDay ? 1 : 0.7,
                                  transition: 'all 0.3s ease'
                                }}
                                title={`${day.formattedDate}: ${modelData.model.split('/').pop()} - ${modelData.requests} requests`}
                              />
                            ))
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '5px',
                                backgroundColor: 'rgba(82, 196, 26, 0.2)',
                                borderTopLeftRadius: '3px',
                                borderTopRightRadius: '3px'
                              }}
                            />
                          )}
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'rgba(255, 255, 255, 0.65)',
                            marginTop: '4px',
                            textAlign: 'center',
                            position: 'absolute',
                            bottom: '-20px',
                            whiteSpace: 'nowrap'
                          }}>
                            {day.formattedDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
            
            {selectedDay && (
              <div className="selected-day-details" style={{ marginBottom: '24px', marginTop: '24px' }}>
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
            
            <Card style={{ background: '#1a1a1a', borderColor: '#303030', marginTop: '24px' }}>
              <Typography.Title level={5} style={{ color: '#ffffff', marginBottom: '16px' }}>
                Detailed Usage Records
              </Typography.Title>
              
              <div style={{ marginBottom: '16px' }}>
                <Space wrap style={{ marginBottom: '16px' }}>
                  <Text strong style={{ color: '#ffffff' }}>Filter by:</Text>
                  <Select 
                    value={usageFilter} 
                    onChange={(value) => {
                      setUsageFilter(value);
                      // If "Entire Team" is selected, set date range to display all data
                      if (value === 'team') {
                        const allDates = dailyUsage.map(d => d.date).sort();
                        if (allDates.length > 0) {
                          setDateRange([
                            dayjs(allDates[0]),
                            dayjs(allDates[allDates.length - 1])
                          ]);
                        }
                        setModelFilter('all');
                      }
                    }}
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
                    style={{ background: '#1a1a1a', borderColor: '#303030' }} // Keep existing inline for input box
                    className="dark-theme-rangepicker" // Add a specific class for deeper styling
                    popupClassName="dark-theme-rangepicker-popup" // Class for the popup
                  />
                </Space>
              </div>

              <Table
                columns={usageColumns}
                dataSource={filteredUsageRecords}
                rowKey="id"
                className="usage-table"
                pagination={{ pageSize: 10 }}
                style={{ background: '#141414', borderRadius: '8px' }}
              />
              
              {/* Debug section to show raw data */}
              <Card title="Model Usage Data (Debug)" style={{ marginTop: '24px', background: '#1a1a1a', borderColor: '#303030' }}>
                <div style={{ maxHeight: '400px', overflow: 'auto', fontSize: '12px', fontFamily: 'monospace', color: '#ffffff' }}>
                  <h4>All Model Usage Statistics:</h4>
                  <Table
                    columns={[
                      {
                        title: 'Model',
                        dataIndex: 'model',
                        key: 'model',
                        render: (model) => (
                          <Space>
                            <div style={{ width: 12, height: 12, backgroundColor: modelUsage.find(m => m.model === model)?.color || '#1890ff', borderRadius: '50%' }} />
                            <Text style={{ color: '#ffffff' }}>{model.split('/').pop()}</Text>
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
                      }
                    ]}
                    dataSource={modelUsage}
                    rowKey="model"
                    pagination={false}
                    style={{ background: 'transparent' }}
                  />
                  
                  <h4>Daily Usage Data:</h4>
                  <pre>{JSON.stringify(dailyUsage, null, 2)}</pre>
                </div>
              </Card>
            </Card>
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
            {/* TODO: Implement team settings functionality */}
            <p style={{ color: '#fff' }}>Team settings feature is under development...</p>
          </TabPane>
        </Tabs>

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

        {/* Model usage details modal */}
        <ModelUsageDetailModal
          visible={modelDetailVisible}
          onClose={() => setModelDetailVisible(false)}
          modelData={selectedModelData}
          usageRecords={usageRecords}
          date={selectedModelData?.date || ''}
        />

        <Modal
          title={<Text strong>Edit Permissions for: {editingMember?.name || editingMember?.email}</Text>}
          open={editPermissionModalVisible}
          onCancel={() => setEditPermissionModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setEditPermissionModalVisible(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleUpdatePermissions}>
              Save Changes
            </Button>,
          ]}
          width={700}
          style={{ top: 20 }}
        >
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
              Permission Preset
            </Text>
            <Radio.Group
              value={selectedPermissionPreset}
              onChange={(e) => {
                const value = e.target.value as PermissionPackageType;
                setSelectedPermissionPreset(value);
                if (value !== 'custom') {
                  setSelectedPermissions(PERMISSION_PACKAGES[value].permissions);
                }
              }}
              style={{ marginBottom: '24px' }}
            >
              <Space direction="horizontal">
                <Radio.Button value="custom">Custom</Radio.Button>
                <Radio.Button value="developer">Developer Package</Radio.Button>
                <Radio.Button value="admin">Administrator Package</Radio.Button>
              </Space>
            </Radio.Group>

            <Divider />

            {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px', textTransform: 'uppercase', color: '#ffffff' }}>
                  {group.title}
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> {/* Increased gap for better separation */}
                  {group.permissions.map(permission => (
                    <Checkbox
                      key={permission.key}
                      checked={selectedPermissions.includes(permission.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission.key]);
                          setSelectedPermissionPreset('custom');
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission.key));
                          setSelectedPermissionPreset('custom');
                        }
                      }}
                      style={{ alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Adjusted permission label style */}
                        <Text style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)' }}>{permission.label}</Text>
                        <Tooltip title={permission.description}>
                          <InfoCircleOutlined style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.45)' }} />
                        </Tooltip>
                      </div>
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </Card>
    );
  };

  export default TeamManagement;