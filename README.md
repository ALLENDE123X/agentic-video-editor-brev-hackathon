# Aginno Video Editor

An AI-powered video editing platform that combines intelligent video indexing with natural language video editing capabilities. Upload a video, let AI understand its content, then create highlight reels using simple prompts like "Create an inspiring 30-second reel showcasing the best moments."

## How It Works

Aginno is built on a sophisticated two-stage architecture that separates video understanding from video creation:

### Stage 1: Intelligent Video Indexing Pipeline

When you upload a video, Aginno automatically analyzes and indexes its content:

1. **Video Upload & Storage** - Videos are uploaded to Cloudflare R2 for scalable storage
2. **Frame Extraction** - FFmpeg extracts frames at configurable intervals (default: 1 frame/second)
3. **Audio Transcription** - OpenAI Whisper API generates timestamped transcripts
4. **Visual Analysis** - Google Vision API analyzes frames for objects, faces, emotions, and context
5. **Semantic Storage** - All metadata is stored in PostgreSQL with pgvector for semantic search

### Stage 2: AI Agent Video Editing

Once indexed, you can edit videos using natural language:

1. **Natural Language Input** - "Create a short, inspiring highlight reel"
2. **LangGraph DAG Orchestration** - AI workflow orchestrated using LangGraph's directed acyclic graph (DAG) architecture for reliable, state-managed tool execution
3. **GPT-4o Planning** - AI agent analyzes requirements and creates execution plan
4. **Tool-Based Execution** - Agent uses specialized tools in coordinated workflows:
   - `query_semantic_index` - Find relevant segments
   - `extract_highlight_segment` - Extract key moments
   - `apply_smart_cuts` - Optimize timing and pacing
   - `stitch_segments` - Combine clips with transitions
   - `render_final_reel` - Generate final output
5. **Automatic Rendering** - FFmpeg creates the final video with watermarks, fades, and effects

## LangGraph DAG Tool Orchestration

Aginno leverages **LangGraph** to orchestrate complex AI agent workflows using a directed acyclic graph (DAG) architecture. This provides several key advantages:

### Why LangGraph?
- **Reliable Execution** - State management ensures consistent workflow execution even with failures
- **Tool Coordination** - Multiple AI tools work together in coordinated, dependency-aware sequences
- **Error Recovery** - Built-in retry mechanisms and error handling for robust video processing
- **Scalable Workflows** - Complex editing operations broken down into manageable, parallelizable steps

### Workflow Architecture
```
Natural Language Input
        ↓
    GPT-4o Planning
        ↓
   LangGraph DAG
   ┌─────────────┐
   │ Query Index │ ──┐
   └─────────────┘   │
           ↓         │
   ┌─────────────┐   │
   │ Extract     │ ←─┘
   │ Highlights  │
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Apply Smart │
   │ Cuts        │
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Stitch      │
   │ Segments    │
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Final       │
   │ Render      │
   └─────────────┘
```

### Benefits for Video Editing
- **Conditional Logic** - Workflows adapt based on video content and user requirements
- **Parallel Processing** - Multiple video segments can be processed simultaneously
- **State Persistence** - Long-running video processing jobs maintain state across interruptions
- **Audit Trail** - Complete visibility into each step of the editing process

## Features

- **AI-Powered Editing** - Natural language video editing with GPT-4o
- **Timeline Editor** - Professional drag-and-drop video editing interface
- **Semantic Search** - Find moments by meaning, not just keywords
- **Auto Transcription** - Automatic speech-to-text with OpenAI Whisper
- **Visual Effects** - Transitions, filters, watermarks, and fade effects
- **Multi-track Support** - Video and audio tracks
- **Cloud Storage** - Cloudflare R2 integration for scalability
- **Real-time Progress** - Live updates during processing

## Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** for development and building
- **Tailwind CSS** + Radix UI for styling
- **Remotion** for video preview and rendering
- **Zustand** for state management

### Backend
- **Node.js** + Express + TypeScript
- **LangGraph** for DAG-based AI agent orchestration
- **PostgreSQL** with pgvector extension
- **Cloudflare R2** for video storage
- **FFmpeg** for video processing
- **OpenAI APIs** (Whisper, GPT-4o)
- **Google Cloud Vision** for frame analysis

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ with pgvector extension
- **FFmpeg** 4.0+ installed and in PATH
- **Cloudflare R2** account
- **OpenAI API** key
- **Google Cloud** account (optional, for enhanced frame analysis)

### 1. Clone and Install

```bash
git clone <repository-url>
cd aginno-video-editor-original/aginno-video-editor
npm install
cd api
npm install
cd ..
```

### 2. Database Setup

**Option A: Using Docker (Recommended)**
```bash
docker compose up -d
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL with pgvector
./scripts/setup_local_db.sh

# Create tables
psql -d aginno_video_editor -U aginno_user -f db/bootstrap.sql
```

### 3. Environment Configuration

**API Configuration** (`api/.env`):
```bash
# Copy template
cp api/.env.example api/.env

# Required variables:
OPENAI_API_KEY=sk-proj-your_openai_api_key
R2_ACCOUNT_ID=your_cloudflare_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=videos
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL_BASE=https://pub-your_domain.r2.dev
DATABASE_URL=postgresql://aginno_user:password@localhost:5432/aginno_video_editor

# Optional:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend API
cd api
npm run dev

# Terminal 2: Frontend
cd .. # back to aginno-video-editor directory
npm run dev
```

Access the application at `http://localhost:5173`

## Project Structure

```
aginno-video-editor/
├── api/                          # Backend API
│   ├── src/
│   │   ├── controllers/          # Route handlers
│   │   ├── services/            # Business logic
│   │   │   ├── agent/           # AI agent tools
│   │   │   ├── indexing/        # Video analysis
│   │   │   └── storage/         # Cloud storage
│   │   ├── utils/               # Utilities (FFmpeg, etc.)
│   │   └── routes/              # API routes
│   └── tmp/                     # Temporary processing files
├── src/                         # Frontend React app
│   ├── features/editor/         # Main video editor
│   ├── components/              # Reusable UI components
│   └── lib/                     # Client utilities
├── db/                          # Database schemas
└── scripts/                     # Setup and utility scripts
```

## Video File Size Limits

**Current Limit: 100MB** (for demo purposes)

The file size limit is configured in two places:

### Backend Limit
**File:** `api/src/controllers/indexing.controller.ts`
```typescript
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB - Change this value
  },
  // ...
});
```

### Frontend Limit
**File:** `src/features/editor/scene/empty.tsx`
```typescript
const dropzoneOptions = {
  maxSize: 100 * 1024 * 1024, // 100MB - Change this value
  // ...
};
```

### To Increase the Limit:
1. Update both values to your desired size (e.g., `500 * 1024 * 1024` for 500MB)
2. Restart both frontend and backend servers
3. Consider your server's memory and storage capacity
4. For production, also update your cloud storage limits

## Testing & Development

### Run Tests
```bash
# Test database connection
npm run test:db

# Test end-to-end workflow
cd api && npm run test-e2e

# Test specific components
cd api && npm run test
```

### Debug Tools
```bash
# Debug workflow components
curl -X POST http://localhost:3001/api/debug/workflow \
  -H "Content-Type: application/json" \
  -d '{"videoId": "test", "step": "all"}'

# Monitor logs
tail -f api/logs/combined.log
```

## Configuration Options

### Video Processing Settings
- **Frame extraction rate**: Configurable in upload options (default: 1 fps)
- **Video quality**: Adjustable in render settings
- **Transcription language**: Auto-detected or manually set
- **AI analysis depth**: Toggle frame analysis, transcription, etc.

### Feature Flags
The system includes feature flags for safe deployment:
```typescript
// api/src/config/feature-flags.ts
ENABLE_FADE_EFFECTS: true,
ENABLE_WATERMARK_FADE_COMBO: true,
EMERGENCY_DISABLE_ALL_EFFECTS: false,
```

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
lsof -ti:3001 | xargs kill -9  # Kill backend
lsof -ti:5173 | xargs kill -9  # Kill frontend
```

**Database connection issues:**
```bash
# Check PostgreSQL status
pg_isready -d aginno_video_editor -h localhost -p 5432

# Test connection
npm run test:db
```

**FFmpeg not found:**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

**R2 upload errors:**
- Verify R2 credentials in `.env`
- Check bucket permissions
- Ensure `R2_PUBLIC_URL_BASE` is configured

### Performance Optimization
- **Large videos**: Consider implementing chunked uploads
- **Memory usage**: Monitor during processing, increase server RAM if needed
- **Storage**: Implement automatic cleanup of temporary files
- **Database**: Regular maintenance and index optimization