#!/bin/bash

# Get total memory in MB
if [[ "$OSTYPE" == "darwin"* ]]; then
    TOTAL_MEM=$(sysctl hw.memsize | awk '{print $2}')
    TOTAL_MEM_MB=$((TOTAL_MEM / 1024 / 1024))
else
    TOTAL_MEM_MB=$(free -m | grep Mem: | awk '{print $2}')
fi

LIMIT=$((TOTAL_MEM_MB * 60 / 100))

echo "🚀 Memory Watchdog Started"
echo "   Total Memory: ${TOTAL_MEM_MB}MB"
echo "   Kill Limit (60%): ${LIMIT}MB"

while true; do
  # Get all node processes
  pgrep -f "node" | while read pid; do
    if [ -z "$pid" ]; then continue; fi
    
    # Get memory usage of PID in MB
    if [[ "$OSTYPE" == "darwin"* ]]; then
        RSS=$(ps -o rss= -p $pid 2>/dev/null || echo 0)
        RSS_MB=$((RSS / 1024))
    else
        RSS_MB=$(ps -o rss= -p $pid 2>/dev/null | awk '{print int($1/1024)}')
    fi

    if [ ! -z "$RSS_MB" ] && [ "$RSS_MB" -gt "$LIMIT" ]; then
        echo "🚨 [WATCHDOG] Process $pid using ${RSS_MB}MB exceeds limit ${LIMIT}MB. Killing..."
        kill -9 $pid 2>/dev/null
    fi
  done
  sleep 10
done
