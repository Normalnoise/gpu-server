import React, { useState } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Select, Divider, Row, Col } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Types
interface Transaction {
  id: string;
  time: string;
  type: 'Commission Payout' | 'Bonus' | 'Credit Back' | 'Charge';
  amount: number;
  hasInvoice: boolean;
}

interface Usage {
  id: string;
  time: string;
  compute: number;
  serverless: number;
  total: number;
  ownerType: 'personal' | 'team';
  ownerName: string;
}

// Mock Data
const mockTransactions: Transaction[] = [
  {
    id: 't1',
    time: '2025-03-29 13:10:02 EST',
    type: 'Commission Payout',
    amount: 0.84,
    hasInvoice: true
  },
  {
    id: 't2',
    time: '2025-01-08 14:11:03 EST',
    type: 'Bonus',
    amount: 1000,
    hasInvoice: true
  },
  {
    id: 't3',
    time: '2025-01-08 14:11:03 EST',
    type: 'Credit Back',
    amount: 0.98,
    hasInvoice: true
  }
];

const mockUsages: Usage[] = [
  {
    id: 'u1',
    time: '2025-05-14',
    compute: 0,
    serverless: 0.0303,
    total: 0.0303,
    ownerType: 'personal',
    ownerName: 'Personal Account'
  },
  {
    id: 'u2',
    time: '2025-05-08',
    compute: 0,
    serverless: 0.3718,
    total: 0.3718,
    ownerType: 'team',
    ownerName: 'ML Development'
  },
  {
    id: 'u3',
    time: '2025-01-08',
    compute: 0,
    serverless: 0.3913,
    total: 0.3913,
    ownerType: 'team',
    ownerName: 'Research Team'
  },
  {
    id: 'u4',
    time: '2025-01-05',
    compute: 0.25,
    serverless: 0.1827,
    total: 0.4327,
    ownerType: 'personal',
    ownerName: 'Personal Account'
  },
  {
    id: 'u5',
    time: '2024-12-28',
    compute: 0.12,
    serverless: 0.2541,
    total: 0.3741,
    ownerType: 'team',
    ownerName: 'Product Development'
  },
  {
    id: 'u6',
    time: '2024-12-15',
    compute: 0.08,
    serverless: 0.4126,
    total: 0.4926,
    ownerType: 'team',
    ownerName: 'ML Development'
  }
];

const Billing: React.FC = () => {
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('daily');
  
  // Filter usages based on owner filter
  const filteredUsages = mockUsages.filter(usage => {
    if (ownerFilter === 'all') return true;
    if (ownerFilter === 'personal') return usage.ownerType === 'personal';
    return usage.ownerType === 'team' && usage.ownerName === ownerFilter;
  });

  // Get unique team names for the filter
  const teamNames = Array.from(
    new Set(mockUsages.filter(u => u.ownerType === 'team').map(u => u.ownerName))
  );

  // Transactions columns
  const transactionColumns = [
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
      align: 'right' as const,
    },
    {
      title: 'Invoice',
      key: 'invoice',
      render: (_: any, record: Transaction) => (
        record.hasInvoice ? (
          <Button type="default" icon={<DownloadOutlined />}>
            Download PDF
          </Button>
        ) : null
      ),
      align: 'right' as const,
    },
  ];

  // Usage columns
  const usageColumns = [
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Account Type',
      dataIndex: 'ownerType',
      key: 'ownerType',
      render: (_: any, record: Usage) => (
        <Space>
          <Tag color={record.ownerType === 'personal' ? 'blue' : 'green'}>
            {record.ownerType === 'personal' ? 'Personal' : 'Team'}
          </Tag>
          {record.ownerType === 'team' && record.ownerName}
        </Space>
      ),
    },
    {
      title: 'Compute',
      dataIndex: 'compute',
      key: 'compute',
      render: (compute: number) => `$${compute.toFixed(4)}`,
      align: 'right' as const,
    },
    {
      title: 'Serverless',
      dataIndex: 'serverless',
      key: 'serverless',
      render: (serverless: number) => `$${serverless.toFixed(4)}`,
      align: 'right' as const,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `$${total.toFixed(4)}`,
      align: 'right' as const,
    },
  ];

  return (
    <div style={{ background: '#141414', padding: '24px', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#ffffff', marginBottom: '4px' }}>Transactions</Title>
      <Text style={{ color: 'rgba(255, 255, 255, 0.65)', marginBottom: '24px' }}>
        Stay in control, monitor your consumption.
      </Text>

      <Card 
        style={{ background: '#1a1a1a', borderColor: '#303030', marginTop: '16px', marginBottom: '32px' }}
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            style={{ background: '#1f1f1f', borderColor: '#303030' }}
          >
            Refresh
          </Button>
        }
      >
        <Table 
          columns={transactionColumns} 
          dataSource={mockTransactions} 
          rowKey="id"
          pagination={{
            total: mockTransactions.length,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total}`,
            current: 1
          }}
          style={{ background: '#1a1a1a', color: '#ffffff' }}
        />
      </Card>

      <Title level={2} style={{ color: '#ffffff', marginTop: '32px', marginBottom: '24px' }}>Usages</Title>
      
      <Card 
        style={{ background: '#1a1a1a', borderColor: '#303030' }}
        extra={
          <Space>
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', marginRight: '8px' }}>Account</Text>
              <Select 
                value={ownerFilter} 
                onChange={setOwnerFilter}
                style={{ width: 180 }}
                dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
              >
                <Option value="all">All</Option>
                <Option value="personal">Personal Account</Option>
                {teamNames.map(team => (
                  <Option key={team} value={team}>{team}</Option>
                ))}
              </Select>
            </div>
            
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', marginRight: '8px' }}>Product category</Text>
              <Select 
                value={productCategoryFilter}
                onChange={setProductCategoryFilter}
                style={{ width: 120 }}
                dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
              >
                <Option value="all">All</Option>
                <Option value="compute">Compute</Option>
                <Option value="serverless">Serverless</Option>
              </Select>
            </div>
            
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', marginRight: '8px' }}>Time</Text>
              <Select 
                value={timeFilter} 
                onChange={setTimeFilter}
                style={{ width: 120 }}
                dropdownStyle={{ background: '#1f1f1f', borderColor: '#303030' }}
              >
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
            </div>
            
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              style={{ background: '#1f1f1f', borderColor: '#303030' }}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table 
          columns={usageColumns} 
          dataSource={filteredUsages} 
          rowKey="id"
          pagination={{
            total: filteredUsages.length,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total}`,
            current: 1
          }}
          style={{ background: '#1a1a1a', color: '#ffffff' }}
        />
      </Card>
    </div>
  );
};

export default Billing; 