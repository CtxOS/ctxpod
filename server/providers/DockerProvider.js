const { exec } = require("child_process");
const BaseProvider = require("./BaseProvider");

class DockerProvider extends BaseProvider {
  constructor() {
    super();
    this.dockerCmd = process.env.DOCKER_PATH || "docker";
  }

  async createWorkspace(id, options = {}) {
    return new Promise((resolve, reject) => {
      const image = options.image || "ide-workspace";
      const port = options.port || 8080;

      const cmd = `
      ${this.dockerCmd} run -d \\
        -p 0:8080 \\
        --name ${id} \\
        -v workspace_${id}:/workspace \\
        ${image}
      `;

      exec(cmd, (err, stdout) => {
        if (err) return reject(err);

        exec(`${this.dockerCmd} port ${id} 8080`, (err2, portOut) => {
          if (err2) return reject(err2);

          const assignedPort = portOut.split(":")[1].trim();
          resolve({
            id,
            port: assignedPort,
            url: `http://localhost:${assignedPort}`,
            status: "running"
          });
        });
      });
    });
  }

  async stopWorkspace(id) {
    return new Promise((resolve, reject) => {
      exec(`${this.dockerCmd} stop ${id} && ${this.dockerCmd} rm ${id}`, (err) => {
        if (err) return reject(err);
        resolve({ message: "Workspace stopped successfully" });
      });
    });
  }

  async listWorkspaces() {
    return new Promise((resolve, reject) => {
      exec(`${this.dockerCmd} ps --filter "name=ws_" --format "{{.Names}}"`, (err, out) => {
        if (err) return reject(err);
        const names = out.split("\n").filter(n => n.trim());
        resolve(names.map(name => ({ id: name, status: "running" })));
      });
    });
  }
}

module.exports = DockerProvider;
