const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();

const { taskQueue, initializeQueue, closeQueue, JOB_TYPES } = require("./queue");

const workspaceManager = require("./providers/Manager");
const { authMiddleware } = require("./middleware/auth");
const { register, login } = require("./controllers/authController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Auth Routes
app.post("/auth/register", register);
app.post("/auth/login", login);

// Store active workspaces (in production, use a database)
const activeWorkspaces = new Map();

// Inactivity Watchdog
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
setInterval(async () => {
  console.log("🔍 Running inactivity watchdog...");
  const now = Date.now();
  
  for (const [id, ws] of activeWorkspaces.entries()) {
    const lastUsed = ws.lastUsed || ws.createdAt;
    if (now - lastUsed.getTime() > INACTIVITY_TIMEOUT) {
      console.log(`😴 Hibernating idle workspace: ${id}`);
      try {
        await workspaceManager.stopWorkspace(id);
        activeWorkspaces.delete(id);
        io.emit("system-event", { message: `Workspace ${id} hibernated due to inactivity` });
      } catch (err) {
        console.error(`Failed to hibernate ${id}:`, err.message);
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on("subscribe", (jobId) => {
    socket.join(jobId);
    console.log(`👂 Client ${socket.id} subscribed to job ${jobId}`);
  });

  socket.on("heartbeat", (workspaceId) => {
    const ws = activeWorkspaces.get(workspaceId);
    if (ws) {
      ws.lastUsed = new Date();
      console.log(`💓 Heartbeat for ${workspaceId}`);
    }
  });
  
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Forward job logs to connected clients
taskQueue.on("progress", (job, progress) => {
  io.to(job.id).emit("progress", progress);
});

// Create new workspace
app.post("/workspace", authMiddleware, async (req, res) => {
  try {
    const id = "ws_" + Date.now();
    const workspace = await workspaceManager.createWorkspace(id, req.body);
    
    activeWorkspaces.set(id, {
      ...workspace,
      createdAt: new Date(),
      lastUsed: new Date(),
      ownerId: req.user.id
    });

    console.log(`🚀 Created workspace ${id} on platform: ${workspace.platform || "docker"}`);
    
    res.json(workspace);
  } catch (error) {
    console.error("Failed to create workspace:", error);
    res.status(500).json({ error: error.message });
  }
});

// List workspaces
app.get("/workspaces", authMiddleware, async (req, res) => {
  try {
    const workspaces = await workspaceManager.listWorkspaces();
    const workspaceList = workspaces.map(ws => {
      const cached = activeWorkspaces.get(ws.id);
      return { ...cached, ...ws };
    });
    
    res.json(workspaceList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workspace details
app.get("/workspace/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const workspace = activeWorkspaces.get(id);
  
  if (!workspace) {
    return res.status(404).json({ error: "Workspace not found" });
  }
  
  res.json(workspace);
});

// Stop workspace
app.delete("/workspace/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    await workspaceManager.stopWorkspace(id);
    activeWorkspaces.delete(id);
    console.log(`🛑 Stopped workspace ${id}`);
    
    res.json({ message: "Workspace stopped successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Observability Metrics
app.get("/metrics", async (req, res) => {
  try {
    const jobs = await taskQueue.getJobCounts();
    const workspaces = await workspaceManager.listWorkspaces();
    
    res.json({
      timestamp: new Date(),
      metrics: {
        active_workspaces: workspaces.length,
        jobs_waiting: jobs.waiting,
        jobs_active: jobs.active,
        jobs_completed: jobs.completed,
        jobs_failed: jobs.failed,
        cached_workspaces: activeWorkspaces.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date(),
    activeWorkspaces: activeWorkspaces.size
  });
});

// AI Task API endpoints
app.post("/ai/run", authMiddleware, async (req, res) => {
  try {
    const { task, workspaceId, context = {} } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    const workspace = activeWorkspaces.get(workspaceId);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });
    
    workspace.lastUsed = new Date();
    const workspacePath = workspace?.path || `/tmp/workspace_${workspaceId}`;
    
    const job = await taskQueue.add(JOB_TYPES.ORCHESTRATE, {
      task,
      workspaceId,
      workspacePath,
      context: {
        ...context,
        autoTest: context.autoTest !== false,
        autoDeploy: context.autoDeploy === true
      }
    });

    console.log(`🚀 AI task queued: ${job.id} for workspace ${workspaceId}`);
    
    res.json({
      jobId: job.id,
      status: "queued",
      message: "Task queued for processing"
    });
  } catch (error) {
    console.error("Failed to queue AI task:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/ai/status/:id", async (req, res) => {
  try {
    const job = await taskQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const state = await job.getState();
    const progress = job.progress;
    const logs = await job.getLogs();

    res.json({
      id: job.id,
      state,
      progress,
      data: job.data,
      logs: logs?.logs || [],
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null
    });
  } catch (error) {
    console.error("Failed to get job status:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/ai/jobs", async (req, res) => {
  try {
    const jobs = await taskQueue.getJobs(["waiting", "active", "completed", "failed"]);
    
    const jobData = await Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        state: await job.getState(),
        progress: job.progress,
        data: job.data,
        createdAt: new Date(job.timestamp),
        processedOn: job.processedOn ? new Date(job.processedOn) : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn) : null
      }))
    );

    res.json(jobData);
  } catch (error) {
    console.error("Failed to list jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize server and queue
async function startServer() {
  try {
    // Initialize Redis and queue
    await initializeQueue();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 IDE Platform Control Server running on http://localhost:${PORT}`);
      console.log(`📋 Available endpoints:`);
      console.log(`   POST /workspace - Create new workspace`);
      console.log(`   GET  /workspaces - List all workspaces`);
      console.log(`   GET  /workspace/:id - Get workspace details`);
      console.log(`   DELETE /workspace/:id - Stop workspace`);
      console.log(`   POST /ai/run - Run AI task`);
      console.log(`   GET  /ai/status/:id - Get job status`);
      console.log(`   GET  /ai/jobs - List all jobs`);
      console.log(`   GET  /health - Health check`);
      console.log(`🔌 WebSocket server ready for real-time updates`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Shutting down gracefully...");
  
  try {
    await closeQueue();
    server.close(() => {
      console.log("✅ Server stopped");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

startServer();
