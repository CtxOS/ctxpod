# Setup Instructions for CtxPod

## Prerequisites Installation

Since npm and Docker are not available on your system, you'll need to install them first.

### 1. Install Node.js and npm

```bash
# Using Homebrew (recommended for macOS)
brew install node

# Or download from https://nodejs.org/
```

### 2. Install Docker Desktop for Mac

Download from: https://www.docker.com/products/docker-desktop/

## After Installation

Once you have npm and Docker installed:

```bash
# Install dependencies
npm install

# Build the workspace Docker image
npm run build:docker

# Start the platform
npm run docker:run
```

## Quick Test Commands

```bash
# Verify Node.js installation
node --version
npm --version

# Verify Docker installation  
docker --version
docker-compose --version
```

## Project Structure Created

✅ **Core Infrastructure Files:**
- `package.json` - Node.js dependencies and scripts
- `docker/Dockerfile` - Workspace container with code-server
- `docker-compose.yml` - Development environment with Redis
- `server/index.js` - Main control server
- `.env.example` - Environment variables template
- `README.md` - Project documentation

## Next Steps

After installing prerequisites:

1. Copy `.env.example` to `.env` and add your OpenAI key
2. Run `npm install` to install Node.js dependencies  
3. Run `npm run build:docker` to build workspace image
4. Run `npm run docker:run` to start the platform
5. Test workspace creation with `curl -X POST http://localhost:3000/workspace`
