import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Slider, Typography, Space, Tag, Divider, Button, Tooltip, Dropdown } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined, DownloadOutlined, InfoCircleOutlined, DownOutlined, AppstoreOutlined } from '@ant-design/icons';
import '../App.less';
import './ServerlessModels.less';

const { Title, Text } = Typography;
const { Option } = Select;

// Mock data - In real application, this should be fetched from API
const mockModels = [
  {
    id: 1,
    name: 'DeepSeek-V3-0324',
    description: 'The most powerful AI-driven LLM with 8B parameters released by DeepSeek',
    inputModalities: ['text'],
    contextLength: 128000,
    promptPrice: 0.01,
    completionPrice: 0.03,
    tags: ['language', 'reasoning'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 2,
    name: 'DeepSeek-R1-Distill-Llama-70B',
    description: 'A highly advanced, distilled version of LLaMA 70B model developed by DeepSeek, optimized for efficiency and performance',
    inputModalities: ['text'],
    contextLength: 200000,
    promptPrice: 0.015,
    completionPrice: 0.075,
    tags: ['language', 'vision'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 3,
    name: 'DeepSeek-R1-Distill-Qwen-32B',
    description: 'A cutting-edge, distilled model developed by DeepSeek, based on the Qwen 32B architecture',
    inputModalities: ['text', 'image'],
    contextLength: 4000,
    promptPrice: 0.02,
    completionPrice: 0,
    tags: ['image-generation'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 4,
    name: 'Llama3.3-70B',
    description: 'A state-of-the-art multilingual model delivering 4096-level performance and quality at cost',
    inputModalities: ['text'],
    contextLength: 8192,
    promptPrice: 0.0001,
    completionPrice: 0.0002,
    tags: ['language', 'open-source'],
    price: '$421/M',
    logoUrl: '/logo.png'
  },
  {
    id: 5,
    name: 'Llama3.1-8B',
    description: 'A compact model offering efficient performance for general-purpose language understanding and generation',
    inputModalities: ['audio'],
    contextLength: 8192,
    promptPrice: 0.006,
    completionPrice: 0,
    tags: ['speech', 'transcription'],
    price: '$421/M',
    logoUrl: '/logo.png'
  },
  {
    id: 6,
    name: 'Qwen2.5-Coder-32B',
    description: 'A model specialized for coding tasks, delivering high performance in code generation, completion, and understanding',
    inputModalities: ['text'],
    contextLength: 4000,
    promptPrice: 0.04,
    completionPrice: 0,
    tags: ['coding', 'development'],
    price: '$440/M',
    logoUrl: '/logo.png'
  },
  {
    id: 7,
    name: 'Qwen-QwQ-32B',
    description: 'A 32 billion parameter reasoning model by Qwen, designed for high-performance reasoning, competing with state-of-the-art models like DeepSeek-R1',
    inputModalities: ['text'],
    contextLength: 32768,
    promptPrice: 0.0025,
    completionPrice: 0.0075,
    tags: ['language', 'reasoning'],
    price: '$1.08/M',
    logoUrl: '/logo.png'
  },
  {
    id: 8,
    name: 'DeepSeek-R1',
    description: 'DeepSeek R1 is here: Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens.',
    inputModalities: ['text'],
    contextLength: 8192,
    promptPrice: 0.0002,
    completionPrice: 0.0006,
    tags: ['language', 'reasoning'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 9,
    name: 'gemini-2.5-pro-exp-03-25',
    description: 'Gemini 2.5 Pro is Google\'s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks.',
    inputModalities: ['text', 'image'],
    contextLength: 8192,
    promptPrice: 0.0002,
    completionPrice: 0.0006,
    tags: ['language', 'multimodal'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 10,
    name: 'deepseek-chat-v3-0324',
    description: 'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team.',
    inputModalities: ['text'],
    contextLength: 8192,
    promptPrice: 0.0002,
    completionPrice: 0.0006,
    tags: ['language', 'chat'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 11,
    name: 'deepseek-chat-v3-0324:free',
    description: 'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team.',
    inputModalities: ['text'],
    contextLength: 8192,
    promptPrice: 0.0002,
    completionPrice: 0.0006,
    tags: ['language', 'chat'],
    isFree: true,
    logoUrl: '/logo.png'
  },
  {
    id: 12,
    name: 'llama-3.3-70b-instruct',
    description: 'The Meta Llama 3.3 multilingual large language model (LLM) is a pretrained and instruction tuned generative model in 70B (text in/text out).',
    inputModalities: ['text'],
    contextLength: 8192,
    promptPrice: 0.0002,
    completionPrice: 0.0006,
    tags: ['language', 'instruction-tuned'],
    isFree: true,
    logoUrl: '/logo.png'
  }
];

const ServerlessModels: React.FC = () => {
  const [models, setModels] = useState(mockModels);
  const [searchText, setSearchText] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [contextLengthRange, setContextLengthRange] = useState<[number, number]>([0, 200000]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0.04]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Use existing logo in the project as default logo
  const defaultModelLogo = '/logo.png';

  // All available input modalities
  const allModalities = ['all', 'text', 'image', 'audio', 'video'];

  // All available model families
  const allSeries = [
    'all',
    'GPT',
    'Claude',
    'Gemini',
    'Grok',
    'Cohere',
    'Nova',
    'Qwen',
    'Yi',
    'DeepSeek',
    'Mistral',
    'Llama2',
    'Llama3',
    'RWKV',
    'Qwen3',
    'Router',
    'Media',
    'Other',
    'PaLM'
  ];

  // Filter models
  useEffect(() => {
    let filteredModels = mockModels;

    // Search by name
    if (searchText) {
      filteredModels = filteredModels.filter(model =>
        model.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by input modality
    if (selectedModality !== 'all') {
      filteredModels = filteredModels.filter(model =>
        model.inputModalities.includes(selectedModality)
      );
    }

    // Filter by model family
    if (selectedSeries !== 'all') {
      filteredModels = filteredModels.filter(model =>
        model.name.toLowerCase().includes(selectedSeries.toLowerCase())
      );
    }

    // Filter by context length
    filteredModels = filteredModels.filter(
      model => model.contextLength >= contextLengthRange[0] && model.contextLength <= contextLengthRange[1]
    );

    // Filter by price
    filteredModels = filteredModels.filter(
      model => model.promptPrice >= priceRange[0] && model.promptPrice <= priceRange[1]
    );

    setModels(filteredModels);
  }, [searchText, selectedModality, selectedSeries, contextLengthRange, priceRange]);

  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setSelectedModality('all');
    setSelectedSeries('all');
    setContextLengthRange([0, 200000]);
    setPriceRange([0, 0.04]);
  };

  // Format price display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(4)} / 1K tokens`;
  };

  // Format context length display
  const formatContextLength = (length: number) => {
    if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K tokens`;
    }
    return `${length} tokens`;
  };

  return (
    <div className="serverless-models-container">
      <div className="header-navigation">
        <div className="page-title">
          <Title level={2} style={{ margin: 0, fontWeight: 500 }}>Serverless Models</Title>
        </div>
        <div className="right-section">
          <div className="nav-links">
            <a href="/pricing" className="nav-link">Pricing</a>
            <a href="/docs" className="nav-link">Docs</a>
            <a href="/referral" className="nav-link">Referral</a>
          </div>
          <div className="user-actions">
            <div className="balance">$1,000.98</div>
            <Button type="primary" className="deposit-button">Deposit</Button>
            <Dropdown
              menu={{
                items: [
                  { key: '1', label: 'Profile' },
                  { key: '2', label: 'Settings' },
                  { key: '3', label: 'Logout' }
                ]
              }}
              trigger={['click']}
            >
              <Button className="user-dropdown">
                boqianw.ang19...
                <DownOutlined style={{ fontSize: '12px', marginLeft: '4px' }} />
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="models-subtitle">
        <Text type="secondary">
        Browse and select available Serverless AI models, pay as you go
      </Text>
      </div>

      <div className="toolbar">
        <div className="search-section">
            <Input
              placeholder="Search model name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            className="search-input"
            />
          <Button 
            type={showFilters ? "primary" : "default"}
            icon={<FilterOutlined />} 
            onClick={() => setShowFilters(!showFilters)}
            className="filter-button"
          >
            Filters
          </Button>
          <Tooltip title="Reset all filters">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={resetFilters}
              disabled={!searchText && selectedModality === 'all' && selectedSeries === 'all' && 
                contextLengthRange[0] === 0 && contextLengthRange[1] === 200000 &&
                priceRange[0] === 0 && priceRange[1] === 0.04}
              className="reset-button"
            />
          </Tooltip>
        </div>
        <div className="models-count">
          <Text type="secondary">{models.length} models available</Text>
        </div>
      </div>

      {showFilters && (
        <div className="filter-section">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6} lg={6}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#ffffff' }}>Input Modalities</Text>
            <Select
                placeholder="Select input modality"
              style={{ width: '100%' }}
                value={selectedModality}
                onChange={setSelectedModality}
                allowClear={false}
            >
              {allModalities.map(modality => (
                <Option key={modality} value={modality}>
                    {modality === 'all' && 'All'}
                  {modality === 'text' && 'Text'}
                  {modality === 'image' && 'Image'}
                  {modality === 'audio' && 'Audio'}
                  {modality === 'video' && 'Video'}
                </Option>
              ))}
            </Select>
          </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#ffffff' }}>Series</Text>
              <Select
                placeholder="Select model series"
                style={{ width: '100%' }}
                value={selectedSeries}
                onChange={setSelectedSeries}
                allowClear={false}
                suffixIcon={<AppstoreOutlined />}
              >
                {allSeries.map(series => (
                  <Option key={series} value={series}>
                    {series === 'all' ? 'All Series' : series}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#ffffff' }}>Context Length (tokens)</Text>
            <Slider
              range
              min={0}
              max={200000}
              value={contextLengthRange}
                onChange={(value) => setContextLengthRange(value as [number, number])}
              tooltip={{ formatter: value => `${value}` }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{contextLengthRange[0]}</Text>
              <Text type="secondary">{contextLengthRange[1]}</Text>
            </div>
          </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#ffffff' }}>Prompt Price ($/1K tokens)</Text>
            <Slider
              range
              min={0}
              max={0.04}
              step={0.001}
              value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
              tooltip={{ formatter: value => `$${value}` }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">${priceRange[0].toFixed(3)}</Text>
              <Text type="secondary">${priceRange[1].toFixed(3)}</Text>
            </div>
          </Col>
        </Row>
      </div>
      )}

      <Row gutter={[16, 16]} className="models-grid">
        {models.length > 0 ? (
          models.map(model => (
            <Col xs={24} sm={12} md={8} lg={6} key={model.id}>
              <Card
                hoverable
                className="model-card"
              >
                <div className="model-card-header">
                  <div className="model-logo">
                    <img src={model.logoUrl || defaultModelLogo} alt={`${model.name} logo`} />
                  </div>
                  <div className="model-title">
                    <Text className="model-name">{model.name}</Text>
                  </div>
                  <div className="model-badge">
                    {model.isFree && <Tag color="blue" className="free-badge">Free</Tag>}
                    {model.price && <Text className="price-badge">{model.price}</Text>}
                  </div>
                </div>
                
                <div className="model-description">
                  <Text>{model.description}</Text>
                </div>
                
                <Divider className="model-divider" />
                
                <div className="model-details">
                  <div className="model-detail-item">
                    <Text strong>Input Modalities:</Text>
                    <div className="model-modalities">
                        {model.inputModalities.map(modality => (
                        <Tag key={modality} color="blue">
                          {modality.charAt(0).toUpperCase() + modality.slice(1)}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  <div className="model-detail-item">
                    <Text strong>Context Length:</Text>
                    <Text> {formatContextLength(model.contextLength)}</Text>
                    </div>
                  <div className="model-detail-item">
                    <Text strong>Prompt Price:</Text>
                    <Text> {formatPrice(model.promptPrice)}</Text>
                    </div>
                    {model.completionPrice > 0 && (
                    <div className="model-detail-item">
                      <Text strong>Completion Price:</Text>
                      <Text> {formatPrice(model.completionPrice)}</Text>
                      </div>
                    )}
                </div>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <div className="no-results">
              <FilterOutlined className="no-results-icon" />
              <Title level={4}>No matching models found</Title>
              <Text type="secondary">Please try adjusting your filter criteria</Text>
              <Button type="primary" icon={<ReloadOutlined />} onClick={resetFilters} style={{ marginTop: 16 }}>
                Reset Filters
              </Button>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ServerlessModels;