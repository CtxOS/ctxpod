const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  lazyConnect: true,
};

// Create Redis connection
const connection = new IORedis(redisConfig);

// Create task queue
const taskQueue = new Queue("ai-tasks", { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5, // Increased from 3
    backoff: {
      type: "exponential",
      delay: 5000, // Increased from 2000 to better handle capacity issues
    },
  },
});

// Job types
const JOB_TYPES = {
  PLAN_TASK: "plan-task",
  WRITE_CODE: "write-code", 
  RUN_TESTS: "run-tests",
  DEBUG_ERROR: "debug-error",
  DEPLOY: "deploy",
  ORCHESTRATE: "orchestrate",
};

// Initialize queue with connection
const initializeQueue = async () => {
  try {
    // Only connect if we're in the 'wait' state
    if (connection.status === "wait") {
      await connection.connect();
      console.log("✅ Redis connected successfully");
    } else if (connection.status === "ready") {
      console.log("✅ Redis already connected");
    } else {
      console.log(`📡 Redis connection status: ${connection.status}`);
    }
    
    await taskQueue.waitUntilReady();
    console.log("✅ Task queue ready");
  } catch (error) {
    // Ignore the "already connecting/connected" error as it's not fatal
    if (error.message.includes("already connecting") || error.message.includes("already connected")) {
      console.log("✅ Redis connection already established");
      return;
    }
    
    console.error("❌ Failed to connect to Redis:", error.message);
    console.log("💡 Make sure Redis is running: redis-server or docker run -d -p 6379:6379 redis");
    throw error;
  }
};

// Graceful shutdown
const closeQueue = async () => {
  await taskQueue.close();
  await connection.quit();
  console.log("🔴 Queue connections closed");
};

module.exports = {
  taskQueue,
  connection,
  JOB_TYPES,
  initializeQueue,
  closeQueue,
};
