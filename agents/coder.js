const { callAI, SYSTEM_PROMPTS } = require("./ai");
const fs = require("fs").promises;
const path = require("path");

async function writeCode(step, workspacePath, context = {}) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPTS.coder },
    { 
      role: "user", 
      content: `Write code for this development step:

Step: ${step.description || step}

${context.techStack ? `Tech Stack: ${context.techStack}` : ''}
${context.existingCode ? `Existing Code Context:\n${context.existingCode}` : ''}
${context.fileStructure ? `File Structure:\n${context.fileStructure}` : ''}

Requirements:
- Write production-ready code
- Include proper error handling
- Add comments for complex logic
- Follow best practices and conventions
- Make code testable and maintainable

Please provide:
1. File path(s) to create/modify
2. Complete code implementation
3. Brief explanation of changes

Format as JSON:
{
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "complete file content",
      "explanation": "what this file does"
    }
  ],
  "summary": "brief summary of changes made"
}` 
    }
  ];

  try {
    const response = await callAI(messages, { temperature: 0.2 });
    
    // Try to parse JSON response
    let filesData;
    try {
      filesData = JSON.parse(response);
    } catch (parseError) {
      // Fallback: create a single file with the response
      filesData = {
        files: [
          {
            path: "generated.js",
            content: response,
            explanation: "Generated code from AI"
          }
        ],
        summary: "Generated code implementation"
      };
    }

    // Write files to workspace
    const results = [];
    for (const file of filesData.files) {
      const fullPath = path.join(workspacePath, file.path);
      
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, file.content, 'utf8');
      
      results.push({
        path: file.path,
        fullPath,
        explanation: file.explanation,
        size: file.content.length
      });
    }

    return {
      files: results,
      summary: filesData.summary,
      stepId: step.id || 'unknown'
    };
  } catch (error) {
    console.error("Code generation failed:", error.message);
    throw new Error(`Failed to write code: ${error.message}`);
  }
}

module.exports = { writeCode };
