// Use native fetch (Node 18+) or global fetch
// const fetch = require("node-fetch"); 


// Base AI helper that supports both OpenAI and Gemini (via bridge/direct)
// Includes retry logic for capacity-related 503 errors
const callAI = async (messages, options = {}) => {
  const apiKey = process.env.OPENAI_KEY || process.env.GEMINI_KEY;
  const endpoint = options.endpoint || (process.env.GEMINI_KEY ? "https://cloudcode-pa.googleapis.com/v1/projects/YOUR_PROJECT/locations/global/publishers/google/models/gemini-3-flash-agent:streamGenerateContent" : "https://api.openai.com/v1/chat/completions");
  const model = options.model || (process.env.GEMINI_KEY ? "gemini-3-flash-agent" : "gpt-4o-mini");
  
  if (!apiKey && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("API key (OPENAI_KEY or GEMINI_KEY) is required");
  }

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      
      const isGemini = model.includes("gemini");
      const url = isGemini ? "https://cloudcode-pa.googleapis.com/v1/models/gemini-3-flash-agent" : "https://api.openai.com/v1/chat/completions";
      
      const headers = {
        "Content-Type": "application/json",
      };

      if (!isGemini) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      } else {
        // For Gemini/Google Cloud, usually requires OAuth or a different header
        // Assuming user has a way to auth through process.env or similar
        if (process.env.GEMINI_KEY) {
          headers["X-Goog-Api-Key"] = process.env.GEMINI_KEY;
        }
      }

      const body = !isGemini ? {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        ...options,
      } : {
        // Simplified Gemini body format - adjust based on actual implementation needs
        contents: messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        const retryDelayStr = errorData.error?.details?.find(d => d.retryDelay)?.retryDelay || "5s";
        // parse something like "50s" to ms
        const delayMs = parseInt(retryDelayStr.replace("s", "")) * 1000 || 5000;
        
        console.warn(`⚠️ MODEL_CAPACITY_EXHAUSTED (503). Retrying in ${delayMs}ms (Attempt ${attempts}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      if (isGemini) {
        // Format of Gemini response depends on endpoint
        return data.candidates?.[0]?.content?.parts?.[0]?.text || data.message || JSON.stringify(data);
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      if (attempts >= maxAttempts) {
        console.error("AI API call failed after multiple attempts:", error.message);
        throw error;
      }
      // For other errors, wait a bit and retry
      const backoff = Math.pow(2, attempts) * 1000;
      console.warn(`⚠️ AI call error: ${error.message}. Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
};


// System prompts for different agent types
const SYSTEM_PROMPTS = {
  planner: `You are a senior software architect and project manager. 
Break down complex development tasks into clear, sequential steps.
Focus on: requirements, architecture, implementation order, testing, and deployment.
Return numbered steps with clear action items.`,

  coder: `You are an expert full-stack developer. 
Write production-ready, clean, and well-documented code.
Follow best practices: error handling, security, performance.
Include comments and explain complex logic.`,

  tester: `You are a QA engineer focused on automated testing.
Create comprehensive test cases that cover edge cases.
Focus on unit tests, integration tests, and user scenarios.`,

  debugger: `You are a senior debugging specialist.
Analyze error messages and stack traces to identify root causes.
Provide clear fixes with explanations of what went wrong.`,

  deployer: `You are a DevOps engineer specializing in modern deployment.
Create deployment scripts and configurations.
Focus on: CI/CD, containerization, environment management, and monitoring.`,
};

module.exports = {
  callAI,
  SYSTEM_PROMPTS,
};
