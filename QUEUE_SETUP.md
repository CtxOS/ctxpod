# Redis + BullMQ Queue System Setup

## 🚀 Quick Start

Since Docker Desktop isn't compatible with your macOS version, here are alternative Redis setup options:

### Option 1: Homebrew Redis (Recommended)
```bash
# Install Redis
brew install redis

# Start Redis server
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Option 2: Manual Redis Install
```bash
# Download and compile Redis
curl -O http://download.redis.io/redis-stable.tar.gz
tar xzvf redis-stable.tar.gz
cd redis-stable
make
sudo make install

# Start Redis server
redis-server
```

### Option 3: Use Redis Cloud (Free tier)
1. Sign up at https://redis.com/try-free/
2. Create a free Redis database
3. Get connection string and update `.env`

## 🔧 Configuration

Update your `.env` file:
```bash
# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# OpenAI API key (required for AI agents)
OPENAI_KEY=your_openai_api_key_here
```

## 🏃‍♂️ Running the System

### Terminal 1: Start Control Server
```bash
npm start
```

### Terminal 2: Start AI Workers
```bash
npm run workers
```

## 🧪 Testing the Queue System

### 1. Test AI Task
```bash
curl -X POST http://localhost:3000/ai/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create a simple Express.js API with user authentication",
    "workspaceId": "test_workspace",
    "context": {
      "techStack": "Node.js, Express, MongoDB",
      "autoTest": true,
      "autoDeploy": false
    }
  }'
```

### 2. Check Job Status
```bash
curl http://localhost:3000/ai/status/JOB_ID
```

### 3. List All Jobs
```bash
curl http://localhost:3000/ai/jobs
```

## 📊 Queue Features Implemented

✅ **Production-Grade Architecture**
- Redis-based job queue with BullMQ
- Automatic retry with exponential backoff
- Job priorities and concurrency control
- Graceful shutdown and error handling

✅ **AI Agent System**
- Planner Agent - Breaks tasks into steps
- Coder Agent - Writes production code
- Tester Agent - Generates and runs tests
- Debugger Agent - Fixes errors automatically
- Deployer Agent - Creates deployment configs

✅ **Real-time Updates**
- WebSocket integration for live progress
- Job logging and status tracking
- Concurrent task processing

✅ **API Endpoints**
- `POST /ai/run` - Queue new AI task
- `GET /ai/status/:id` - Get job status and logs
- `GET /ai/jobs` - List all jobs
- WebSocket for real-time updates

## 🔍 Monitoring

The system provides:
- Job progress tracking (0-100%)
- Detailed logging for each step
- Error analysis and automatic fixes
- Success/failure statistics

## 🚨 Troubleshooting

**Redis connection failed:**
- Ensure Redis server is running
- Check REDIS_HOST/PORT in `.env`
- Verify firewall settings

**OpenAI API errors:**
- Check OPENAI_KEY in `.env`
- Verify API key credits
- Check rate limits

**Workers not processing:**
- Ensure worker process is running
- Check Redis connection
- Review worker logs

## 🎯 Next Steps

The queue system is ready! Next high-priority task:
**Build real-time dashboard with React + TypeScript** for job tracking and logs.
