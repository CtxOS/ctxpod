const { callAI, SYSTEM_PROMPTS } = require("./ai");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

function runTests(workspaceId, workspacePath) {
  return new Promise((resolve) => {
    // Try different test commands
    const testCommands = [
      `cd ${workspacePath} && npm test`,
      `cd ${workspacePath} && yarn test`,
      `cd ${workspacePath} && python -m pytest`,
      `cd ${workspacePath} && go test ./...`,
      `cd ${workspacePath} && make test`
    ];

    let commandIndex = 0;

    const tryNextCommand = () => {
      if (commandIndex >= testCommands.length) {
        return resolve({
          success: false,
          error: "No test command found. Please configure tests for this project.",
          stdout: "",
          stderr: ""
        });
      }

      const cmd = testCommands[commandIndex];
      console.log(`🧪 Trying test command: ${cmd}`);

      exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
        if (err && !stderr.includes("command not found") && !stderr.includes("not recognized")) {
          // Command ran but tests failed
          return resolve({
            success: false,
            error: err.message,
            stdout,
            stderr,
            command: cmd
          });
        }

        if (!err) {
          // Tests passed
          return resolve({
            success: true,
            stdout,
            stderr,
            command: cmd
          });
        }

        // Try next command
        commandIndex++;
        tryNextCommand();
      });
    };

    tryNextCommand();
  });
}

async function generateTests(step, workspacePath, context = {}) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPTS.tester },
    { 
      role: "user", 
      content: `Generate comprehensive tests for this development step:

Step: ${step.description || step}

${context.techStack ? `Tech Stack: ${context.techStack}` : ''}
${context.existingCode ? `Code to test:\n${context.existingCode}` : ''}
${context.fileStructure ? `File Structure:\n${context.fileStructure}` : ''}

Requirements:
- Create unit tests for core functionality
- Add integration tests where appropriate
- Include edge cases and error scenarios
- Use appropriate testing framework for the tech stack
- Make tests maintainable and readable

Please provide:
1. Test file path(s)
2. Complete test implementation
3. Setup and teardown instructions
4. How to run the tests

Format as JSON:
{
  "testFiles": [
    {
      "path": "relative/path/to/test.ext",
      "content": "complete test file content",
      "framework": "jest|mocha|pytest|go test|etc",
      "description": "what these tests cover"
    }
  ],
  "setupInstructions": "how to set up testing",
  "runCommand": "command to run tests"
}` 
    }
  ];

  try {
    const response = await callAI(messages, { temperature: 0.3 });
    
    // Try to parse JSON response
    let testData;
    try {
      testData = JSON.parse(response);
    } catch (parseError) {
      // Fallback: create a single test file
      testData = {
        testFiles: [
          {
            path: "test.js",
            content: response,
            framework: "jest",
            description: "Generated tests"
          }
        ],
        setupInstructions: "Install testing dependencies",
        runCommand: "npm test"
      };
    }

    // Write test files to workspace
    const results = [];
    for (const testFile of testData.testFiles) {
      const fullPath = path.join(workspacePath, testFile.path);
      
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write test file
      await fs.writeFile(fullPath, testFile.content, 'utf8');
      
      results.push({
        path: testFile.path,
        fullPath,
        framework: testFile.framework,
        description: testFile.description,
        size: testFile.content.length
      });
    }

    return {
      testFiles: results,
      setupInstructions: testData.setupInstructions,
      runCommand: testData.runCommand,
      stepId: step.id || 'unknown'
    };
  } catch (error) {
    console.error("Test generation failed:", error.message);
    throw new Error(`Failed to generate tests: ${error.message}`);
  }
}

module.exports = { runTests, generateTests };
