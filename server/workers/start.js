#!/usr/bin/env node

const orchestratorWorker = require("./orchestrator.worker");

console.log("🤖 Starting AI Agent Workers...");
console.log("📋 Orchestrator worker started");
console.log("⏳ Waiting for tasks in queue...");

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🔄 Shutting down workers...");
  orchestratorWorker.close().then(() => {
    console.log("✅ Workers stopped");
    process.exit(0);
  });
});

// Keep process alive
process.stdin.resume();
