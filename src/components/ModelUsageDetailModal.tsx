import React from 'react';
import { Modal, Typography, Row, Col, Statistic, Divider, Card, Tag, Space } from 'antd';
import { BarChartOutlined, LineChartOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface ModelUsageData {
  date: string;
  model: string;
  provider: string;
  cost: number;
  tokens: number;
  requests: number;
  tokensInput?: number;
  tokensOutput?: number;
  speed?: number;
}

interface ModelUsageStats {
  min: number;
  max: number;
  avg: number;
  total: number;
}

interface ModelUsageDetailModalProps {
  visible: boolean;
  onClose: () => void;
  modelData: ModelUsageData | null;
  usageRecords: any[];
  date: string;
}

const ModelUsageDetailModal: React.FC<ModelUsageDetailModalProps> = ({
  visible,
  onClose,
  modelData,
  usageRecords,
  date
}) => {
  if (!modelData) return null;

  // Calculate statistics
  const calculateStats = (records: any[], field: string): ModelUsageStats => {
    if (!records || records.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0 };
    }

    const values = records.map(r => r[field] || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = total / values.length;

    return { min, max, avg, total };
  };

  // Filter usage records for current model and date
  const filteredRecords = usageRecords.filter(
    record => record.model === modelData.model && record.date === date
  );

  // Calculate statistics for each metric
  const tokenStats = calculateStats(filteredRecords, 'totalTokens');
  const costStats = calculateStats(filteredRecords, 'cost');
  const speedStats = calculateStats(filteredRecords, 'speed');
  const inputTokenStats = calculateStats(filteredRecords, 'tokensInput');
  const outputTokenStats = calculateStats(filteredRecords, 'tokensOutput');

  // Format number display
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Format cost display
  const formatCost = (cost: number) => {
    if (cost === 0) return '$0';
    if (cost < 0.0001) return '< $0.0001';
    return `$${cost.toFixed(7)}`;
  };

  // Format speed display
  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} tps`;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>Model Usage Details</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ background: '#141414', padding: '24px' }}
      className="model-usage-detail-modal"
    >
      <div className="model-header" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={24}>
            <Card style={{ background: '#1a1a1a', borderColor: '#303030' }}>
              <Space direction="vertical" size="small">
                <Space align="center">
                  <div style={{ width: 12, height: 12, backgroundColor: '#1890ff', borderRadius: '50%' }} />
                  <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
                    {modelData.model.split('/').pop()}
                  </Title>
                  <Tag color="blue">{modelData.provider}</Tag>
                </Space>
                <Text type="secondary">Date: {date}</Text>
                <Text type="secondary">Total Requests: {modelData.requests}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="stats-section">
        <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
          <LineChartOutlined style={{ marginRight: 8 }} />
          Usage Statistics
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card style={{ background: '#1a1a1a', borderColor: '#303030' }}>
              <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
                Tokens
                <Tooltip title="Total tokens processed by this model on the selected date">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.45)' }} />
                </Tooltip>
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Total</Text>} 
                    value={formatNumber(tokenStats.total)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Average</Text>} 
                    value={formatNumber(tokenStats.avg)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Min</Text>} 
                    value={formatNumber(tokenStats.min)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Max</Text>} 
                    value={formatNumber(tokenStats.max)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card style={{ background: '#1a1a1a', borderColor: '#303030' }}>
              <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
                Cost
                <Tooltip title="Cost of using this model on the selected date">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.45)' }} />
                </Tooltip>
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Total</Text>} 
                    value={formatCost(costStats.total)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Average</Text>} 
                    value={formatCost(costStats.avg)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Min</Text>} 
                    value={formatCost(costStats.min)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Max</Text>} 
                    value={formatCost(costStats.max)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card style={{ background: '#1a1a1a', borderColor: '#303030' }}>
              <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
                Token Breakdown
                <Tooltip title="Input and output tokens for this model">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.45)' }} />
                </Tooltip>
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Input Total</Text>} 
                    value={formatNumber(inputTokenStats.total)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Output Total</Text>} 
                    value={formatNumber(outputTokenStats.total)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Input Avg</Text>} 
                    value={formatNumber(inputTokenStats.avg)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Output Avg</Text>} 
                    value={formatNumber(outputTokenStats.avg)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card style={{ background: '#1a1a1a', borderColor: '#303030' }}>
              <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
                Speed (tokens per second)
                <Tooltip title="Processing speed in tokens per second">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.45)' }} />
                </Tooltip>
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Average</Text>} 
                    value={formatSpeed(speedStats.avg)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Max</Text>} 
                    value={formatSpeed(speedStats.max)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Min</Text>} 
                    value={formatSpeed(speedStats.min)} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Requests</Text>} 
                    value={modelData.requests} 
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default ModelUsageDetailModal;

// Add Tooltip component import
import { Tooltip } from 'antd';