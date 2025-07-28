import useStore from "../store/use-store";
import { useEffect, useRef, useState } from "react";
import { Droppable } from "@/components/ui/droppable";
import { PlusIcon } from "lucide-react";
import { DroppableArea } from "./droppable";
import videoIndexer from "@/lib/videoIndexer";

interface SceneEmptyProps {
  onVideoUploadStart?: (file: File) => void;
  onVideoUploadProgress?: (progress: number) => void;
  onVideoUploadComplete?: (videoData: { id: string; url: string }) => void;
  onIndexingProgress?: (progress: number, step: string) => void;
  onIndexingComplete?: () => void;
}

const SceneEmpty = ({ 
  onVideoUploadStart,
  onVideoUploadProgress, 
  onVideoUploadComplete,
  onIndexingProgress,
  onIndexingComplete 
}: SceneEmptyProps = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [desiredSize, setDesiredSize] = useState({ width: 0, height: 0 });
  const { size } = useStore();

  useEffect(() => {
    const container = containerRef.current!;
    const PADDING = 96;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    const desiredZoom = Math.min(
      containerWidth / width,
      containerHeight / height,
    );
    setDesiredSize({
      width: width * desiredZoom,
      height: height * desiredZoom,
    });
    setIsLoading(false);
  }, [size]);

  const simulateIndexingProgress = async (videoData: { id: string; url: string }) => {
    const steps = [
      { progress: 20, step: 'Uploading video to CDN' },
      { progress: 40, step: 'Extracting frames from video' },
      { progress: 60, step: 'Generating transcript with Whisper' },
      { progress: 80, step: 'Analyzing frames with AI' },
      { progress: 100, step: 'Indexing complete' }
    ];

    for (const { progress, step } of steps) {
      onIndexingProgress?.(progress, step);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    onIndexingComplete?.();
  };

  const onSelectFiles = async (files: File[]) => {
    console.log('Files selected:', files);
    
    if (files.length === 0) return;
    
    // Filter for video files
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      console.error('No video files found');
      alert('Please select a video file (MP4, MOV, AVI, WebM)');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload the first video file
      const videoFile = videoFiles[0];
      console.log('Uploading video:', {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type,
        lastModified: videoFile.lastModified
      });

      // Notify AI assistant of upload start
      onVideoUploadStart?.(videoFile);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        const progress = Math.random() * 30 + 10; // Random progress for simulation
        onVideoUploadProgress?.(progress);
      }, 500);

      const response = await videoIndexer.uploadAndIndexVideo(
        videoFile,
        [], // No related assets
        {
          framesPerSecond: 1,
          generateTranscript: true
        }
      );
      
      clearInterval(progressInterval);
      console.log('Upload successful:', response);
      
      // Extract video ID from response path (simulate)
      const videoId = response.videoPath.split('/').pop()?.split('-')[0] || 'video_1';
      const cdnUrl = `https://cdn.example.com/videos/${videoId}.mp4`; // Simulate CDN URL
      
      const videoData = { id: videoId, url: cdnUrl };
      
      // Notify AI assistant of upload completion
      onVideoUploadComplete?.(videoData);
      
      // Start indexing simulation
      await simulateIndexingProgress(videoData);
      
      // TODO: Add the video to the timeline/editor using the CDN URL
      // This would integrate with the existing video management system
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div ref={containerRef} className="absolute z-50 flex h-full w-full flex-1">
      {!isLoading ? (
        <Droppable
          maxFileCount={4}
          maxSize={100 * 1024 * 1024} // 100MB to match backend
          disabled={isUploading}
          onValueChange={onSelectFiles}
          className="h-full w-full flex-1 bg-background"
          accept={{
            "video/*": [".mp4", ".mov", ".avi", ".webm"]
          }}
        >
          <DroppableArea
            onDragStateChange={setIsDraggingOver}
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center border border-dashed text-center transition-colors duration-200 ease-in-out ${
              isDraggingOver ? "border-white bg-white/10" : "border-white/15"
            }`}
            style={{
              width: desiredSize.width,
              height: desiredSize.height,
            }}
          >
            <div className="flex flex-col items-center justify-center gap-4 pb-12">
              <div className="hover:bg-primary-dark cursor-pointer rounded-md border bg-primary p-2 text-secondary transition-colors duration-200">
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-px">
                <p className="text-sm text-muted-foreground">
                  {isUploading ? "Uploading video..." : "Click to upload"}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Or drag and drop video files here
                </p>
              </div>
            </div>
          </DroppableArea>
        </Droppable>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background-subtle text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
};

export default SceneEmpty; 