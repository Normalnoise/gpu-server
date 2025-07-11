import { message } from 'antd';

// Model parameters interface
export interface ModelParams {
  imageUrl: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
  fps: number;
  cameraFixed: boolean;
  seed: number;
}

// Video interface
export interface Video {
  id: string;
  url: string;
  thumbnail?: string;
  prompt: string;
  params: ModelParams;
  timestamp: Date;
}

// Message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  videos?: Video[];
  status?: 'generating' | 'completed' | 'error';
  progress?: number;
}

// Progress callback type
export type ProgressCallback = (progress: number) => void;

// Mock video URLs for demo purposes
export const mockVideoUrls = [
  'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-little-daughter-eating-a-marshmallow-in-nature-39764-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-white-sand-beach-and-palm-trees-1564-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-in-an-autumn-forest-wearing-a-coat-40266-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-city-at-dusk-1159-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-silhouette-of-a-forest-in-a-sunrise-1456-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-tokyo-at-night-showing-street-traffic-35-large.mp4'
];

// Mock thumbnail images
export const mockThumbnails = [
  'https://picsum.photos/seed/pic1/300/200',
  'https://picsum.photos/seed/pic2/300/200',
  'https://picsum.photos/seed/pic3/300/200',
  'https://picsum.photos/seed/pic4/300/200',
  'https://picsum.photos/seed/pic5/300/200',
  'https://picsum.photos/seed/pic6/300/200',
  'https://picsum.photos/seed/pic7/300/200',
  'https://picsum.photos/seed/pic8/300/200'
];

// Mock prompts for generated videos
export const mockPrompts = [
  'A beautiful forest scene with sunlight filtering through the trees',
  'A serene beach with palm trees and gentle waves',
  'A bustling cityscape at sunset with skyscrapers',
  'A mountain landscape with snow-capped peaks',
  'A space scene with planets and galaxies',
  'An underwater coral reef with colorful fish',
  'A desert landscape with sand dunes at sunrise',
  'A winter forest covered in snow'
];

/**
 * Generate mock videos based on parameters with progress updates
 */
export const generateMockVideos = (
  count: number,
  prompt: string,
  params: ModelParams,
  imageUrl?: string,
  onProgress?: ProgressCallback
): Promise<Video[]> => {
  return new Promise((resolve) => {
    const videos: Video[] = [];
    let currentProgress = 0;
    
    // Create placeholder for progress tracking
    const progressInterval = setInterval(() => {
      currentProgress += 5;
      if (onProgress && currentProgress <= 100) {
        onProgress(currentProgress);
      }
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 150);
    
    // Simulate API delay
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        // Use different videos for each generation
        const videoUrl = mockVideoUrls[i % mockVideoUrls.length];
        
        // Use uploaded image if provided, otherwise use mock thumbnails
        const thumbnail = imageUrl || mockThumbnails[i % mockThumbnails.length];
        
        // Use provided prompt or fallback to mock prompts
        const videoPrompt = prompt || mockPrompts[i % mockPrompts.length];
        
        // Create a new seed for each video unless fixed
        const seed = params.seed + (i * 1000);
        
        videos.push({
          id: `video-${Date.now()}-${i}`,
          url: videoUrl,
          thumbnail: thumbnail,
          prompt: videoPrompt,
          params: {
            ...params,
            seed: seed
          },
          timestamp: new Date()
        });
      }
      
      // Ensure progress is at 100% when complete
      if (onProgress) {
        onProgress(100);
      }
      
      clearInterval(progressInterval);
      resolve(videos);
    }, 3000); // 3 second delay to simulate processing
  });
};

/**
 * Calculate video tokens based on parameters
 */
export const calculateVideoTokens = (params: ModelParams): number => {
  const resolutionValues = {
    '480p': { width: 854, height: 480 },
    '1080p': { width: 1920, height: 1080 }
  };
  
  const { width, height } = resolutionValues[params.resolution as keyof typeof resolutionValues];
  return Math.ceil((width * height * params.fps * params.duration) / 1024);
};

/**
 * Download a video
 */
export const downloadVideo = (video: Video): void => {
  // In a real project, this would use video.url for direct download
  const link = document.createElement('a');
  link.href = video.url;
  link.download = `video-${video.id}.mp4`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('Video download started');
};

/**
 * Mock data for showing in the UI when no real data is available
 */
export const getPreloadedVideos = (): Video[] => {
  const defaultParams: ModelParams = {
    imageUrl: '',
    duration: 5,
    resolution: '1080p',
    aspectRatio: '16:9',
    fps: 24,
    cameraFixed: false,
    seed: 123456
  };
  
  return [
    {
      id: 'preloaded-1',
      url: mockVideoUrls[0],
      thumbnail: mockThumbnails[0],
      prompt: mockPrompts[0],
      params: { ...defaultParams },
      timestamp: new Date()
    },
    {
      id: 'preloaded-2',
      url: mockVideoUrls[1],
      thumbnail: mockThumbnails[1],
      prompt: mockPrompts[1],
      params: { ...defaultParams, aspectRatio: '9:16' },
      timestamp: new Date()
    },
    {
      id: 'preloaded-3',
      url: mockVideoUrls[2],
      thumbnail: mockThumbnails[2],
      prompt: mockPrompts[2],
      params: { ...defaultParams, resolution: '480p' },
      timestamp: new Date()
    },
    {
      id: 'preloaded-4',
      url: mockVideoUrls[3],
      thumbnail: mockThumbnails[3],
      prompt: mockPrompts[3],
      params: { ...defaultParams, cameraFixed: true },
      timestamp: new Date()
    }
  ];
}; 