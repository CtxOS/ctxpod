const { callAI, SYSTEM_PROMPTS } = require("./ai");

async function planTask(task, context = {}) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPTS.planner },
    { 
      role: "user", 
      content: `Break this development task into actionable steps:

Task: ${task}

${context.projectType ? `Project Type: ${context.projectType}` : ''}
${context.techStack ? `Tech Stack: ${context.techStack}` : ''}
${context.requirements ? `Requirements: ${context.requirements}` : ''}

Please provide:
1. Clear numbered steps
2. Implementation order
3. Dependencies between steps
4. Testing requirements
5. Deployment considerations

Format as JSON:
{
  "steps": [
    {
      "id": 1,
      "title": "Step title",
      "description": "Detailed description",
      "type": "coding|testing|setup|deploy",
      "parallelGroup": "string (optional: steps with same group name run in parallel)",
      "dependencies": []
    }
  ],
  "estimatedTime": "X hours",
  "complexity": "low|medium|high"
}` 
    }
  ];

  try {
    const response = await callAI(messages, { temperature: 0.3 });
    
    // Try to parse JSON response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      // Fallback: return plain text if JSON parsing fails
      return {
        steps: response.split('\n').map((line, index) => ({
          id: index + 1,
          title: line.trim(),
          description: line.trim(),
          type: "coding",
          dependencies: []
        })),
        estimatedTime: "Unknown",
        complexity: "medium"
      };
    }
  } catch (error) {
    console.error("Planning failed:", error.message);
    throw new Error(`Failed to plan task: ${error.message}`);
  }
}

module.exports = { planTask };
