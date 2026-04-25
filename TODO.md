# CtxPod Implementation TODO List

## 1. Local Setup & Prototype (Phase 1)
- [ ] Initialize standard project: `npm init -y`
- [ ] Install base dependencies: `npm install express`
- [ ] Write `docker/Dockerfile` using `codercom/code-server:latest` baseline.
- [ ] Establish `docker-compose.yml` to run the control server side-by-side with Docker daemon access.
- [ ] Implement `server/index.js` to dynamically spin up Docker workspace containers (`docker run`) on a random port.
- [ ] Test the `POST /workspace` endpoint and manually verify code-server opens properly in the browser.

## 2. Basic Sequential Agent System (Phase 2)
- [ ] Integrate OpenAI package or `node-fetch`/Ollama for agent responses.
- [ ] Create specialized scripts in `server/agents/`:
  - [ ] `planner.js`
  - [ ] `coder.js`
  - [ ] `tester.js`
  - [ ] `debugger.js`
  - [ ] `deployer.js`
- [ ] Build the loop logic `runAgentPipeline()` to orchestrate the sequential flow of tasks.
- [ ] Expose an API endpoint `POST /ai/run` to trigger the agent pipeline on a specific workspace.

## 3. Production Queue & Parallel Workers (Phase 3)
- [ ] Install queuing dependencies: `npm install bullmq ioredis`
- [ ] Set up a local or hosted Redis instance.
- [ ] Refactor the single-thread orchestrator into dedicated Worker instances:
  - [ ] `orchestrator.worker.js`
  - [ ] `tester.worker.js`
  - [ ] `debug.worker.js`
  - [ ] `deploy.worker.js`
- [ ] Implement retry policies and exponential backoffs within BullMQ workers.
- [ ] Update `POST /ai/run` to push tasks asynchronously to the queue instead of awaiting execution.
- [ ] Expose REST API endpoint `GET /ai/status/:id` to check job status.

## 4. Real-time Dashboard (Phase 4)
- [ ] Initialize a React frontend for the dashboard.
- [ ] Configure `socket.io` Server on the Node.js backend.
- [ ] Set up `socket.io-client` on the React frontend.
- [ ] Update background workers to emit logs through WebSocket channels instead of just `console.log`.
- [ ] Implement Dashboard UI structure: Workspace List, Job Status, Real-time Logs Console.

## 5. Kubernetes & Production Architecture (Phase 5)
- [x] Replace direct Docker executions with Kubernetes API calls (creating K8s Pods programmatically).
- [x] Determine standard Resource Limits for Pods (e.g., 1 CPU core, 1Gi Memory per workspace).
- [x] Set up Persistent Volumes (PVC) so workspace data survives Pod restarts.
- [x] Expose Node.js Control Server and React Dashboard using an Ingress setup (Nginx / Traefik).
- [x] Setup dynamic subdomain routing (wildcard certificates + Ingress routes) mapping URLs precisely to K8s Workspaces.

## 6. Security, Reliability & Polish (Phase 6)
- [x] Evaluate and apply Network Policies preventing workspaces from interacting.
- [x] Add JWT User Authentication to the Control Server API and React application.
- [x] Develop inactivity watchdogs to hibernate / auto-sleep idle pods.
- [x] Design and implement memory management strategies for AI context caching.
- [x] Set up Prometheus/Grafana or similar observability for cluster health and AI job monitoring.

## 7. Advanced Autonomous Features (Phase 7)
- [x] Implement Git Integration: Auto-create branches and commits for every AI task.
- [x] Add Parallel Agent Execution: Run UI and API generation in parallel within the orchestrator.
- [x] Build a "Run AI Task" VS Code Extension (side-panel) for the internal code-server.
- [ ] Integrate a Vector DB (e.g. Pinecone/Chroma) for long-term agent memory and code-base context.
- [ ] Implement "Accept/Reject" UI for agent-proposed code changes.
