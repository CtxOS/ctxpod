const k8s = require("@kubernetes/client-node");
const BaseProvider = require("./BaseProvider");

class K8sProvider extends BaseProvider {
  constructor() {
    super();
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    this.namespace = process.env.K8S_NAMESPACE || "default";
  }

  async createWorkspace(id, options = {}) {
    const image = options.image || "ide-workspace:latest";
    const storageSize = options.storage || "2Gi";
    
    // 1. Create PVC for persistence
    const pvc = {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: {
        name: `pvc-${id}`,
        labels: { app: "ctxpod-workspace", "workspace-id": id }
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        resources: {
          requests: { storage: storageSize }
        }
      }
    };

    try {
      console.log(`📦 Creating PVC: pvc-${id}...`);
      await this.coreApi.createNamespacedPersistentVolumeClaim(this.namespace, pvc);
      
      // 2. Create Pod
      const pod = {
        apiVersion: "v1",
        kind: "Pod",
        metadata: {
          name: id,
          labels: { app: "ctxpod-workspace", "workspace-id": id }
        },
        spec: {
          containers: [{
            name: "ide",
            image: image,
            ports: [{ containerPort: 8080 }],
            resources: {
              limits: { cpu: "1", memory: "1Gi" },
              requests: { cpu: "500m", memory: "512Mi" }
            },
            volumeMounts: [{
              name: "workspace-data",
              mountPath: "/workspace"
            }]
          }],
          volumes: [{
            name: "workspace-data",
            persistentVolumeClaim: { claimName: `pvc-${id}` }
          }]
        }
      };

      console.log(`🚀 Creating Pod: ${id}...`);
      await this.coreApi.createNamespacedPod(this.namespace, pod);
      
      // 3. Create Service
      const service = {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: `svc-${id}`,
          labels: { app: "ctxpod-workspace", "workspace-id": id }
        },
        spec: {
          selector: { "workspace-id": id },
          ports: [{ port: 80, targetPort: 8080 }]
        }
      };

      console.log(`🔌 Creating Service: svc-${id}...`);
      await this.coreApi.createNamespacedService(this.namespace, service);

      // 4. Update Ingress for dynamic routing
      try {
        await this.updateIngressRule(id, true);
      } catch (ingErr) {
        console.warn(`⚠️ Ingress update failed (optional): ${ingErr.message}`);
      }

      return {
        id,
        status: "provisioning",
        url: `https://${id}.ide.ctxpod.com`,
        platform: "kubernetes",
        storage: storageSize,
        service: `svc-${id}`
      };
    } catch (err) {
      console.error("K8s creation failed:", err.body || err);
      // Cleanup on failure
      try { await this.coreApi.deleteNamespacedPersistentVolumeClaim(`pvc-${id}`, this.namespace); } catch(e) {}
      try { await this.coreApi.deleteNamespacedPod(id, this.namespace); } catch(e) {}
      try { await this.coreApi.deleteNamespacedService(`svc-${id}`, this.namespace); } catch(e) {}
      throw err;
    }
  }

  async stopWorkspace(id) {
    try {
      console.log(`🛑 Deleting Pod: ${id}...`);
      await this.coreApi.deleteNamespacedPod(id, this.namespace);
      
      console.log(`🧹 Deleting PVC: pvc-${id}...`);
      await this.coreApi.deleteNamespacedPersistentVolumeClaim(`pvc-${id}`, this.namespace);

      console.log(`🔌 Deleting Service: svc-${id}...`);
      try { await this.coreApi.deleteNamespacedService(`svc-${id}`, this.namespace); } catch(e) {}

      console.log(`🌐 Removing Ingress rule for ${id}...`);
      try { await this.updateIngressRule(id, false); } catch(e) {}
      
      return { message: "Workspace and associated resources deleted" };
    } catch (err) {
      console.error("K8s deletion failed:", err.body || err);
      throw err;
    }
  }

  async updateIngressRule(id, add = true) {
    const ingressName = "ctxpod-workspaces";
    const host = `${id}.ide.ctxpod.com`;

    try {
      const res = await this.networkingApi.readNamespacedIngress(ingressName, this.namespace);
      const ingress = res.body;

      if (add) {
        // Add new rule
        const newRule = {
          host: host,
          http: {
            paths: [{
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: `svc-${id}`,
                  port: { number: 80 }
                }
              }
            }]
          }
        };
        ingress.spec.rules.push(newRule);
      } else {
        // Remove rule
        ingress.spec.rules = ingress.spec.rules.filter(rule => rule.host !== host);
      }

      await this.networkingApi.replaceNamespacedIngress(ingressName, this.namespace, ingress);
      console.log(`✅ Ingress ${ingressName} updated for ${host}`);
    } catch (err) {
      if (err.response?.statusCode === 404 && add) {
        // Create initial ingress if not exists
        console.log(`📝 Creating initial Ingress ${ingressName}...`);
        const newIngress = {
          apiVersion: "networking.k8s.io/v1",
          kind: "Ingress",
          metadata: {
            name: ingressName,
            annotations: { "kubernetes.io/ingress.class": "nginx" }
          },
          spec: {
            rules: [{
              host: host,
              http: {
                paths: [{
                  path: "/",
                  pathType: "Prefix",
                  backend: {
                    service: { name: `svc-${id}`, port: { number: 80 } }
                  }
                }]
              }
            }]
          }
        };
        await this.networkingApi.createNamespacedIngress(this.namespace, newIngress);
      } else {
        throw err;
      }
    }
  }


  async listWorkspaces() {
    try {
      const res = await this.coreApi.listNamespacedPod(
        this.namespace, 
        null, null, null, null, 
        "app=ctxpod-workspace"
      );
      return res.body.items.map(pod => ({
        id: pod.metadata.name,
        status: pod.status.phase,
        ip: pod.status.podIP
      }));
    } catch (err) {
      console.error("K8s listing failed:", err.body || err);
      throw err;
    }
  }
}

module.exports = K8sProvider;
