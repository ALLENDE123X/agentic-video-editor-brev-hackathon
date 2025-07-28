import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Define the API base URL from environment variable with fallback
const API_BASE_URL = 'http://localhost:3001/api';

// Types matching the backend
export interface AssetMetadata {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  assetType: 'video' | 'image' | 'frame';
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  startFormatted: string;
  endFormatted: string;
}

export interface Transcript {
  segments: TranscriptSegment[];
}

export interface TimelineEntry {
  timestamp: number;
  timestampFormatted: string;
  frameUrl: string;
  frameMetadata?: AssetMetadata;
  description: string;
  analysis?: any;
  transcript?: any;
  relatedAssets?: AssetMetadata[];
}

export interface IndexingResult {
  success: boolean;
  videoId: string;
  message: string;
  videoMetadata: AssetMetadata;
  timeline: TimelineEntry[];
  processingTime: number;
  startTime: string;
  endTime: string;
}

export interface UploadResponse {
  message: string;
  videoId: string;
  videoPath: string;
  videoName: string;
  relatedAssets: number;
  options: any;
}

export interface IndexingOptions {
  framesPerSecond?: number;
  extractAudio?: boolean;
  generateTranscript?: boolean;
  cleanupTempFiles?: boolean;
}

export interface ReelGenerationResponse {
  message: string;
  jobId: string;
  videoId: string;
  prompt: string;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobsResponse {
  jobs: JobStatus[];
}

class VideoIndexerClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      // Don't set default Content-Type for FormData uploads
    });
  }
  
  /**
   * Upload and index a video file with optional related assets
   */
  async uploadAndIndexVideo(
    videoFile: File,
    relatedAssets: File[] = [],
    options: IndexingOptions = {}
  ): Promise<UploadResponse> {
    try {
      console.log('VideoIndexer: Starting upload to', this.client.defaults.baseURL);
      console.log('VideoIndexer: File details', {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      });
      
      const formData = new FormData();
      
      // Add video file
      formData.append('files', videoFile);
      console.log('VideoIndexer: Added file to FormData');
      
      // Add related assets
      relatedAssets.forEach(asset => {
        formData.append('files', asset);
      });
      
      // Add options
      if (options.framesPerSecond) {
        formData.append('framesPerSecond', options.framesPerSecond.toString());
      }
      
      if (options.extractAudio !== undefined) {
        formData.append('extractAudio', options.extractAudio.toString());
      }
      
      if (options.generateTranscript !== undefined) {
        formData.append('generateTranscript', options.generateTranscript.toString());
      }
      
      if (options.cleanupTempFiles !== undefined) {
        formData.append('cleanupTempFiles', options.cleanupTempFiles.toString());
      }
      
      // Set up request config
      const config: AxiosRequestConfig = {
        // Don't set Content-Type manually for FormData - let the browser set it with boundary
      };
      
      console.log('VideoIndexer: Making POST request to /videos/index');
      
      // Make the request
      const response = await this.client.post<UploadResponse>('/videos/index', formData, config);
      
      console.log('VideoIndexer: Upload response received', response.status, response.statusText);
      return response.data;
      
    } catch (error) {
      console.error('VideoIndexer: Upload failed', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Upload failed with status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network Error: Unable to connect to the server.');
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get indexing result for a video
   */
  async getIndexingResult(videoId: string): Promise<IndexingResult> {
    try {
      console.log('VideoIndexer: Getting indexing result for', videoId);
      
      const response = await this.client.get<IndexingResult>(`/videos/${videoId}/index`);
      
      console.log('VideoIndexer: Indexing result received', response.data);
      return response.data;
      
    } catch (error) {
      console.error('VideoIndexer: Failed to get indexing result', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Failed to get indexing result with status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network Error: Unable to connect to the server.');
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get video timeline
   */
  async getVideoTimeline(videoId: string): Promise<TimelineEntry[]> {
    try {
      console.log('VideoIndexer: Getting timeline for video', videoId);
      
      const response = await this.client.get<TimelineEntry[]>(`/videos/${videoId}/timeline`);
      
      console.log('VideoIndexer: Timeline received', response.data);
      return response.data;
      
    } catch (error) {
      console.error('VideoIndexer: Failed to get timeline', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Failed to get timeline with status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network Error: Unable to connect to the server.');
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Create a reel from a video using AI agent
   */
  async createReel(videoId: string, prompt: string): Promise<ReelGenerationResponse> {
    try {
      console.log('VideoIndexer: Creating reel for video', videoId, 'with prompt:', prompt);
      
      const response = await this.client.post<ReelGenerationResponse>(`/videos/${videoId}/reel`, {
        prompt
      });
      
      console.log('VideoIndexer: Reel generation started', response.data);
      return response.data;
      
    } catch (error) {
      console.error('VideoIndexer: Reel creation failed', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Reel creation failed with status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network Error: Unable to connect to the server.');
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      console.log('VideoIndexer: Getting job status for', jobId);
      
      const response = await this.client.get<JobStatus>(`/jobs/${jobId}/status`);
      
      console.log('VideoIndexer: Job status received', response.data);
      return response.data;
      
    } catch (error) {
      console.error('VideoIndexer: Failed to get job status', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Failed to get job status with status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network Error: Unable to connect to the server.');
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Create a progress stream for real-time updates
   */
  createProgressStream(jobId: string): EventSource {
    const url = `${this.client.defaults.baseURL}/jobs/${jobId}/progress`;
    console.log('VideoIndexer: Creating progress stream for', url);
    return new EventSource(url);
  }

  /**
   * Get all jobs for a video
   */
  async getVideoJobs(videoId: string): Promise<JobsResponse> {
    try {
      console.log('VideoIndexer: Getting jobs for video', videoId);
      
      const response = await this.client.get<JobsResponse>(`/videos/${videoId}/jobs`);
      
      console.log('VideoIndexer: Video jobs received', response.data);
      return response.data;
      
    } catch (error) {
      console.error('VideoIndexer: Failed to get video jobs', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Failed to get video jobs with status ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network Error: Unable to connect to the server.');
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

// Create and export a singleton instance
const videoIndexer = new VideoIndexerClient();
export default videoIndexer; 