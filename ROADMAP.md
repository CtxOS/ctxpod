# CtxPod Development Roadmap

## Vision
A production-grade, multi-tenant cloud IDE platform with integrated AI coding agents. Combining the best elements of Gitpod, Vercel, and Cursor for a zero-cost scalable development experience.

---

## Phase 1: Core Base (Single-User IDE Platform)
**Goal:** Open browser, click "New Workspace", get an isolated code-server instance.
- Develop standard Dockerfile extending `code-server`.
- Write Node.js Control Server for basic `POST /workspace` endpoints.
- Manage Docker containers programmatically (spawning isolated dev environments).
- Deploy with local Docker Compose or a simple VPS.

## Phase 2: Sequential AI Agents MVP
**Goal:** Add autonomous agents that can plan, code, test, fix, and deploy sequentially.
- Introduce base AI module communicating with OpenAI APIs (or local models via Ollama).
- Create specialized agents:
  - **Planner Agent:** Breaks tasks into steps.
  - **Coder Agent:** Writes production-ready code to workspace.
  - **Tester Agent:** Executes testing commands inside the workspace container.
  - **Debugger Agent:** Receives error logs and issues code fixes.
  - **Deployer Agent:** Pushes final code to platforms like Vercel or Cloudflare.
- Group agents using a simple sequential Node.js orchestrator.

## Phase 3: Production-Grade Queue System (Parallel Agents)
**Goal:** Decouple agents into scalable background workers using queues.
- Deploy **Redis** for state and **BullMQ** for task queuing.
- Convert each agent into a standalone worker process (e.g., `orchestrator.worker.js`, `tester.worker.js`).
- Enable parallel agent execution (e.g., frontend, backend, test agents running simultaneously).
- Implement robust job chaining, error retries, and exponential backoff.

## Phase 4: Real-time Developer Dashboard
**Goal:** Create a DevOps control panel for the developer to oversee workspaces and AI tasks.
- Develop a React-based Dashboard.
- Incorporate WebSockets (`socket.io`) for real-time log streaming from background workers.
- Add UI features: Job List, active Job logs, Workspace management, and trigger buttons.

## Phase 5: Kubernetes & Multi-Tenancy Architecture
**Goal:** Transition to a true SaaS platform capable of sustaining multi-users with proper isolation.
- Move from raw Docker execution to **Kubernetes (K8s)**.
- Define Pod specifications for workloads with CPU and memory resource limits.
- Manage persistent state per workspace using Persistent Volumes (PVCs).
- Introduce an Ingress Controller (NGINX/Traefik) to map subdomains dynamically (e.g., `ws1.ide.com`).
- Add cost control measures (Container auto-sleep/wake strategies).

## Phase 6: Advanced SaaS Features
**Goal:** Complete the ecosystem for broader team or commercial use.
- Build long-term agent memory using Vector Databases.
- Add JWT Authentication, user management, and workspace ownership.
- Introduce visual pipeline graphs and file diff viewers (accept/reject PR-style changes) to the Dashboard.
- Setup CI/CD (GitHub Actions) for platform deployment.
