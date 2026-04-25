const DockerProvider = require("./DockerProvider");
const K8sProvider = require("./K8sProvider");

class WorkspaceManager {
  constructor() {
    const platform = process.env.PLATFORM || "docker";
    this.provider = platform === "kubernetes" ? new K8sProvider() : new DockerProvider();
    
    console.log(`🏗️  Workspace Manager initialized with platform: ${platform}`);
  }

  async createWorkspace(id, options) {
    return this.provider.createWorkspace(id, options);
  }

  async stopWorkspace(id) {
    return this.provider.stopWorkspace(id);
  }

  async listWorkspaces() {
    return this.provider.listWorkspaces();
  }

  async getWorkspaceDetails(id) {
    return this.provider.getWorkspaceDetails(id);
  }
}

// Singleton
module.exports = new WorkspaceManager();
