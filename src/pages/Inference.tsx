import React, { useState } from 'react';
import { Card, Typography, Row, Col, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import '../App.less';
import './Inference.less';

const { Title, Text } = Typography;

// 模型数据
const imageModels = [
  {
    id: 1,
    name: 'Bytedance-Seedream-3.0',
    logo: '/assets/icons/bytedance-logo.svg',
    description: 'A top-tier bilingual text-to-image model rivaling GPT-4. Native 2K resolution, fast generation, accurate text, artistic layouts, and stunning detail',
    price: '$0.021/image',
  },
  {
    id: 2,
    name: 'SD-XL 1.0-base',
    logo: '/assets/icons/sd-logo.svg',
    description: 'A high-resolution latent diffusion model designed for generating detailed and high-quality images',
    price: '$0.009/image',
  },
  {
    id: 3,
    name: 'FLUX.1 [schnell]',
    logo: '/assets/icons/flux-logo.svg',
    description: 'A 12 billion parameter rectified flow transformer capable of generating images from text descriptions',
    price: '$0.019/image',
  }
];

const embeddingModels = [
  {
    id: 1,
    name: 'UAE-Large-V1',
    logo: '/assets/icons/uae-logo.svg',
    description: 'A universal English sentence embedding model by WhereIsAI with 1024-dim embeddings and 512 context length support',
    price: '$0.012/M',
  },
  {
    id: 2,
    name: 'BGE-large-en-v1.5',
    logo: '/assets/icons/bge-logo.svg',
    description: 'An English sentence embedding model for retrieval and semantic similarity with 1024-dim embeddings and 512 context length support',
    price: '$0.006/M',
  },
];

const visionModels = [
  {
    id: 1,
    name: 'Qwen2.5-VL-7B-Instruct',
    logo: '/assets/icons/qwen-logo.svg',
    description: 'An advanced vision-language model designed to understand and process both visual and textual inputs with high accuracy',
    price: '$0.1/M',
  },
  {
    id: 2,
    name: 'bytedance/seedance-1-pro',
    logo: '/assets/icons/bytedance-logo.svg',
    description: 'A pro version of Seedance that offers text-to-video and image-to-video support for 5s or 10s videos, at 480p and 1080p resolution',
    price: '$0.15/video',
    routePath: '/model/seedance-1-pro'
  },
];

const Inference: React.FC = () => {
  const navigate = useNavigate();
  // 默认使用项目中的图标作为fallback
  const defaultLogo = '/logo.svg';

  // 处理卡片点击
  const handleCardClick = (model: any) => {
    if (model.routePath) {
      navigate(model.routePath);
    }
  };

  // 渲染模型卡片
  const renderModelCard = (model: any) => (
    <Col xs={24} sm={24} md={12} lg={8} xl={8} key={model.id}>
      <Card 
        className="model-card"
        onClick={() => handleCardClick(model)}
        hoverable={!!model.routePath}
      >
        <div className="model-card-content">
          <div className="model-logo">
            <img 
              src={model.logo || defaultLogo} 
              alt={`${model.name} logo`} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultLogo;
              }}
            />
          </div>
          <div className="model-header">
            <Title level={5} className="model-name">{model.name}</Title>
            <div className="model-price">{model.price}</div>
          </div>
          <Text className="model-description">{model.description}</Text>
        </div>
      </Card>
    </Col>
  );

  // 渲染一个模型类别部分
  const renderModelSection = (title: string, models: any[]) => (
    <div className="section">
      <Title level={3} className="section-title">{title}</Title>
      <Row gutter={[16, 16]} className="models-row">
        {models.map(model => renderModelCard(model))}
      </Row>
    </div>
  );

  return (
    <div className="inference-container">
      {renderModelSection('Image Models', imageModels)}
      {renderModelSection('Embedding Models', embeddingModels)}
      {renderModelSection('Vision Models', visionModels)}
    </div>
  );
};

export default Inference; 