# CtxPod - AI-Powered IDE Platform

A Gitpod-like development environment with autonomous AI agents that can plan, code, test, debug, and deploy automatically.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+
- OpenAI API key (for AI agents)

### Installation

1. Clone and setup:
```bash
cp .env.example .env
# Edit .env with your OpenAI key
```

2. Build workspace image:
```bash
npm run build:docker
```

3. Start the platform:
```bash
npm run docker:run
```

4. Create a workspace:
```bash
curl -X POST http://localhost:3000/workspace
```

## 📋 Architecture

- **Control Server** (Node.js) - Manages workspaces and orchestrates agents
- **code-server** - Browser-based VS Code IDE
- **Docker** - Isolated workspace containers
- **Redis + BullMQ** - Queue-based agent system
- **AI Agents** - Autonomous coding agents

## 🛠️ Development

```bash
# Start control server only
npm start

# Start with Docker Compose (includes Redis)
npm run docker:run

# Build Docker workspace image
npm run build:docker
```

## 📚 API Endpoints

- `POST /workspace` - Create new workspace
- `GET /workspaces` - List all workspaces  
- `GET /workspace/:id` - Get workspace details
- `DELETE /workspace/:id` - Stop workspace

## 🤖 AI Agents

Coming soon:
- **Planner Agent** - Breaks tasks into steps
- **Coder Agent** - Writes production code
- **Tester Agent** - Runs automated tests
- **Debugger Agent** - Fixes errors
- **Deployer Agent** - Ships to production

## 🔧 Configuration

Edit `.env` for:
- OpenAI API key
- Redis connection
- Server settings

## 📄 License

MIT
