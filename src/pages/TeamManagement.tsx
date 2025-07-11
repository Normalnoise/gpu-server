import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Divider, Checkbox, Row, Col, DatePicker, Statistic, Tooltip, Spin } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
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
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  SearchOutlined
} from '@ant-design/icons';

dayjs.extend(relativeTime);
import type { ColumnsType } from 'antd/es/table';
import { createInvitation, sendInvitationEmail } from '../services/invitationService';
import TeamInstanceList from '../components/TeamInstanceList';
import { 
  getTeamInstancesWithMemberInfo, 
  createMockTeamInstances, 
  InstanceData,
  updateInstanceStatus 
} from '../services/instanceService';
import { 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend, 
  ResponsiveContainer, 
  Bar 
} from 'recharts';

// Add type definitions
interface PermissionPackage {
  name: string;
  permissions: string[];
}

type PermissionPackageType = 'custom' | 'developer' | 'admin' | 'owner';

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
  // Add instances for the team instance tab
  instances?: InstanceData[];
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

// New interfaces for Object Storage Tab
interface TeamWorkspaceSummary {
  workspaceCount: number;
  totalStorage: string; // e.g., "1.2 TB"
  totalCost: string; // e.g., "$120.50"
}

interface TeamWorkspaceListItem {
  id: string;
  name: string;
  location: string;
  status: 'Ready' | 'Pending' | 'Error' | 'Deleting';
  creator: string;
  creatorId?: string; // Optional: if needed for filtering by specific user ID
  accumulatedCost: string;
  createdAt: string; // ISO date string
  permissions?: { // Assuming similar permission structure
    canDelete: boolean;
  };
}


const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  group: string;
}

interface PermissionGroup {
  title: string;
  permissions: PermissionDefinition[];
}

const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
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
      {
        key: 'manage_instance',
        label: 'Manage Instance',
        description: 'Allow users to manage instance settings',
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
  inference: {
    title: 'Inference',
    permissions: [
      {
        key: 'use_inference',
        label: 'Use Inference',
        description: 'Allow users to use inference services',
        group: 'inference'
      }
    ]
  }
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const PERMISSION_PACKAGES = {
  custom: {
    name: 'Custom Package',
    permissions: [] as string[]
  },
  developer: {
    name: 'Developer Package',
    permissions: ['read_instance', 'create_instance', 'read_storage', 'use_inference'] as string[]
  },
  admin: {
    name: 'Administrator Package',
    permissions: ['create_instance', 'read_instance', 'delete_instance', 'manage_instance', 'create_storage', 'read_storage', 'delete_storage', 'manage_storage_access', 'use_inference'] as string[]
  },
  owner: {
    name: 'Owner Package',
    permissions: ['create_instance', 'read_instance', 'delete_instance', 'manage_instance', 'create_storage', 'read_storage', 'delete_storage', 'manage_storage_access', 'use_inference'] as string[]
  }
};

const TeamManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teamDetails, setTeamDetails] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTabKey, setActiveTabKey] = useState<string>('members');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState<boolean>(false);
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState<boolean>(false);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});
  const [inviteForm] = Form.useForm();
  const [apiKeyForm] = Form.useForm();
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [filteredUsageRecords, setFilteredUsageRecords] = useState<UsageRecord[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [modelUsageSummary, setModelUsageSummary] = useState<ModelUsageSummary[]>([]);
  const [dailyUsageData, setDailyUsageData] = useState<DailyUsage[]>([]);
  const [selectedModelDetail] = useState<any>(null);
  const [isModelDetailModalVisible] = useState(false);
  const [transferOwnershipModalVisible, setTransferOwnershipModalVisible] = useState(false);
  const [transferOwnershipForm] = Form.useForm();
  const [newlyGeneratedApiKey, setNewlyGeneratedApiKey] = useState<string | null>(null);
  const [editingPermissionsMember] = useState<TeamMember | null>(null);
  const [customPermissions] = useState<string[]>([]);
  const [isPermissionsModalVisible] = useState(false);
  const [permissionsForm] = Form.useForm();

  // State for team members
  const [activeMembers, setActiveMembers] = useState<TeamMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);

  // State for Object Storage Tab
  const [objectStorageSummary, setObjectStorageSummary] = useState<TeamWorkspaceSummary | null>(null);
  const [teamWorkspaces] = useState<TeamWorkspaceListItem[]>([]);
  const [filteredTeamWorkspaces] = useState<TeamWorkspaceListItem[]>([]);

  // State for Team Instances Tab
  const [teamInstances, setTeamInstances] = useState<InstanceData[]>([]);
  const [instancesLoading, setInstancesLoading] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // Update members when teamDetails changes
  useEffect(() => {
    if (teamDetails) {
      setActiveMembers(teamDetails.members.filter(m => m.status === 'active'));
      setPendingMembers(teamDetails.members.filter(m => m.status === 'pending'));
    }
  }, [teamDetails]);

  const { teamId = '' } = useParams<{ teamId: string }>();

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true);

        const mockTeamDetails: TeamDetails = {
          id: teamId,
          name: `Team ${teamId}`,
          description: `This is team ${teamId}'s description`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          members: [
            {
              id: '1',
              name: 'Current User',
              email: 'user@example.com',
              role: 'owner',
              status: 'active',
              joinedAt: new Date().toISOString(),
              lastActive: new Date().toISOString(),
              avatar: null
            },
            {
              id: '2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              role: 'member',
              status: 'active',
              joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              lastActive: new Date().toISOString(),
              avatar: null
            },
            {
              id: '3',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'member',
              status: 'pending',
              invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              invitedBy: 'user@example.com',
              avatar: null
            }
          ],
          apiKeys: [
            {
              id: 'key-1',
              name: 'Production Key',
              keyPrefix: 'sk_prod_',
              lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              permissions: ['read', 'write'],
              isActive: true
            },
            {
              id: 'key-2',
              name: 'Development Key',
              keyPrefix: 'sk_dev_',
              lastUsed: null,
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              permissions: ['read'],
              isActive: true
            }
          ]
        };

        setTeamDetails(mockTeamDetails);

        const active = mockTeamDetails.members.filter(member => member.status === 'active');
        const pending = mockTeamDetails.members.filter(member => member.status === 'pending');

        setActiveMembers(active);
        setPendingMembers(pending);

      } catch (error) {
        console.error('Error fetching team details:', error);
        message.error('Failed to load team details');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId]);

  useEffect(() => {
    // Simulate fetching current user's email
    setCurrentUserEmail('current.user@example.com');
  }, []);

  // Fetch team instances
  const fetchTeamInstances = useCallback(async () => {
    if (!teamId || !teamDetails) return; // Ensure teamDetails is available
    setInstancesLoading(true);
    try {
      // Create mock instances first, ensuring teamDetails.name and teamDetails.members are available
      createMockTeamInstances(teamId, teamDetails.name, teamDetails.members.map(m => ({ id: m.id, email: m.email, role: m.role, name: m.name })));
      const instances = await getTeamInstancesWithMemberInfo(teamId); // Then fetch them
      setTeamInstances(instances);
    } catch (error) {
      console.error('Error fetching team instances:', error);
      message.error('Failed to load team instances.');
    } finally {
      setInstancesLoading(false);
    }
  }, [teamId, teamDetails]);

  useEffect(() => {
    if (teamId && activeTabKey === 'instances') {
      fetchTeamInstances();
    }
  }, [teamId, activeTabKey, fetchTeamInstances]);
  
  // Mock data and logic for Object Storage tab
  useEffect(() => {
    if (activeTabKey === 'objectStorage') {
      // Fetch or set mock data for object storage
      setObjectStorageSummary({
        workspaceCount: 5,
        totalStorage: '250.7 GB',
        totalCost: '$35.60'
      });
      const mockWorkspaces: TeamWorkspaceListItem[] = [
        { id: 'ws1', name: 'Project Alpha Storage', location: 'Canada', status: 'Ready', creator: 'Alice Wonderland', accumulatedCost: '$10.50', createdAt: dayjs().subtract(5, 'days').toISOString(), permissions: { canDelete: true} },
        { id: 'ws2', name: 'Backup Data Q2', location: 'USA', status: 'Pending', creator: 'Bob The Builder', accumulatedCost: '$5.00', createdAt: dayjs().subtract(10, 'days').toISOString(), permissions: { canDelete: false} },
        { id: 'ws3', name: 'Archived Logs', location: 'Canada', status: 'Ready', creator: 'Alice Wonderland', accumulatedCost: '$12.10', createdAt: dayjs().subtract(15, 'days').toISOString(), permissions: { canDelete: true} },
        { id: 'ws4', name: 'Marketing Assets', location: 'USA', status: 'Error', creator: 'Charlie Brown', accumulatedCost: '$3.00', createdAt: dayjs().subtract(2, 'days').toISOString(), permissions: { canDelete: true} },
        { id: 'ws5', name: 'Dev Environment Backup', location: 'Canada', status: 'Ready', creator: 'Bob The Builder', accumulatedCost: '$5.00', createdAt: dayjs().subtract(8, 'days').toISOString(), permissions: { canDelete: false} },
      ];
      setTeamWorkspaces(mockWorkspaces);
      setFilteredTeamWorkspaces(mockWorkspaces); // Initially no filters
    }
  }, [activeTabKey]);

  useEffect(() => {
    let filtered = teamWorkspaces;
    if (osCreatorFilter) {
      filtered = filtered.filter(ws => ws.creator.toLowerCase().includes(osCreatorFilter.toLowerCase()));
    }
    if (osDateFilter && osDateFilter[0] && osDateFilter[1]) {
      filtered = filtered.filter(ws => {
        const createdAt = dayjs(ws.createdAt);
        return createdAt.isAfter(osDateFilter[0].startOf('day')) && createdAt.isBefore(osDateFilter[1].endOf('day'));
      });
    }
    if (osNameSearch) {
      filtered = filtered.filter(ws => ws.name.toLowerCase().includes(osNameSearch.toLowerCase()));
    }
    setFilteredTeamWorkspaces(filtered);
  }, [osCreatorFilter, osDateFilter, osNameSearch, teamWorkspaces]);

  const handleOsDeleteWorkspace = (workspaceId: string, workspaceName: string) => {
    confirm({
      title: `Are you sure you want to delete workspace "${workspaceName}"?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk() {
        console.log('Deleting workspace:', workspaceId);
        message.success(`Workspace "${workspaceName}" deleted successfully.`);
        // Add actual delete logic here and update teamWorkspaces state
        setTeamWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));
    },
  });
  };

  const objectStorageColumns: ColumnsType<TeamWorkspaceListItem> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (location: string) => <>{location === 'Canada' ? '🇨🇦' : '🇺🇸'} {location}</> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Ready' ? 'green' : status === 'Pending' ? 'blue' : 'red'}>{status}</Tag> },
    { title: 'Creator', dataIndex: 'creator', key: 'creator', sorter: (a, b) => a.creator.localeCompare(b.creator) },
    { title: 'Accumulated Cost', dataIndex: 'accumulatedCost', key: 'accumulatedCost', sorter: (a, b) => parseFloat(a.accumulatedCost.substring(1)) - parseFloat(b.accumulatedCost.substring(1))},
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'), sorter: (a,b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix() },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        record.permissions?.canDelete ? (
          <Button type="link" danger onClick={() => handleOsDeleteWorkspace(record.id, record.name)}>Delete</Button>
        ) : <Tooltip title="You do not have permission to delete this workspace."><Button type="link" danger disabled>Delete</Button></Tooltip>
      ),
    },
  ];

  // MOCK DATA AND FUNCTIONS - replace with actual API calls
  const mockTeam: Team = {
    id: teamId,
    name: 'Loading Team...',
    description: 'This is a mock team description.',
    members: [],
    currentUserRole: 'owner', // default role
    apiKeys: [],
    balance: 100.00,
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    const fetchTeamData = setTimeout(() => {
      try {
        // Check if teamId is valid (for demonstration purposes)
        if (!teamId || teamId === 'undefined') {
          console.error('Invalid teamId:', teamId);
          setTeamDetails(null);
          setLoading(false);
          return;
        }

        const fetchedTeamData: Team = {
          id: teamId,
          name: `Team ${teamId} Dynamics`,
          description: 'A dynamic team focused on innovation and collaboration to achieve groundbreaking results in AI.',
          members: [
            { id: '1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'owner', status: 'active', invitedAt: dayjs().subtract(10, 'days').toISOString(), isCurrentUser: teamId === 'current_user_id' }, // Example: Mark Alice as current user if teamId matches a specific pattern or use actual auth info
            { id: '2', name: 'Bob The Builder', email: 'bob@example.com', role: 'admin', status: 'active', invitedAt: dayjs().subtract(5, 'days').toISOString(), invitedBy: 'Alice Wonderland', permissions: ['create_instance', 'read_instance', 'delete_instance', 'use_inference'] },
            { id: '3', email: 'charlie.pending@example.com', role: 'member', status: 'pending', invitedAt: dayjs().subtract(2, 'days').toISOString(), expiresAt: dayjs().add(5, 'days').toISOString(), invitedBy: 'Alice Wonderland' },
            { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'member', status: 'active', invitedAt: dayjs().subtract(1, 'month').toISOString(), invitedBy: 'Bob The Builder', permissions: ['read_instance', 'use_inference'] },
          ],
          currentUserRole: 'owner', // This should be determined by the logged-in user's relation to the team
          apiKeys: [
            { id: 'key1', name: 'Main Server Key', key: 'neb_sk_123abc456def789ghi', createdAt: dayjs().subtract(1, 'month').toISOString(), createdBy: 'Alice Wonderland', status: 'active', lastUsed: dayjs().subtract(2, 'hours').toISOString() },
            { id: 'key2', name: 'Dev Test Key', key: 'neb_sk_jklmno123pqrstu456', createdAt: dayjs().subtract(2, 'weeks').toISOString(), createdBy: 'Bob The Builder', status: 'disabled', lastUsed: dayjs().subtract(1, 'week').toISOString() },
          ],
          balance: 1234.56,
        };
        setTeamDetails(fetchedTeamData);

      // Mock usage data based on team members
      const membersForUsage = fetchedTeamData.members.filter(m => m.status === 'active').map(m => m.email);
      const mockUsage: UsageRecord[] = [];
      const models = ['gpt-4', 'claude-2', 'llama-2-70b', 'dall-e-3'];
      const providers = ['OpenAI', 'Anthropic', 'Meta', 'OpenAI'];
      const apps = ['Chatbot X', 'Content Gen', 'Image Service', 'Support AI'];
      const today = dayjs();
      for (let i = 0; i < 30; i++) { // 30 days of data
        const date = today.subtract(i, 'days');
        for (let j = 0; j < Math.floor(Math.random() * 10) + 5; j++) { // 5-14 records per day
          const modelIndex = Math.floor(Math.random() * models.length);
          const tokensIn = Math.floor(Math.random() * 5000) + 500;
          const tokensOut = Math.floor(Math.random() * 2000) + 200;
          mockUsage.push({
            id: `usage_${i}_${j}`,
            timestamp: date.subtract(Math.random() * 24, 'hours').toISOString(),
            provider: providers[modelIndex],
            model: models[modelIndex],
            app: apps[Math.floor(Math.random() * apps.length)],
            tokensInput: tokensIn,
            tokensOutput: tokensOut,
            totalTokens: tokensIn + tokensOut,
            cost: (tokensIn + tokensOut) * 0.000002, // Example cost
            speed: Math.random() * 100 + 20, // tokens/sec
            status: Math.random() < 0.95 ? 'completed' : 'failed',
            user: membersForUsage[Math.floor(Math.random() * membersForUsage.length)],
            date: date.format('YYYY-MM-DD'),
          });
        }
      }
      setUsageRecords(mockUsage);
      setFilteredUsageRecords(mockUsage);

      // Calculate summaries
      const oneDayAgo = today.subtract(1, 'day').toISOString();
      const oneWeekAgo = today.subtract(7, 'days').toISOString();

      const spendLastDay = mockUsage.filter(r => r.timestamp >= oneDayAgo).reduce((sum, r) => sum + r.cost, 0);
      const spendLastWeek = mockUsage.filter(r => r.timestamp >= oneWeekAgo).reduce((sum, r) => sum + r.cost, 0);
      const tokensLastDay = mockUsage.filter(r => r.timestamp >= oneDayAgo).reduce((sum, r) => sum + r.totalTokens, 0);
      const tokensLastWeek = mockUsage.filter(r => r.timestamp >= oneWeekAgo).reduce((sum, r) => sum + r.totalTokens, 0);
      const requestsLastDay = mockUsage.filter(r => r.timestamp >= oneDayAgo).length;
      const requestsLastWeek = mockUsage.filter(r => r.timestamp >= oneWeekAgo).length;

      setUsageSummary({
        spend: { lastDay: `$${spendLastDay.toFixed(2)}`, lastWeek: `$${spendLastWeek.toFixed(2)}` },
        tokens: { lastDay: Math.round(tokensLastDay / 1000), lastWeek: Math.round(tokensLastWeek / 1000) }, // in K
        requests: { lastDay: requestsLastDay, lastWeek: requestsLastWeek },
      });

      const modelUsage: ModelUsageSummary[] = [];
      const modelColors: Record<string, string> = {};
      models.forEach(model => {
        if (!modelColors[model]) modelColors[model] = getRandomColor();
        const records = mockUsage.filter(r => r.model === model);
        modelUsage.push({
          model: model,
          provider: providers[models.indexOf(model)],
          cost: records.reduce((sum, r) => sum + r.cost, 0),
          tokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
          requests: records.length,
          color: modelColors[model],
        });
      });
      setModelUsageSummary(modelUsage.sort((a, b) => b.cost - a.cost));

      const dailyData: DailyUsage[] = [];
      const uniqueDates = [...new Set(mockUsage.map(r => r.date))].sort();
      uniqueDates.forEach(date => {
        const recordsForDate = mockUsage.filter(r => r.date === date);
        const modelsOnDate: Record<string, { cost: number; tokens: number; requests: number }> = {};
        models.forEach(model => {
          const modelRecords = recordsForDate.filter(r => r.model === model);
          if (modelRecords.length > 0) {
            modelsOnDate[model] = {
              cost: modelRecords.reduce((sum, r) => sum + r.cost, 0),
              tokens: modelRecords.reduce((sum, r) => sum + r.totalTokens, 0),
              requests: modelRecords.length,
            };
          }
        });
        dailyData.push({
          date,
          models: modelsOnDate,
          total: {
            cost: recordsForDate.reduce((sum, r) => sum + r.cost, 0),
            tokens: recordsForDate.reduce((sum, r) => sum + r.totalTokens, 0),
            requests: recordsForDate.length,
          },
        });
      });
      setDailyUsageData(dailyData.sort((a,b) => dayjs(a.date).unix() - dayjs(b.date).unix() ));

      setLoading(false);
      } catch (error) {
        console.error('Error processing team data:', error);
        setTeamDetails(null);
        setLoading(false);
      }
    }, 1000);
    
    // Cleanup function to ensure loading state is reset if component unmounts during data fetch
    return () => {
      clearTimeout(fetchTeamData);
      setLoading(false);
    };
  }, [teamId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTabKey(tab);
    }
  }, [location.search]);

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    navigate(`${location.pathname}?tab=${key}`, { replace: true });
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setVisibleApiKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const checkTeamHasSufficientBalance = (): boolean => {
    if (teamDetails && typeof teamDetails.balance === 'number' && teamDetails.balance <=0) {
        message.error("Your team has an insufficient balance. Please add funds to continue using API keys.");
        return false;
    }
    return true;
  };

  const formatTeamApiKeyDisplay = (key: string, isVisible: boolean) => {
    if (!isVisible) return 'neb_sk_••••••••••••••••••••••';
      return key;
  };

  // Simplified formatApiKey as formatTeamApiKeyDisplay now handles team keys
  const formatApiKey = (key: string, isVisible: boolean) => {
    if (!isVisible) return '••••••••••••••••••••••••••••••••';
      return key;
  };


  const handleInviteMember = async (values: { email: string; role: string; permissions: string[] }) => {
    if (!teamDetails) return;
    try {
      const currentUserEmail = teamDetails.members.find(m => m.isCurrentUser)?.email || 'Owner';
      const invitation = await createInvitation(teamDetails.id, teamDetails.name, values.email, values.role as 'admin' | 'member', currentUserEmail);
      const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
      await sendInvitationEmail(values.email, inviteLink, teamDetails.name, currentUserEmail);
      
      // Optimistically update UI or refetch team details
      setTeamDetails(prev => prev ? {
        ...prev,
        members: [...prev.members, {
          id: invitation.token, // Use invitation.token as a unique key
        email: values.email,
        role: values.role as 'admin' | 'member',
        status: 'pending',
          invitedAt: dayjs().toISOString(),
          expiresAt: dayjs().add(7, 'days').toISOString(), // Assuming 7 day expiry
          invitedBy: teamDetails.members.find(m => m.isCurrentUser)?.email || 'Owner', // Placeholder
          permissions: values.permissions
        }]
      } : null);

      message.success(`Invitation sent to ${values.email}`);
      setIsInviteModalVisible(false);
      inviteForm.resetFields();
      setPermissionPackage('custom');
      setCustomPermissions([]);
    } catch (error) {
      console.error('Failed to invite member:', error);
      message.error('Failed to send invitation. Please try again.');
    }
  };

  const handleCreateApiKey = async (values: { name: string }) => {
    if (!teamDetails) return;
    if (!checkTeamHasSufficientBalance()) return;

    const newKey = `neb_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setNewlyGeneratedApiKey(newKey);
    const apiKeyData = {
      id: `key_${Date.now()}`,
      name: values.name,
      key: newKey, // Store the actual key here
      createdAt: dayjs().toISOString(),
      createdBy: teamDetails.members.find(m => m.isCurrentUser)?.email || 'Owner', // Placeholder
      status: 'active' as 'active' | 'disabled',
    };
    setTeamDetails(prev => prev ? { ...prev, apiKeys: [...prev.apiKeys, apiKeyData] } : null);
    // setApiKeyModalVisible(false); // Keep modal open to show the key
      apiKeyForm.resetFields();
    message.success(`API Key "${values.name}" created successfully. Store it safely.`);
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!teamDetails) return;
    // API call to update role
    message.success(`Role updated for member ${memberId} to ${newRole}`);
    setTeamDetails(prev => prev ? {
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, role: newRole as 'owner' | 'admin' | 'member' } : m)
    } : null);
  };

  const handleRemoveMember = (memberId: string, email: string) => {
    confirm({
      title: `Are you sure you want to remove ${email} from the team?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Remove',
      okType: 'danger',
      cancelText: 'No, Cancel',
      async onOk() {
          console.log('Removing member:', memberId);
        message.success(`${email} removed from the team.`);
        // Add actual remove logic here
        setTeamDetails(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : null);
      },
    });
  };

  const handleCancelInvite = (memberId: string, email: string) => {
    confirm({
      title: `Are you sure you want to cancel the invitation for ${email}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This will invalidate the invitation link.',
      okText: 'Yes, Cancel Invite',
      okType: 'danger',
      cancelText: 'No, Keep Invite',
      async onOk() {
        console.log('Cancelling invite:', memberId);
        message.success(`Invitation for ${email} cancelled.`);
        setTeamDetails(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : null);
      },
    });
  };

  const handleToggleApiKeyStatus = (keyId: string, currentStatus: string, keyName: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (newStatus === 'active' && !checkTeamHasSufficientBalance()) return;
    
    confirm({
      title: `Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} API key "${keyName}"?`,
      icon: <ExclamationCircleOutlined />,
      content: newStatus === 'active'
        ? 'Enabling this key will allow it to access team resources again.'
        : 'Disabling this key will prevent it from accessing team resources.',
      okText: `Yes, ${newStatus === 'active' ? 'Enable' : 'Disable'}`,
      okType: newStatus === 'active' ? 'primary' : 'danger',
      cancelText: 'No, Cancel',
      async onOk() {
        console.log(`${newStatus === 'active' ? 'Enabling' : 'Disabling'} API key:`, keyId);
        message.success(`API Key "${keyName}" ${newStatus === 'active' ? 'enabled' : 'disabled'}.`);
        setTeamDetails(prev => prev ? {
          ...prev,
          apiKeys: prev.apiKeys.map(k => k.id === keyId ? { ...k, status: newStatus } : k)
        } : null);
      },
    });
  };

  const handleDeleteApiKey = (keyId: string, keyName: string) => {
    confirm({
      title: `Are you sure you want to delete API key "${keyName}"?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone and will permanently revoke this key.',
      okText: 'Yes, Delete Key',
      okType: 'danger',
      cancelText: 'No, Cancel',
      async onOk() {
        console.log('Deleting API key:', keyId);
        message.success(`API Key "${keyName}" deleted.`);
        setTeamDetails(prev => prev ? { ...prev, apiKeys: prev.apiKeys.filter(k => k.id !== keyId) } : null);
      },
    });
  };

  const handleDeleteTeam = () => {
    confirm({
      title: `Are you sure you want to delete team "${teamDetails?.name}"?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action is irreversible and will delete all associated data.',
      okText: 'Yes, Delete Team',
      okType: 'danger',
      cancelText: 'No, Keep Team',
      async onOk() {
        console.log('Deleting team:', teamDetails?.id);
        message.success(`Team "${teamDetails?.name}" deleted successfully.`);
          navigate('/teams');
      },
    });
  };

  const handleTransferOwnership = () => {
    confirm({
      title: `Transfer Ownership of Team "${teamDetails?.name}"?`,
      content: (
        <Form form={transferOwnershipForm} layout="vertical">
          <Form.Item name="newOwnerEmail" label="New Owner's Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email for the new owner.' }]}>
            <Select showSearch placeholder="Select a team member" optionFilterProp="children">
              {teamDetails?.members.filter(m => m.status === 'active' && !m.isCurrentUser).map(member => (
                <Select.Option key={member.id} value={member.email}>{member.name} ({member.email})</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      ),
      okText: 'Yes, Transfer Ownership',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          const values = await transferOwnershipForm.validateFields();
          console.log('Transferring ownership to:', values.newOwnerEmail);
          message.success(`Ownership transfer initiated to ${values.newOwnerEmail}.`);
          // Actual API call and state update needed here
          setTransferOwnershipModalVisible(false);
        } catch (error) {
          console.error('Transfer ownership validation failed:', error);
          return Promise.reject(); // Prevent modal from closing on validation error
        }
      },
      onCancel() {
        setTransferOwnershipModalVisible(false);
      }
    });
  };


  const renderTableTitle = (title: string, icon: React.ReactNode, count: number) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        {icon}
      <Title level={5} style={{ margin: '0 0 0 8px', color: '#E0E0E0' }}>{title} ({count})</Title>
    </div>
  );

  const columns: ColumnsType<TeamMember> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name, record) => <Space><UserOutlined /> {name || record.email} {record.isCurrentUser && <Tag color="blue">You</Tag>}</Space> },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (email) => <Space><MailOutlined /> {email}</Space> },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        teamDetails?.currentUserRole === 'owner' && !record.isCurrentUser ? (
          <Select defaultValue={role} style={{ width: 120 }} onChange={(newRole) => handleUpdateRole(record.id, newRole)}>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
            </Select>
        ) : <Tag icon={<IdcardOutlined />}><span style={{textTransform: 'capitalize'}}>{role}</span></Tag>
      ),
    },
    { title: 'Permissions', key: 'permissions', render: (_, record) => (
        <Button type="link" onClick={() => handleEditPermissions(record)}>Manage</Button>
      ) 
    },
    { title: 'Invited At', dataIndex: 'invitedAt', key: 'invitedAt', render: (date) => <Space><ClockCircleOutlined /> {dayjs(date).format('YYYY-MM-DD')}</Space> },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        !record.isCurrentUser && (
          <Button type="link" danger onClick={() => handleRemoveMember(record.id, record.email || record.id)}>Remove</Button>
        )
      ),
    },
  ];

  const pendingColumns: ColumnsType<TeamMember> = [
    { title: 'Email', dataIndex: 'email', key: 'email', render: (email) => <Space><MailOutlined /> {email}</Space> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role) => <Tag icon={<IdcardOutlined />}><span style={{textTransform: 'capitalize'}}>{role}</span></Tag> },
    { title: 'Invited At', dataIndex: 'invitedAt', key: 'invitedAt', render: (date) => <Space><ClockCircleOutlined /> {dayjs(date).format('YYYY-MM-DD')}</Space> },
    { title: 'Expires At', dataIndex: 'expiresAt', key: 'expiresAt', render: (date) => <Space><ClockCircleOutlined /> {dayjs(date).format('YYYY-MM-DD')}</Space> },
    { title: 'Invited By', dataIndex: 'invitedBy', key: 'invitedBy', render: (name) => <Space><UserOutlined /> {name}</Space> },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" danger onClick={() => handleCancelInvite(record.id, record.email || record.id)}>Cancel Invite</Button>
      ),
    },
  ];

  const apiKeyColumns: ColumnsType<TeamApiKey> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name) => <Space><KeyOutlined /> {name}</Space> },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (key, record) => (
        <Space>
          <Text style={{ fontFamily: 'monospace', color: '#E0E0E0' }}>{formatTeamApiKeyDisplay(key, !!visibleApiKeys[record.id])}</Text>
          <Tooltip title={visibleApiKeys[record.id] ? 'Hide Key' : 'Show Key'}>
            <Button icon={visibleApiKeys[record.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => toggleApiKeyVisibility(record.id)} type="text" />
          </Tooltip>
          {visibleApiKeys[record.id] && 
            <Tooltip title="Copy Key">
              <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(key); message.success('API Key copied to clipboard!'); }} type="text" />
            </Tooltip>
          }
        </Space>
      ),
    },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (date) => <Space><ClockCircleOutlined /> {dayjs(date).format('YYYY-MM-DD')}</Space> },
    { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy', render: (name) => <Space><UserOutlined /> {name}</Space> },
    { title: 'Last Used', dataIndex: 'lastUsed', key: 'lastUsed', render: (date) => date ? <Space><ClockCircleOutlined /> {dayjs(date).fromNow()}</Space> : 'Never' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: TeamApiKey) => (
        <Tag icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={status === 'active' ? 'success' : 'error'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
          <Space>
          <Button type="link" onClick={() => handleRegenerateApiKey(record)}>Regenerate</Button>
          <Button type="link" onClick={() => handleToggleApiKeyStatus(record.id, record.status, record.name)}>
            {record.status === 'active' ? 'Disable' : 'Enable'}
              </Button>
          <Button type="link" danger onClick={() => handleDeleteApiKey(record.id, record.name)}>Delete</Button>
          </Space>
      ),
    },
  ];

  const handleRegenerateApiKey = (apiKeyToRegenerate: TeamApiKey) => {
    if (!checkTeamHasSufficientBalance()) return;
    setApiKeyToRegenerate(apiKeyToRegenerate);
    setIsRegenerateModalVisible(true);
    setNewlyGeneratedApiKey(null); // Clear previous new key
    confirm({
        title: `Regenerate API Key "${apiKeyToRegenerate.name}"?`,
        icon: <ExclamationCircleOutlined />,
        content: 'This will invalidate the old key immediately. Make sure to update your applications with the new key.',
        okText: 'Yes, Regenerate',
        cancelText: 'Cancel',
      async onOk() {
            const newKeyString = `neb_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            setNewlyGeneratedApiKey(newKeyString);
            // Update the key in the teamDetails state
            setTeamDetails(prev => {
                if (!prev) return null;
          return {
                    ...prev,
                    apiKeys: prev.apiKeys.map(k => 
                        k.id === apiKeyToRegenerate.id 
                        ? { ...k, key: newKeyString, createdAt: dayjs().toISOString(), status: 'active' as 'active' } 
                        : k
                    )
          };
        });
            message.success(`API Key "${apiKeyToRegenerate.name}" has been regenerated. The new key is now displayed. Please copy it as it won\'t be shown again.`);
            // Show the new key in a modal or alert
            Modal.info({
              title: 'New API Key Generated',
          content: (
            <div>
                  <Paragraph>The API key "{apiKeyToRegenerate.name}" has been regenerated. Please copy the new key below. It will not be shown again.</Paragraph>
                  <Input value={newKeyString} readOnly addonAfter={<Button icon={<CopyOutlined />} onClick={() => {navigator.clipboard.writeText(newKeyString); message.success('New API Key copied!')}} />} />
            </div>
          ),
              onOk() {},
        });
      },
      onCancel() {
            setIsRegenerateModalVisible(false);
      },
    });
  };

  const getUserDisplayName = (email: string) => {
    const member = teamDetails?.members.find(m => m.email === email);
    return member?.name || email;
  };

  const getModelUsers = (records: UsageRecord[]): string => {
    if (!records || records.length === 0) return 'N/A';
    const users = [...new Set(records.map(r => getUserDisplayName(r.user)))];
    if (users.length > 2) return `${users.slice(0, 2).join(', ')} & ${users.length - 2} more`;
    return users.join(', ');
  };

  const getDatesInRange = (): string[] => {
    if (!selectedDateRange || !selectedDateRange[0] || !selectedDateRange[1]) {
        const today = dayjs();
        // Default to last 7 days if no range or invalid range
        return Array.from({ length: 7 }, (_, i) => today.subtract(6 - i, 'day').format('YYYY-MM-DD'));
    }
    const dates: string[] = [];
    let currentDate = selectedDateRange[0];
    while (currentDate.isBefore(selectedDateRange[1]) || currentDate.isSame(selectedDateRange[1], 'day')) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'day');
    }
    return dates;
  };
  
  const formatDate = (dateStr: string): string => {
    return dayjs(dateStr).format('MMM D');
  };
  
  const getChartData = () => {
    const datesToDisplay = getDatesInRange();
    const data = datesToDisplay.map(date => {
      const dailyRecord = dailyUsageData.find(d => d.date === date);
      const modelDataArray: any[] = [];
      if (dailyRecord) {
        Object.entries(dailyRecord.models).forEach(([model, data]) => {
          const summary = modelUsageSummary.find(m => m.model === model);
          if (summary) {
            modelDataArray.push({
              model: model,
          cost: data.cost,
          tokens: data.tokens,
          requests: data.requests,
              color: summary.color
      });
          }
        });
      }
      return {
        date: date,
        formattedDate: formatDate(date),
        cost: dailyRecord?.total.cost || 0,
        tokens: dailyRecord?.total.tokens || 0,
        requests: dailyRecord?.total.requests || 0,
        modelDataArray: modelDataArray.sort((a,b) => b.cost - a.cost) // Sort by cost for stacked bar
      };
    });
    return data;
  };
  
  const handleBarClick = (date: string) => {
    setSelectedModelDetail({ date }); // For now, just set the date. Adjust as needed.
    // Potentially open a modal or show details for this date
    console.log("Bar clicked for date:", date);
  };
  
  const handleModelDetailClick = (modelData: any) => {
      setSelectedModelDetail(modelData);
      setIsModelDetailModalVisible(true);
  };
  
  const handleChartTypeChange = (e: RadioChangeEvent) => {
    setChartType(e.target.value);
  };

  const handleTimeGranularityChange = (e: RadioChangeEvent) => {
    setTimeGranularity(e.target.value);
    // Potentially refetch or re-aggregate data based on new granularity
  };

  // Update filteredUsageRecords whenever usageRecords, selectedDateRange, or other filters change
  useEffect(() => {
    let newFilteredRecords = usageRecords;
    // Filter by date range
    if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
      newFilteredRecords = newFilteredRecords.filter(record => 
        dayjs(record.timestamp).isAfter(selectedDateRange![0].startOf('day')) &&
        dayjs(record.timestamp).isBefore(selectedDateRange![1].endOf('day'))
      );
    }
    // Add other filters here if needed (e.g., by user, by model type)
    setFilteredUsageRecords(newFilteredRecords);
  }, [usageRecords, selectedDateRange]);

  const handleEditPermissions = (member: TeamMember) => {
    setEditingPermissionsMember(member);
    const currentRoleKey = member.role as PermissionPackageType; // Cast role to PermissionPackageType
    // Check if currentRoleKey is a valid key in PERMISSION_PACKAGES
    if (currentRoleKey !== 'custom' && PERMISSION_PACKAGES[currentRoleKey] && member.permissions && 
        JSON.stringify(PERMISSION_PACKAGES[currentRoleKey].permissions.sort()) === JSON.stringify(member.permissions.sort())) {
      setPermissionPackage(currentRoleKey);
      setCustomPermissions(member.permissions || []);
    } else {
      setPermissionPackage('custom');
      setCustomPermissions(member.permissions || []);
    }
    permissionsForm.setFieldsValue({ permissions: member.permissions || [] });
    setIsPermissionsModalVisible(true);
  };

  const handleUpdatePermissions = async () => {
    if (!editingPermissionsMember) return;
    try {
        await permissionsForm.validateFields(); // Validate before proceeding
        console.log("Updating permissions for", editingPermissionsMember.email, "to", customPermissions);
        // API call to update permissions for editingPermissionsMember.id with customPermissions
        message.success(`Permissions updated for ${editingPermissionsMember.email}`);
        
        setTeamDetails(prev => prev ? {
            ...prev,
            members: prev.members.map(m => 
                m.id === editingPermissionsMember.id 
                ? { ...m, permissions: customPermissions, role: permissionPackage === 'custom' ? m.role : permissionPackage as 'admin' | 'member' } // Update role if a package was selected
                : m
            )
        } : null);
        setIsPermissionsModalVisible(false);
        setEditingPermissionsMember(null);
    } catch (error) {
        console.error("Failed to update permissions:", error);
        message.error("Failed to update permissions. Please check the form.");
    }
  };

  const onPermissionPackageChange = (e: RadioChangeEvent) => {
    const newPackage = e.target.value as PermissionPackageType;
    setPermissionPackage(newPackage);
    if (newPackage !== 'custom') {
      setCustomPermissions([...PERMISSION_PACKAGES[newPackage].permissions]);
    }
  };

  const onCustomPermissionChange = (permissionKey: string, checked: boolean) => {
    setPermissionPackage('custom'); // Switch to custom if any individual permission is changed
    if (checked) {
      setCustomPermissions(prev => [...prev, permissionKey]);
    } else {
      setCustomPermissions(prev => prev.filter(p => p !== permissionKey));
    }
  };

  // 删除额外的条件渲染逻辑，让组件只使用主要return语句中的条件渲染
  // if (loading || !teamDetails) {
  //   return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#141414' }}><Spin size="large" /></div>;
  // }

  const renderMembersTab = () => {
    if (!teamDetails) return null;
    return (
      <div className="members-tab-content">
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#E0E0E0' }}>Manage Team Members</Title>
          {(teamDetails.currentUserRole === 'owner' || teamDetails.currentUserRole === 'admin') && (
          <Button
            type="primary"
            icon={<UserOutlined />}
              onClick={() => {
                setNewlyGeneratedApiKey(null); // Clear if an API key was just generated
                setIsInviteModalVisible(true);
                setPermissionPackage('custom'); // Reset to custom for new invites
                setCustomPermissions([]);
                inviteForm.setFieldsValue({role: 'member', permissions: []}); // Default to member with no specific permissions
              }}
          >
            Invite Member
          </Button>
          )}
            </div>

        {renderTableTitle('Active Members', <UserOutlined style={{ color: '#52c41a' }} />, activeMembers.length)}
        <Table columns={columns} dataSource={activeMembers} rowKey="id" pagination={false} className="members-table" />

        {pendingMembers.length > 0 && (
          <div style={{ marginTop: 32 }}>
              {renderTableTitle('Pending Invites', <ClockCircleOutlined style={{ color: '#faad14' }} />, pendingMembers.length)}
            <Table columns={pendingColumns} dataSource={pendingMembers} rowKey="id" pagination={false} className="members-table" />
            </div>
        )}

        <Modal
          title="Invite New Member"
          open={isInviteModalVisible}
          onOk={() => inviteForm.submit()}
          onCancel={() => {
            setIsInviteModalVisible(false);
            inviteForm.resetFields();
            setPermissionPackage('custom');
            setCustomPermissions([]);
          }}
          okText="Send Invitation"
          width={600}
        >
          <Form form={inviteForm} layout="vertical" onFinish={handleInviteMember} initialValues={{ role: 'member', permissions: [] }}>
            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input placeholder="Enter email address" />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
              <Select placeholder="Select a role">
                <Select.Option value="admin">Admin</Select.Option>
                <Select.Option value="member">Member</Select.Option>
              </Select>
            </Form.Item>
            
            <Title level={5} style={{marginTop: 20, marginBottom:10}}>Permissions</Title>
            <Radio.Group onChange={onPermissionPackageChange} value={permissionPackage} style={{marginBottom:15}}>
              <Radio.Button value="custom">Custom</Radio.Button>
              <Radio.Button value="developer">Developer</Radio.Button>
              <Radio.Button value="admin">Admin</Radio.Button>
            </Radio.Group>

            <Form.Item name="permissions">
              <Checkbox.Group style={{width: '100%'}} value={customPermissions}>
                <Row gutter={[16,16]}>
                  {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                    <Col span={12} key={groupKey}>
                      <Card title={group.title} size="small" headStyle={{fontSize: '1em'}} bodyStyle={{padding: '10px'}} style={{height: '100%'}}>
                        {group.permissions.map(p => (
                          <Checkbox 
                              key={p.key} 
                              value={p.key} 
                              onChange={(e) => onCustomPermissionChange(p.key, e.target.checked)}
                              style={{display: 'flex', alignItems: 'center', marginBottom: 8}}
                          >
                              <Space direction="vertical" size={0}>
                                  <Text style={{color: "white"}}>{p.label}</Text>
                                  <Text type="secondary" style={{fontSize: '0.8em'}}>{p.description}</Text>
                              </Space>
                          </Checkbox>
                        ))}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        </Modal>
                </div>
    );
  };
  
  const renderApiKeysTab = () => {
    if (!teamDetails) return null;
    return (
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#E0E0E0' }}>Manage Team API Keys</Title>
          {(teamDetails.currentUserRole === 'owner' || teamDetails.currentUserRole === 'admin') && (
              <Button type="primary" icon={<KeyOutlined />} onClick={() => { setNewlyGeneratedApiKey(null); setIsApiKeyModalVisible(true);}}>
                  Create API Key
              </Button>
          )}
                </div>
        <Alert 
          message="API Key Security Information" 
          description="API keys grant programmatic access to your team's resources. Treat them like passwords and keep them secure. Do not embed them directly in client-side code or commit them to version control."
          type="info" 
          showIcon 
          style={{marginBottom: 20}}
        />
        {renderTableTitle('API Keys', <KeyOutlined style={{ color: '#1890ff' }} />, teamDetails.apiKeys.length)}
        <Table columns={apiKeyColumns} dataSource={teamDetails.apiKeys} rowKey="id" pagination={false} className="api-keys-table" />

        <Modal
          title={newlyGeneratedApiKey ? "API Key Created Successfully" : "Create API Key"}
          open={isApiKeyModalVisible}
          onOk={() => {
            if (newlyGeneratedApiKey) {
              setIsApiKeyModalVisible(false);
              setNewlyGeneratedApiKey(null);
              apiKeyForm.resetFields();
            } else {
              apiKeyForm.submit();
            }
          }}
          onCancel={() => {
            setIsApiKeyModalVisible(false);
            setNewlyGeneratedApiKey(null);
            apiKeyForm.resetFields();
          }}
          okText={newlyGeneratedApiKey ? "Close" : "Create Key"}
          cancelButtonProps={newlyGeneratedApiKey ? { style: { display: 'none' } } : {}}
        >
          {newlyGeneratedApiKey ? (
            <div>
              <Paragraph>Please copy your new API key. It will not be shown again:</Paragraph>
              <Input value={newlyGeneratedApiKey} readOnly addonAfter={<Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(newlyGeneratedApiKey); message.success('API Key copied!'); }} />} />
              <Alert message="Store this key securely. It cannot be retrieved again." type="warning" showIcon style={{marginTop: 15}}/>
            </div>
          ) : (
            <Form form={apiKeyForm} layout="vertical" onFinish={handleCreateApiKey}>
              <Form.Item name="name" label="Key Name" rules={[{ required: true, message: 'Please enter a name for this API key' }]}>
                <Input placeholder="e.g., My Production Key" />
              </Form.Item>
               <Paragraph type="secondary">
                This key will have the same permissions and access as your team account.
              </Paragraph>
            </Form>
          )}
        </Modal>
      </div>
    );
  };
  
  const renderInstancesTab = () => {
    if (!teamDetails) return null;
    return (
      <div>
        <Typography.Title level={4} style={{ color: '#E0E0E0', marginBottom: '24px' }}>
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
          teamMembers={teamDetails.members}
          currentUserRole={teamDetails.currentUserRole}
          currentUserEmail={currentUserEmail} // Pass current user's email
          onRefresh={fetchTeamInstances} // Pass refresh handler
              />
              )}
            </div>
    );
  };
  
  const renderObjectStorageTab = () => {
    if (!teamDetails) return null;
    return (
      <Spin spinning={loading}> {/* Consider a specific loading state for this tab if data fetching is separate */}
        <Title level={4} style={{ marginBottom: 24, color: '#E0E0E0' }}>Team Object Storage Overview</Title>
        {objectStorageSummary && (
          <Row gutter={[16, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
              <Card bordered={false} style={{ background: 'rgba(255,255,255,0.05)'}}>
                <Statistic title="Total Workspaces" value={objectStorageSummary.workspaceCount} prefix={<CloudServerOutlined />} valueStyle={{ color: '#1890ff' }} />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
              <Card bordered={false} style={{ background: 'rgba(255,255,255,0.05)'}}>
                <Statistic title="Total Storage Used" value={objectStorageSummary.totalStorage} valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
              <Card bordered={false} style={{ background: 'rgba(255,255,255,0.05)'}}>
                <Statistic title="Total Estimated Cost" value={objectStorageSummary.totalCost} prefix={<DollarOutlined />} valueStyle={{ color: '#faad14' }}/>
              </Card>
            </Col>
          </Row>
        )}
        
        <Title level={5} style={{ marginBottom: 16, color: '#E0E0E0' }}>Workspaces</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Input 
              placeholder="Search by Workspace Name"
              prefix={<SearchOutlined />}
              value={osNameSearch}
              onChange={e => setOsNameSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Input 
              placeholder="Filter by Creator"
              value={osCreatorFilter || ''}
              onChange={e => setOsCreatorFilter(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker 
              style={{ width: '100%' }}
              value={osDateFilter}
              onChange={(dates) => setOsDateFilter(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
                  </Col>
                </Row>
                
                            <Table
        columns={objectStorageColumns}
        dataSource={filteredTeamWorkspaces}
        rowKey="id"
        loading={false} // Replace with actual loading state for workspaces
        pagination={{ pageSize: 10 }}
        className="object-storage-table"
      />
      </Spin>
    );
  };

  const usageColumns: ColumnsType<UsageRecord> = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'), sorter: (a,b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(), defaultSortOrder: 'descend' },
    { title: 'User', dataIndex: 'user', key: 'user', render: (user) => getUserDisplayName(user) },
    { title: 'Provider', dataIndex: 'provider', key: 'provider' },
    { title: 'Model', dataIndex: 'model', key: 'model', render: model => model.split('/').pop() },
    { title: 'App', dataIndex: 'app', key: 'app' },
    { title: 'Tokens In', dataIndex: 'tokensInput', key: 'tokensInput', render: (val) => val.toLocaleString() },
    { title: 'Tokens Out', dataIndex: 'tokensOutput', key: 'tokensOutput', render: (val) => val.toLocaleString() },
    { title: 'Total Tokens', dataIndex: 'totalTokens', key: 'totalTokens', render: (val) => val.toLocaleString(), sorter: (a,b) => a.totalTokens - b.totalTokens },
    { title: 'Cost', dataIndex: 'cost', key: 'cost', render: (cost) => `$${cost.toFixed(5)}`, sorter: (a,b) => a.cost - b.cost },
    { title: 'Speed (t/s)', dataIndex: 'speed', key: 'speed', render: (speed) => speed.toFixed(2) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'completed' ? 'success' : 'error'}>{status}</Tag> },
  ];
  
  const renderSettingsTab = () => (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#E0E0E0' }}>Team Settings</Title>
      <Card style={{background: 'rgba(255,255,255,0.05)', marginBottom: 24}}>
        <Title level={5} style={{color: '#E0E0E0'}}>Team Information</Title>
        <Form layout="vertical">
          <Form.Item label={<Text style={{color: '#C0C0C0'}}>Team Name</Text>}>
            <Input defaultValue={teamDetails.name} />
          </Form.Item>
          <Form.Item label={<Text style={{color: '#C0C0C0'}}>Team Description</Text>}>
            <Input.TextArea defaultValue={teamDetails.description} rows={3} />
          </Form.Item>
          <Button type="primary">Save Changes</Button>
        </Form>
      </Card>

      {(teamDetails.currentUserRole === 'owner') && (
        <Card style={{background: 'rgba(255,255,255,0.05)', marginBottom: 24}}>
          <Title level={5} style={{color: 'red'}}>Danger Zone</Title>
          <Space direction="vertical" style={{width: '100%'}}>
            <Button type="dashed" danger block onClick={() => setTransferOwnershipModalVisible(true)} icon={<UserSwitchOutlined />}>
              Transfer Ownership
            </Button>
            <Button type="primary" danger block onClick={handleDeleteTeam} icon={<DeleteOutlined />}>
              Delete Team
            </Button>
          </Space>
        </Card>
      )}
        <Modal
        title="Transfer Team Ownership"
        open={transferOwnershipModalVisible}
        onOk={() => transferOwnershipForm.submit()}
        onCancel={() => setTransferOwnershipModalVisible(false)}
        okText="Confirm Transfer"
        confirmLoading={false} // Add loading state if API call is slow
       >
        <Form form={transferOwnershipForm} layout="vertical" onFinish={handleTransferOwnership}>
            <Paragraph>Transferring ownership is a critical action. The new owner will have full control over the team.</Paragraph>
            <Form.Item
                name="newOwnerEmail" 
                label="Select New Owner" 
                rules={[{ required: true, message: 'Please select a new owner from the team members.' }]}
            >
                <Select placeholder="Select a team member">
                    {teamDetails.members.filter(m => m.id !== teamDetails.members.find(mem => mem.isCurrentUser)?.id && m.status === 'active').map(member => (
                        <Select.Option key={member.id} value={member.email}>{member.name || member.email}</Select.Option>
                    ))}
                </Select>
            </Form.Item>
          </Form>
        </Modal>
    </div>
  );


  const tabItems = useMemo(() => {
    if (!teamDetails) return [];

    const items = [
      { key: 'members', label: 'Members', children: renderMembersTab(), icon: <UserOutlined /> },
      { key: 'apiKeys', label: 'API Keys', children: renderApiKeysTab(), icon: <KeyOutlined /> },
      { key: 'instances', label: 'Instances', children: renderInstancesTab(), icon: <DesktopOutlined /> },
      { key: 'objectStorage', label: 'Object Storage', children: renderObjectStorageTab(), icon: <CloudServerOutlined /> }, // New Tab
      { key: 'inferenceAnalytics', label: 'Inference Analytics', children: renderUsageAnalyticsTab(), icon: <AreaChartOutlined /> }, // Renamed Tab & icon changed
    ];

    if (teamDetails?.currentUserRole === 'owner' || teamDetails?.currentUserRole === 'admin') {
      items.push({ key: 'settings', label: 'Settings', children: renderSettingsTab(), icon: <SettingOutlined /> });
    }
    return items;
  }, [
      teamDetails,
      loading,
      activeMembers, 
      pendingMembers,
      teamDetails?.apiKeys, 
      visibleApiKeys,
      teamInstances, 
      instancesLoading, 
      currentUserEmail,
      objectStorageSummary, 
      filteredTeamWorkspaces, 
      osNameSearch, 
      osCreatorFilter, 
      osDateFilter,
      filteredUsageRecords, 
      usageSummary, 
      modelUsageSummary, 
      dailyUsageData, 
      chartType, 
      selectedDateRange, 
      isModelDetailModalVisible, 
      selectedModelDetail
  ]);
  
  // Main component return
  return (
    <Layout style={{ padding: '24px', background: '#141414', minHeight: '100vh' }}>
      <Space align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teams')} type="text" style={{color: 'white'}} />
        <Title level={2} style={{ margin: 0, color: 'white' }}>
          {teamDetails ? teamDetails.name : 'Team Management'}
          {teamDetails && (
            <Tag 
              icon={teamDetails.id === 'personal' ? <UserOutlined /> : <TeamOutlined />} 
              color={teamDetails.id === 'personal' ? "blue" : "purple"}
              style={{ marginLeft: 8, verticalAlign: 'middle' }}
            >
              {teamDetails.id === 'personal' ? "Personal" : "Team"}
            </Tag>
          )}
        </Title>
      </Space>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Spin size="large" tip="Loading team data..." />
        </div>
      ) : !teamDetails ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Alert
            message="Error"
            description="Failed to load team data. Please try again later."
            type="error"
            showIcon
            style={{ maxWidth: '500px' }}
          />
        </div>
      ) : (
        <Tabs activeKey={activeTabKey} onChange={handleTabChange} items={tabItems} type="card" />
      )}

      <Modal // Permissions Modal
        title={<Text strong style={{color: "white"}}>Edit Permissions for: {editingPermissionsMember?.name || editingPermissionsMember?.email}</Text>}
        open={isPermissionsModalVisible}
        onCancel={() => setIsPermissionsModalVisible(false)}
          footer={[
          <Button key="cancel" onClick={() => setIsPermissionsModalVisible(false)}>
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
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: "white" }}>
              Permission Preset
            </Text>
            <Radio.Group
            onChange={onPermissionPackageChange} 
            value={permissionPackage}
              style={{ marginBottom: '24px' }}
            >
                <Radio.Button value="custom">Custom</Radio.Button>
            <Radio.Button value="developer">Developer</Radio.Button>
            <Radio.Button value="admin">Admin</Radio.Button>
            {teamDetails?.currentUserRole === 'owner' && <Radio.Button value="owner">Owner (Full Access)</Radio.Button>}
            </Radio.Group>

            <Divider />

          <Form form={permissionsForm} layout="vertical" initialValues={{ permissions: customPermissions }}>
            <Form.Item name="permissions">
                <Checkbox.Group style={{width: '100%'}} value={customPermissions}>
                    <Row gutter={[16,24]}>
            {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                            <Col xs={24} md={12} key={groupKey}>
                                <Card title={group.title} size="small" headStyle={{fontSize: '1em', borderBottom: '1px solid #303030'}} bodyStyle={{padding: '10px 15px'}} style={{height: '100%', background: 'rgba(255,255,255,0.03)'}}>
                  {group.permissions.map(permission => (
                    <Checkbox
                      key={permission.key}
                                            value={permission.key} 
                                            onChange={(e) => onCustomPermissionChange(permission.key, e.target.checked)}
                                            style={{display: 'flex', alignItems: 'flex-start', marginBottom: 12}}
                                            disabled={permissionPackage === 'owner'} // Disable individual if owner package selected
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8}}>
                        <Text style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)' }}>{permission.label}</Text>
                                                <Text type="secondary" style={{fontSize: '0.85em', lineHeight: '1.3'}}>{permission.description}</Text>
                      </div>
                    </Checkbox>
                  ))}
                                </Card>
                            </Col>
            ))}
                    </Row>
                </Checkbox.Group>
            </Form.Item>
          </Form>
          </div>
        </Modal>
    </Layout>
    );
  };

  export default TeamManagement;