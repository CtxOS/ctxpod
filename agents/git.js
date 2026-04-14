const { exec } = require("child_process");

/**
 * Git Agent for managing workspace repository state
 */
class GitAgent {
  constructor(workspacePath) {
    this.path = workspacePath;
  }

  async execute(cmd) {
    return new Promise((resolve, reject) => {
      exec(`cd ${this.path} && git ${cmd}`, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout.trim());
      });
    });
  }

  async init() {
    try {
      await this.execute("init");
      await this.execute("config user.name 'CtxPod Agent'");
      await this.execute("config user.email 'agent@ctxpod.com'");
      await this.execute("add .");
      await this.execute("commit -m 'Initial commit by CtxPod Agent'");
      return true;
    } catch (e) {
      console.warn("Git init failed (likely already initialized):", e.message);
      return false;
    }
  }

  async createBranch(name) {
    const branchName = `ai-task-${name}-${Date.now()}`;
    await this.execute(`checkout -b ${branchName}`);
    return branchName;
  }

  async commit(message) {
    await this.execute("add .");
    return this.execute(`commit -m "${message}"`);
  }

  async push(remote = "origin", branch = "main") {
    return this.execute(`push ${remote} ${branch}`);
  }
}

module.exports = GitAgent;
