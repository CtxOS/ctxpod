# 🚀 KhulnaSoft AI Compute Grid

A production-grade deployment pack for a hybrid GPU cluster (local + cloud) tailored for AI-native platforms and distributed pentesting pipelines.

## 🌟 Features

- **Hybrid GPU Scaling**: Routes jobs between local and cloud clusters based on availability and priority.
- **Ray-Based Compute**: Leverages [Ray](https://ray.io) for seamless distributed Python execution.
- **K8s & GPU Ready**: Includes manifests for NVIDIA Device Plugin and GPU-aware worker deployments.
- **Secure by Default**: Example security contexts and isolated runtime configurations.
- **Smart Control Plane**: FastAPI-based API with Redis job tracking and status monitoring.

## 🏗️ Repository Structure

```bash
infra/
  terraform/cloud/    # AWS/Cloud GPU provisioning
  ansible/            # Node bootstrapping (Docker, NVIDIA drivers)
  k8s/                # K8s manifests (GPU plugin, Ray cluster)
platform/
  api/                # FastAPI job submission API
  scheduler/          # Smart routing logic
runtime/
  ray/                # AI task definitions
agents/               # Example client implementations
```

## 🚀 Quick Start

### 1. Provision Cloud Infrastructure
```bash
cd infra/terraform/cloud
terraform init
terraform apply
```

### 2. Bootstrap Nodes (Local or Cloud)
```bash
cd infra/ansible
ansible-playbook -i inventory.ini gpu-node.yml
```

### 3. Deploy Kubernetes Cluster
```bash
kubectl apply -f infra/k8s/gpu/device-plugin.yaml
kubectl apply -f infra/k8s/ray/head.yaml
kubectl apply -f infra/k8s/ray/worker.yaml
```

### 4. Run the Platform
```bash
# Start API (Port 8000)
uvicorn platform.api.main:app --host 0.0.0.0

# Start Scheduler
python platform/scheduler/scheduler.py
```

### 5. Submit a Job
```bash
python agents/example_agent.py
```

## 🔐 Security & Observability

- **Sandboxing**: Pods are configured with restricted security contexts. Advanced isolation via gVisor is recommended for multi-tenant environments.
- **Monitoring**: Integration with Prometheus & Grafana is supported via Ray's native exporters.

## 🤝 Contributing

This is a production blueprint. Please adapt configurations (AMIs, regions, instance types) to your specific requirements before final deployment.
