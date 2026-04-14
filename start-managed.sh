#!/bin/bash

# 1. Cleanup all previous processes
echo "Cleaning up all backend processes..."
bash cleanup.sh

# 2. Start the memory monitor in the background
echo "Starting memory monitor (60% limit)..."
bash monitor.sh &
MONITOR_PID=$!
echo "Monitor PID: $MONITOR_PID"

# 3. Start the load-balanced server
echo "Starting load-balanced server..."
node cluster.js

# Note: if cluster.js stops, we should also stop monitor
kill $MONITOR_PID
