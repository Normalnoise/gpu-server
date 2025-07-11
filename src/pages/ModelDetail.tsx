import React, { useState, useRef, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Button, 
  Input, 
  Select, 
  Space, 
  Checkbox, 
  Tabs, 
  Tooltip, 
  Form, 
  InputNumber,
  message,
  Divider,
  Row,
  Col,
  Modal,
  Progress,
  Carousel,
  Tag,
  Collapse,
  Upload
} from 'antd';
import { 
  ArrowLeftOutlined, 
  FullscreenOutlined, 
  PlusOutlined, 
  SendOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  CaretRightOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import './ModelDetail.less';
import { 
  ModelParams, 
  Video, 
  ChatMessage, 
  generateMockVideos, 
  calculateVideoTokens, 
  downloadVideo,
  getPreloadedVideos,
  ProgressCallback
} from '../services/videoService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ModelDetail: React.FC = () => {
  const navigate = useNavigate();
  const carouselRef = useRef<any>(null);
  const { modelId } = useParams<{ modelId: string }>();
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewVideos, setPreviewVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  
  // Local image upload
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  
  // Generation count
  const [generationCount, setGenerationCount] = useState<number>(1);
  
  // Generation progress
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  // Model parameters
  const [params, setParams] = useState<ModelParams>({
    imageUrl: '',
    duration: 5,
    resolution: '1080p',
    aspectRatio: '16:9',
    fps: 24,
    cameraFixed: false,
    seed: Math.floor(Math.random() * 1000000)
  });

  // Add preloaded examples when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      // Add an example message with preloaded videos
      const preloadedVideos = getPreloadedVideos();
      
      if (preloadedVideos.length > 0) {
        const exampleMessage: ChatMessage = {
          id: 'example-message',
          role: 'assistant',
          content: 'Here are some example videos generated with this model:',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          videos: preloadedVideos
        };
        
        setMessages([exampleMessage]);
      }
    }
  }, []);

  // Handle message sending
  const handleSendMessage = () => {
    if (!prompt.trim() && !params.imageUrl && !uploadedImageUrl) {
      message.warning('Please enter a prompt or upload an image');
      return;
    }
    
    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt || `Generate ${generationCount} video${generationCount > 1 ? 's' : ''} ${uploadedImageUrl ? 'based on uploaded image' : params.imageUrl ? 'based on image URL' : ''}`,
      timestamp: new Date()
    };
    
    if (uploadedImageUrl) {
      userMessage.media = {
        type: 'image',
        url: uploadedImageUrl
      };
    } else if (params.imageUrl) {
      userMessage.media = {
        type: 'image',
        url: params.imageUrl
      };
    }
    
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setGenerationProgress(0);
    
    // Create placeholder assistant message for progress display
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Generating videos...',
      timestamp: new Date(),
      status: 'generating',
      progress: 0
    };
    
    setMessages(prev => [...prev, placeholderMessage]);
    
    // Generate parameters including image info
    const generationParams = {
      ...params,
      imageUrl: uploadedImageUrl || params.imageUrl
    };
    
    // Progress callback function
    const handleProgress: ProgressCallback = (progress) => {
      setGenerationProgress(progress);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, progress: progress }
          : msg
      ));
    };
    
    // Use the service to generate mock videos
    generateMockVideos(
      generationCount, 
      prompt, 
      generationParams, 
      uploadedImageUrl,
      handleProgress
    ).then(videos => {
      // Update assistant message with videos
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: `Generated ${generationCount} video${generationCount > 1 ? 's' : ''}. Click to preview or download:`,
        timestamp: new Date(),
        videos: videos,
        status: 'completed',
        progress: 100
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? assistantMessage : msg
      ));
      setIsLoading(false);
      setGenerationProgress(100);
    });
  };

  // Handle parameter changes
  const handleParamChange = (key: keyof ModelParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Handle image upload
  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done') {
      // Create a temporary URL for displaying the image
      const file = info.file.originFileObj;
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(file);
      setUploadedImageUrl(imageUrl);
      message.success(`${info.file.name} uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed`);
    }
  };

  // Clear uploaded image
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageUrl('');
  };

  // Go back to previous page
  const handleGoBack = () => {
    navigate('/inference');
  };

  // Open video preview with multiple videos
  const handlePreviewVideo = (video: Video, allVideos?: Video[]) => {
    if (allVideos && allVideos.length > 0) {
      setPreviewVideos(allVideos);
      const index = allVideos.findIndex(v => v.id === video.id);
      setCurrentVideoIndex(index >= 0 ? index : 0);
    } else {
      setPreviewVideos([video]);
      setCurrentVideoIndex(0);
    }
    setPreviewVisible(true);
  };

  // Close video preview
  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewVideos([]);
    setCurrentVideoIndex(0);
  };

  // Change carousel to previous video
  const handlePrevVideo = () => {
    if (carouselRef.current) {
      carouselRef.current.prev();
    }
  };

  // Change carousel to next video
  const handleNextVideo = () => {
    if (carouselRef.current) {
      carouselRef.current.next();
    }
  };

  // Handle carousel change
  const handleCarouselChange = (current: number) => {
    setCurrentVideoIndex(current);
  };

  // Download video using native browser download
  const handleDownloadVideo = (video: Video) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `video-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Video download started');
  };

  // Randomize seed
  const randomizeSeed = () => {
    handleParamChange('seed', Math.floor(Math.random() * 1000000));
  };

  const renderChatMessages = () => {
    return messages.map(msg => (
      <div key={msg.id} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
        <div className="message-content">
          <p>{msg.content}</p>
          {msg.media && msg.media.type === 'image' && (
            <img src={msg.media.url} alt="User uploaded" className="message-media" />
          )}
          
          {msg.status === 'generating' && (
            <div className="generation-progress">
              <Progress 
                percent={msg.progress || 0} 
                status="active" 
                size="small"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text type="secondary">Processing video generation...</Text>
            </div>
          )}
          
          {msg.videos && msg.videos.length > 0 && (
            <div className="video-grid">
              {msg.videos.map(video => (
                <div key={video.id} className="video-item">
                  <div 
                    className="video-thumbnail" 
                    onClick={() => handlePreviewVideo(video, msg.videos)}
                    style={{ backgroundImage: `url(${video.thumbnail || 'https://picsum.photos/seed/default/300/200'})` }}
                  >
                    <div className="video-overlay">
                      <PlayCircleOutlined />
                    </div>
                  </div>
                  <div className="video-actions">
                    <Button 
                      type="text" 
                      icon={<DownloadOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadVideo(video);
                      }}
                      title="Download video"
                    />
                    <Button 
                      type="text" 
                      icon={<PlayCircleOutlined />} 
                      onClick={() => handlePreviewVideo(video, msg.videos)}
                      title="Preview video"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="message-timestamp">
          {msg.timestamp.toLocaleTimeString()}
        </div>
      </div>
    ));
  };

  return (
    <div className="model-detail-container">
      <div className="model-detail-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleGoBack}
          className="back-button"
        >
          Back
        </Button>
        <span className="model-title">Serverless</span>
      </div>
      
      <div className="model-detail-content">
        <div className="chat-container">
          <Card className="chat-card">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              className="chat-tabs"
            >
              <TabPane tab="Chat" key="chat"></TabPane>
              <TabPane tab="API" key="api"></TabPane>
            </Tabs>
            
            <div className="token-info">
              <Tooltip title="Video Tokens = (Width * Height * FPS * Duration) / 1024">
                <span>Video Tokens</span>
              </Tooltip>
            </div>
            
            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="logo-placeholder">
                    <img src="/logo.svg" alt="Logo" />
                  </div>
                  <Text className="empty-text">What's on your mind?</Text>
                </div>
              ) : (
                <div className="messages-list">
                  {renderChatMessages()}
                </div>
              )}
            </div>
            
            <div className="chat-input-container">
              <Input
                placeholder="Enter prompt to generate video..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onPressEnter={!isLoading ? handleSendMessage : undefined}
                disabled={isLoading}
                suffix={
                  <Space>
                    <Upload
                      name="image"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        const isImage = file.type.startsWith('image/');
                        if (!isImage) {
                          message.error('You can only upload image files!');
                        }
                        return isImage || Upload.LIST_IGNORE;
                      }}
                      onChange={handleImageUpload}
                      disabled={isLoading}
                    >
                      <Button 
                        type="text" 
                        icon={<PictureOutlined />}
                        className="input-button"
                        title="Upload image"
                        disabled={isLoading}
                      />
                    </Upload>
                    <Button 
                      type="primary" 
                      shape="circle"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      className="send-button"
                      loading={isLoading}
                      disabled={isLoading}
                    />
                  </Space>
                }
              />
              
              {uploadedImageUrl && (
                <div className="uploaded-image-preview">
                  <div className="preview-header">
                    <Text className="preview-title">Uploaded image:</Text>
                    <Button 
                      type="text" 
                      icon={<CloseCircleOutlined />} 
                      onClick={clearUploadedImage}
                      size="small"
                      disabled={isLoading}
                    />
                  </div>
                  <img src={uploadedImageUrl} alt="Preview" />
                </div>
              )}
            </div>
          </Card>
        </div>
        
        <div className="model-params-container">
          <Card className="params-card">
            <div className="param-section">
              <Text className="param-label">Model</Text>
              <Select 
                value="bytedance/seedance-1-pro"
                className="param-select"
                disabled
              >
                <Option value="bytedance/seedance-1-pro">
                  <span role="img" aria-label="model">🤖</span> bytedance/seedance-1-pro
                </Option>
              </Select>
            </div>
            
            <Divider orientation="left">Image Settings</Divider>
            
            <div className="param-section">
              <Text className="param-label">Image URL</Text>
              <Input 
                placeholder="Enter image URL for image-to-video conversion"
                value={params.imageUrl}
                onChange={(e) => handleParamChange('imageUrl', e.target.value)}
                className="image-url-input"
                disabled={isLoading}
              />
            </div>
            
            <div className="param-section">
              <Text className="param-label">Generation Count</Text>
              <InputNumber 
                min={1}
                max={4}
                value={generationCount}
                onChange={(value) => setGenerationCount(value || 1)}
                className="param-input-number"
                disabled={isLoading}
              />
            </div>
            
            <div className="param-section">
              <Text className="param-label">Duration (seconds)</Text>
              <Select 
                value={params.duration}
                onChange={(value) => handleParamChange('duration', value)}
                className="param-select"
                disabled={isLoading}
              >
                <Option value={5}>5 seconds</Option>
                <Option value={10}>10 seconds</Option>
              </Select>
            </div>
            
            <div className="param-section">
              <Checkbox 
                checked={params.cameraFixed}
                onChange={(e) => handleParamChange('cameraFixed', e.target.checked)}
                disabled={isLoading}
              >
                <Text className="param-checkbox-label">Fixed Camera Position</Text>
              </Checkbox>
              <Tooltip title="Fix camera position to prevent camera movement">
                <InfoCircleOutlined className="info-icon" />
              </Tooltip>
            </div>
            
            <Divider orientation="left">Advanced Options</Divider>
            
            <div className="param-section">
              <Text className="param-label">Resolution</Text>
              <Select 
                value={params.resolution}
                onChange={(value) => handleParamChange('resolution', value)}
                className="param-select"
                disabled={isLoading}
              >
                <Option value="480p">480p</Option>
                <Option value="1080p">1080p</Option>
              </Select>
            </div>
            
            <div className="param-section">
              <Text className="param-label">Aspect Ratio <Tooltip title="This setting is ignored when using an image"><InfoCircleOutlined /></Tooltip></Text>
              <Select 
                value={params.aspectRatio}
                onChange={(value) => handleParamChange('aspectRatio', value)}
                className="param-select"
                disabled={isLoading}
              >
                <Option value="1:1">1:1 (Square)</Option>
                <Option value="16:9">16:9 (Landscape)</Option>
                <Option value="4:3">4:3 (Landscape)</Option>
                <Option value="21:9">21:9 (Widescreen)</Option>
                <Option value="9:16">9:16 (Portrait)</Option>
                <Option value="3:4">3:4 (Portrait)</Option>
              </Select>
            </div>
            
            <div className="param-section">
              <Text className="param-label">Frame Rate (FPS)</Text>
              <InputNumber 
                min={15}
                max={60}
                value={params.fps}
                onChange={(value) => handleParamChange('fps', value || 24)}
                className="param-input-number"
                disabled={isLoading}
              />
            </div>
            
            <div className="param-section seed-section">
              <div className="seed-header">
                <Text className="param-label">Random Seed</Text>
                <Button 
                  size="small" 
                  onClick={randomizeSeed}
                  disabled={isLoading}
                >
                  Randomize
                </Button>
              </div>
              <InputNumber 
                value={params.seed}
                onChange={(value) => handleParamChange('seed', value || 0)}
                className="param-input-number"
                disabled={isLoading}
              />
              <Text type="secondary" className="seed-hint">Using the same seed will produce similar results</Text>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Video Preview Modal */}
      <Modal
        title="Video Preview"
        visible={previewVisible}
        onCancel={handleClosePreview}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => previewVideos[currentVideoIndex] && handleDownloadVideo(previewVideos[currentVideoIndex])}>
            Download Video
          </Button>,
          <Button key="close" onClick={handleClosePreview}>
            Close
          </Button>
        ]}
        width={800}
        className="video-preview-modal"
      >
        {previewVideos.length > 0 && (
          <div className="video-preview-content">
            <div className="carousel-container">
              {previewVideos.length > 1 && (
                <Button 
                  className="carousel-button carousel-button-prev" 
                  icon={<LeftCircleOutlined />} 
                  onClick={handlePrevVideo}
                />
              )}
              
              <Carousel 
                ref={carouselRef} 
                afterChange={handleCarouselChange}
                dots={previewVideos.length > 1}
              >
                {previewVideos.map((video, index) => (
                  <div key={video.id} className="carousel-item">
                    <video controls autoPlay={index === currentVideoIndex} className="preview-video">
                      <source src={video.url} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  </div>
                ))}
              </Carousel>
              
              {previewVideos.length > 1 && (
                <Button 
                  className="carousel-button carousel-button-next" 
                  icon={<RightCircleOutlined />}
                  onClick={handleNextVideo}
                />
              )}
            </div>
            
            <div className="video-info">
              <div className="prompt-section">
                <Text strong>Prompt:</Text>
                <Paragraph className="prompt-text">{previewVideos[currentVideoIndex]?.prompt || 'No prompt provided'}</Paragraph>
              </div>
              
              <div className="param-header">
                <Text strong>Parameters:</Text>
              </div>
              
              <ul className="video-params-list">
                <li><span className="param-label">Resolution:</span> <span className="param-value">{previewVideos[currentVideoIndex]?.params.resolution}</span></li>
                <li><span className="param-label">Duration:</span> <span className="param-value">{previewVideos[currentVideoIndex]?.params.duration} seconds</span></li>
                <li><span className="param-label">Frame Rate:</span> <span className="param-value">{previewVideos[currentVideoIndex]?.params.fps} fps</span></li>
                <li><span className="param-label">Aspect Ratio:</span> <span className="param-value">{previewVideos[currentVideoIndex]?.params.aspectRatio}</span></li>
                <li><span className="param-label">Fixed Camera:</span> <span className="param-value">{previewVideos[currentVideoIndex]?.params.cameraFixed ? 'Yes' : 'No'}</span></li>
                <li><span className="param-label">Seed:</span> <span className="param-value">{previewVideos[currentVideoIndex]?.params.seed}</span></li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModelDetail; 