const { callAI, SYSTEM_PROMPTS } = require("./ai");
const fs = require("fs").promises;
const path = require("path");

async function fixError(errorLog, context = {}) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPTS.debugger },
    { 
      role: "user", 
      content: `Analyze and fix this error:

Error Log:
${errorLog}

${context.codeContext ? `Code Context:\n${context.codeContext}` : ''}
${context.techStack ? `Tech Stack: ${context.techStack}` : ''}
${context.fileStructure ? `File Structure:\n${context.fileStructure}` : ''}

Please provide:
1. Root cause analysis
2. Step-by-step fix
3. Files to modify
4. Prevention measures

Format as JSON:
{
  "rootCause": "explanation of what went wrong",
  "fixes": [
    {
      "filePath": "relative/path/to/file.ext",
      "issue": "what's wrong in this file",
      "fix": "how to fix it",
      "code": "corrected code snippet"
    }
  ],
  "prevention": "how to avoid this in the future",
  "confidence": "high|medium|low"
}` 
    }
  ];

  try {
    const response = await callAI(messages, { temperature: 0.2 });
    
    // Try to parse JSON response
    let fixData;
    try {
      fixData = JSON.parse(response);
    } catch (parseError) {
      // Fallback: return plain text analysis
      fixData = {
        rootCause: response.substring(0, 200),
        fixes: [],
        prevention: "Review error patterns",
        confidence: "medium"
      };
    }

    return fixData;
  } catch (error) {
    console.error("Error analysis failed:", error.message);
    throw new Error(`Failed to analyze error: ${error.message}`);
  }
}

async function applyFixes(fixes, workspacePath) {
  const results = [];
  
  for (const fix of fixes) {
    try {
      const fullPath = path.join(workspacePath, fix.filePath);
      
      // Read existing file
      let existingContent = '';
      try {
        existingContent = await fs.readFile(fullPath, 'utf8');
      } catch (err) {
        // File doesn't exist, create it
        existingContent = '';
      }

      // Apply fix (for now, replace entire content with fix.code)
      // In a more sophisticated version, we'd do targeted replacements
      if (fix.code) {
        await fs.writeFile(fullPath, fix.code, 'utf8');
      }

      results.push({
        filePath: fix.filePath,
        fullPath,
        issue: fix.issue,
        success: true,
        backupPath: `${fullPath}.backup.${Date.now()}`
      });

      // Create backup of original
      if (existingContent) {
        await fs.writeFile(`${fullPath}.backup.${Date.now()}`, existingContent, 'utf8');
      }

    } catch (error) {
      results.push({
        filePath: fix.filePath,
        issue: fix.issue,
        success: false,
        error: error.message
      });
    }
  }

  return {
    fixes: results,
    successCount: results.filter(r => r.success).length,
    totalCount: results.length
  };
}

module.exports = { fixError, applyFixes };
