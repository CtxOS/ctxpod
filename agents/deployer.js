const { callAI, SYSTEM_PROMPTS } = require("./ai");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

async function deploy(workspaceId, workspacePath, context = {}) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPTS.deployer },
    { 
      role: "user", 
      content: `Create deployment configuration for this project:

Workspace: ${workspaceId}
${context.techStack ? `Tech Stack: ${context.techStack}` : ''}
${context.projectType ? `Project Type: ${context.projectType}` : ''}
${context.targetPlatform ? `Target Platform: ${context.targetPlatform}` : 'Vercel/Netlify'}

Please provide:
1. Deployment configuration files
2. Build scripts
3. Environment setup
4. Deploy commands

Format as JSON:
{
  "platform": "vercel|netlify|docker|heroku|custom",
  "configFiles": [
    {
      "path": "relative/path/to/config",
      "content": "file content",
      "purpose": "what this config does"
    }
  ],
  "buildCommand": "command to build the project",
  "deployCommand": "command to deploy",
  "environment": {
    "required": ["VAR1", "VAR2"],
    "optional": ["VAR3"]
  },
  "instructions": "step-by-step deployment guide"
}` 
    }
  ];

  try {
    const response = await callAI(messages, { temperature: 0.2 });
    
    // Try to parse JSON response
    let deployData;
    try {
      deployData = JSON.parse(response);
    } catch (parseError) {
      // Fallback: basic deployment config
      deployData = {
        platform: "vercel",
        configFiles: [
          {
            path: "vercel.json",
            content: '{"version": 2}',
            purpose: "Vercel configuration"
          }
        ],
        buildCommand: "npm run build",
        deployCommand: "vercel --prod",
        environment: { required: [], optional: [] },
        instructions: response
      };
    }

    // Write configuration files
    const results = [];
    for (const configFile of deployData.configFiles) {
      const fullPath = path.join(workspacePath, configFile.path);
      
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write config file
      await fs.writeFile(fullPath, configFile.content, 'utf8');
      
      results.push({
        path: configFile.path,
        fullPath,
        purpose: configFile.purpose,
        size: configFile.content.length
      });
    }

    return {
      platform: deployData.platform,
      configFiles: results,
      buildCommand: deployData.buildCommand,
      deployCommand: deployData.deployCommand,
      environment: deployData.environment,
      instructions: deployData.instructions,
      workspaceId
    };
  } catch (error) {
    console.error("Deployment setup failed:", error.message);
    throw new Error(`Failed to setup deployment: ${error.message}`);
  }
}

function executeDeploy(deployCommand, workspacePath) {
  return new Promise((resolve) => {
    console.log(`🚀 Executing deploy command: ${deployCommand}`);
    
    exec(
      `cd ${workspacePath} && ${deployCommand}`,
      { timeout: 120000 }, // 2 minute timeout
      (err, stdout, stderr) => {
        if (err) {
          return resolve({
            success: false,
            error: err.message,
            stdout,
            stderr,
            command: deployCommand
          });
        }

        resolve({
          success: true,
          stdout,
          stderr,
          command: deployCommand
        });
      }
    );
  });
}

module.exports = { deploy, executeDeploy };
