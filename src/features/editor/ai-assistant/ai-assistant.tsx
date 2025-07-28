import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Download, CheckCircle } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'status' | 'progress' | 'normal';
}

interface VideoState {
  id?: string;
  url?: string;
  isIndexed: boolean;
  isUploading: boolean;
  uploadProgress: number;
  indexingProgress: number;
}

interface ReelGenerationState {
  isGenerating: boolean;
  currentStep: string;
  progress: number;
  downloadUrl?: string;
  jobId?: string;
}

export interface AIAssistantRef {
  handleVideoUploadStart?: (file: File) => void;
  handleVideoUploadProgress?: (progress: number) => void;
  handleVideoUploadComplete?: (videoData: { id: string; url: string }) => void;
  handleIndexingProgress?: (progress: number, step: string) => void;
  handleIndexingComplete?: () => void;
}

const AIAssistant = forwardRef<AIAssistantRef>((props, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [videoState, setVideoState] = useState<VideoState>({
    isIndexed: false,
    isUploading: false,
    uploadProgress: 0,
    indexingProgress: 0
  });
  const [reelState, setReelState] = useState<ReelGenerationState>({
    isGenerating: false,
    currentStep: '',
    progress: 0
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message for indexed video
  useEffect(() => {
    if (videoState.isIndexed && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Ask me to edit your video using natural language. I have semantic understanding of your content.',
        type: 'normal'
      }]);
    }
  }, [videoState.isIndexed, messages.length]);

  // Handle video upload progress updates
  const handleVideoUploadStart = (videoFile: File) => {
    setVideoState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));
    setMessages([{
      role: 'assistant',
      content: 'Video uploading...',
      type: 'status',
      isStreaming: true
    }]);
  };

  const handleVideoUploadProgress = (progress: number) => {
    setVideoState(prev => ({ ...prev, uploadProgress: progress }));
    if (progress < 100) {
      setMessages(prev => [{
        ...prev[0],
        content: `Video uploading... ${Math.round(progress)}%`
      }]);
    }
  };

  const handleVideoUploadComplete = (videoData: { id: string; url: string }) => {
    setVideoState(prev => ({ 
      ...prev, 
      id: videoData.id,
      url: videoData.url,
      isUploading: false, 
      uploadProgress: 100,
      indexingProgress: 0
    }));
    setMessages([{
      role: 'assistant',
      content: 'Indexing video...',
      type: 'status',
      isStreaming: true
    }]);
  };

  const handleIndexingProgress = (progress: number, step: string) => {
    setVideoState(prev => ({ ...prev, indexingProgress: progress }));
    setMessages(prev => [{
      ...prev[0],
      content: `Indexing video... ${step}`,
      isStreaming: true
    }]);
  };

  const handleIndexingComplete = () => {
    setVideoState(prev => ({ ...prev, isIndexed: true, indexingProgress: 100 }));
    // Reset to welcome message
    setMessages([{
      role: 'assistant',
      content: 'Ask me to edit your video using natural language. I have semantic understanding of your content.',
      type: 'normal'
    }]);
  };

  // ReAct workflow for reel generation
  const simulateReelGeneration = async (userPrompt: string) => {
    if (!videoState.isIndexed || !videoState.id) {
      return;
    }

    setReelState(prev => ({ ...prev, isGenerating: true, progress: 0 }));

    const steps = [
      { step: 'query_semantic_index', message: 'I\'ll start by querying your video\'s semantic index to understand the content structure and identify the most engaging moments about productivity and goal-setting.', progress: 20 },
      { step: 'extract_highlight_segment', message: 'Perfect! I\'ve selected 4 key moments: your opening question about achievements, the powerful "20% of 2025 is over" statistic, the core insight about pursuing identity goals, and your motivational call to action. Now I\'ll apply intelligent cuts using FFmpeg.', progress: 40 },
      { step: 'apply_smart_cuts', message: 'Smart cuts applied successfully! The flow moves seamlessly from your opening hook to the time urgency, then the key concept, and ending with your call to follow. Now I\'ll stitch these segments together with proper audio normalization.', progress: 60 },
      { step: 'stitch_segments', message: 'Segments stitched perfectly! The message flows from self-reflection to urgency to insight to action - creating a compelling narrative arc. Now for the final step - rendering with optimal compression for social sharing.', progress: 80 },
      { step: 'render_final_reel', message: 'I\'ve identified and extracted your most powerful moments: the opening self-reflection question, the impactful "20% of 2025 is over" statistic, your core insight about pursuing identity rather than outcome goals, and your motivational call to action. Applied intelligent cuts that create a strong narrative arc from reflection → urgency → insight → action, maximizing engagement potential for social sharing.', progress: 100 }
    ];

    for (let i = 0; i < steps.length; i++) {
      const { step, message, progress } = steps[i];
      
      // Update current step
      setReelState(prev => ({ 
        ...prev, 
        currentStep: step,
        progress 
      }));

      // Add progress message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔄 ${step}\n\n${message}`,
        type: 'progress',
        isStreaming: i < steps.length - 1
      }]);

      // Wait between steps (except for the last one)
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Simulate download URL
    const downloadUrl = `https://cdn.example.com/reels/${videoState.id}/edited-reel.mp4`;
    setReelState(prev => ({ 
      ...prev, 
      isGenerating: false, 
      downloadUrl,
      progress: 100
    }));

    // Add final message with download button
    setMessages(prev => [...prev.slice(0, -1), {
      role: 'assistant',
      content: 'I\'ve identified and extracted your most powerful moments: the opening self-reflection question, the impactful "20% of 2025 is over" statistic, your core insight about pursuing identity rather than outcome goals, and your motivational call to action. Applied intelligent cuts that create a strong narrative arc from reflection → urgency → insight → action, maximizing engagement potential for social sharing.',
      type: 'normal'
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || reelState.isGenerating || !videoState.isIndexed) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    await simulateReelGeneration(userMessage);
  };

  const handleDownload = () => {
    if (reelState.downloadUrl) {
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = reelState.downloadUrl;
      link.download = 'edited-reel.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isInputDisabled = !videoState.isIndexed || reelState.isGenerating;
  const placeholderText = !videoState.isIndexed 
    ? "Upload a video to get started..." 
    : reelState.isGenerating 
    ? "Generating reel..." 
    : "Ask me to edit your video...";

  return (
    <div className="flex h-full w-full flex-col bg-sidebar border-l border-border/80">
      <div className="flex-none p-4 border-b border-border/80">
        <h2 className="text-lg font-semibold text-primary">AI Video Editor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {!videoState.isIndexed 
            ? "Upload a video to start editing" 
            : "Ask me to edit your video using natural language. I have semantic understanding of your content."
          }
        </p>
        
        {/* Video Status Indicator */}
        {videoState.isIndexed && (
          <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>Video indexed and ready</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-4 py-3",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : message.type === 'status'
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : message.type === 'progress'
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-muted text-muted-foreground",
                  message.isStreaming && "animate-pulse"
                )}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {/* Download Button */}
          {reelState.downloadUrl && !reelState.isGenerating && (
            <div className="flex justify-start">
              <Button 
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Edited Reel
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-border/80">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText}
            disabled={isInputDisabled}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isInputDisabled}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
});

export default AIAssistant; 