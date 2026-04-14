const { Worker } = require("bullmq");
const { connection } = require("../queue");
const { planTask } = require("../../agents/planner");
const { writeCode } = require("../../agents/coder");
const { runTests, generateTests } = require("../../agents/tester");
const { fixError, applyFixes } = require("../../agents/debugger");
const { deploy, executeDeploy } = require("../../agents/deployer");

const GitAgent = require("../../agents/git");
const { detectEnvironment } = require("../../agents/detector");

const orchestratorWorker = new Worker(
  "ai-tasks",
  async (job) => {
    const { task, workspaceId, workspacePath, context } = job.data;
    
    await job.log(`🔍 Detecting workspace environment...`);
    const techStack = await detectEnvironment(workspacePath);
    await job.log(`📦 Tech stack identified: ${techStack.languages.join(", ") || "Unknown"}`);
    
    // Enrich context
    const enrichedContext = {
      ...context,
      techStack
    };

    // Initialize Git for this task
    const git = new GitAgent(workspacePath);
    await git.init();
    const branch = await git.createBranch(workspaceId);
    
    await job.log(`🎯 Starting task: ${task}`);
    await job.log(`🌿 Working on branch: ${branch}`);
    await job.updateProgress(5);

    try {
      // Step 1: Plan the task
      await job.log("📋 Planning task...");
      const plan = await planTask(task, enrichedContext);
      await job.updateProgress(15);
      
      await job.log(`📝 Plan created with ${plan.steps.length} steps`);
      await job.log(`⏱️  Estimated time: ${plan.estimatedTime}`);
      await job.log(`🎯 Complexity: ${plan.complexity}`);

      const results = {
        plan,
        steps: [],
        tests: [],
        deployments: [],
        errors: []
      };

      // Step 2: Execute steps (supporting parallel groups)
      let i = 0;
      while (i < plan.steps.length) {
        const currentGroup = plan.steps[i].parallelGroup;
        const stepsToExecute = [];
        
        if (currentGroup) {
          // Collect all consecutive steps in the same group
          while (i < plan.steps.length && plan.steps[i].parallelGroup === currentGroup) {
            stepsToExecute.push(plan.steps[i]);
            i++;
          }
        } else {
          // Single step
          stepsToExecute.push(plan.steps[i]);
          i++;
        }

        await job.log(`\n📂 Executing ${stepsToExecute.length} step(s) ${currentGroup ? `(Group: ${currentGroup})` : ""}`);
        
        // Execute steps in this batch
        await Promise.all(stepsToExecute.map(async (step, index) => {
          const stepIdx = plan.steps.indexOf(step);
          await job.log(`🔧 Sub-step ${stepIdx + 1}: ${step.title}`);
          
          if (step.type === "coding") {
            const codeResult = await writeCode(step, workspacePath, context);
            results.steps.push(codeResult);

            if (context.autoTest !== false) {
              const testResult = await generateTests(step, workspacePath, context);
              results.tests.push(testResult);
              
              const testRun = await runTests(workspaceId, workspacePath);
              if (!testRun.success) {
                const errorAnalysis = await fixError(testRun.error, { ...context });
                if (errorAnalysis.fixes.length > 0) {
                  await applyFixes(errorAnalysis.fixes, workspacePath);
                }
              }
            }
          } else if (step.type === "testing") {
            const testResult = await generateTests(step, workspacePath, context);
            results.tests.push(testResult);
          } else if (step.type === "deploy") {
            const deployResult = await deploy(workspaceId, workspacePath, context);
            results.deployments.push(deployResult);
          }
          
          // 💾 Commit progress for this sub-step
          try {
            await git.commit(`ai: completed step ${stepIdx + 1} - ${step.title}`);
          } catch (gitErr) {}
        }));

        const progress = 15 + (i / plan.steps.length) * 60;
        await job.updateProgress(progress);
      }

      await job.updateProgress(85);

      // Step 3: Final summary
      await job.log("\n📊 Task Summary:");
      await job.log(`✅ Steps completed: ${results.steps.length}`);
      await job.log(`🧪 Tests generated: ${results.tests.length}`);
      await job.log(`🚀 Deployments: ${results.deployments.length}`);
      await job.log(`❌ Errors: ${results.errors.length}`);

      await job.updateProgress(100);

      return {
        success: true,
        results,
        summary: `Task completed with ${results.steps.length} steps, ${results.tests.length} test suites, and ${results.deployments.length} deployment configurations.`
      };

    } catch (error) {
      await job.log(`❌ Task failed: ${error.message}`);
      throw error;
    }
  },
  { 
    connection,
    concurrency: 2, // Process 2 tasks at a time
  }
);

// Handle worker events
orchestratorWorker.on("completed", (job) => {
  console.log(`✅ Orchestrator job ${job.id} completed`);
});

orchestratorWorker.on("failed", (job, err) => {
  console.error(`❌ Orchestrator job ${job.id} failed:`, err.message);
});

orchestratorWorker.on("error", (err) => {
  console.error("🔥 Orchestrator worker error:", err);
});

module.exports = orchestratorWorker;
