const { exec } = require("child_process");

/**
 * Detector Agent: Identifies technology stack in the workspace
 */
async function detectEnvironment(workspacePath) {
  return new Promise((resolve) => {
    exec(`cd ${workspacePath} && ls -R`, (err, stdout) => {
      const files = stdout || "";
      const tech = {
        languages: [],
        frameworks: [],
        tooling: []
      };

      if (files.includes("package.json")) {
        tech.languages.push("JavaScript/TypeScript");
        tech.tooling.push("npm/pnpm/yarn");
      }
      if (files.includes("requirements.txt") || files.includes("pyproject.toml")) {
        tech.languages.push("Python");
        tech.tooling.push("pip/poetry");
      }
      if (files.includes("go.mod")) {
        tech.languages.push("Go");
      }
      if (files.includes("Cargo.toml")) {
        tech.languages.push("Rust");
      }

      if (files.includes("react")) tech.frameworks.push("React");
      if (files.includes("next.config")) tech.frameworks.push("Next.js");
      if (files.includes("express")) tech.frameworks.push("Express");
      if (files.includes("tailwind")) tech.tooling.push("TailwindCSS");

      resolve(tech);
    });
  });
}

module.exports = { detectEnvironment };
