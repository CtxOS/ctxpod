c#!/bin/bash

echo "Stopping all backend processes..."

# Kill all node processes related to the project
echo "Killing node processes..."
pkill -f "node server/index.js" || true
pkill -f "node server/workers/start.js" || true
pkill -f "nodemon" || true

# Stop docker containers if any are running
echo "Stopping docker containers..."
docker-compose down || true

# Kill any other processes matching the project name or paths
# Be careful not to kill the current shell or gemini-cli
# ps aux | grep -E "CtxPod|server/index.js|server/workers" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

echo "Cleaning up docker workspaces..."
docker ps -a --filter "name=ws_" --format "{{.ID}}" | xargs docker stop 2>/dev/null || true
docker ps -a --filter "name=ws_" --format "{{.ID}}" | xargs docker rm 2>/dev/null || true

echo "Backend processes removed."
