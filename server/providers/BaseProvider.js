/**
 * Base class for Workspace Providers (Docker, Kubernetes)
 */
class BaseProvider {
  async createWorkspace(id, options = {}) {
    throw new Error("createWorkspace not implemented");
  }

  async stopWorkspace(id) {
    throw new Error("stopWorkspace not implemented");
  }

  async listWorkspaces() {
    throw new Error("listWorkspaces not implemented");
  }

  async getWorkspaceDetails(id) {
    throw new Error("getWorkspaceDetails not implemented");
  }
}

module.exports = BaseProvider;
