#!/usr/bin/env node
const http = require('http');
const https = require('https');

const API_URL = process.env.CTXPOD_API || 'http://localhost:3000';
const token = process.env.CTXPOD_TOKEN;

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help') {
  console.log(`
  🚀 CtxPod CLI v1.0
  
  Usage:
    ctxpod <command> [options]
    
  Commands:
    list             List active workspaces
    create <name>    Create a new workspace
    stop <id>        Stop a workspace
    run <ws-id> <t>  Run AI task in workspace
    status <job-id>  Check AI job status
    login            Login to CtxPod
  `);
  process.exit(0);
}

async function request(path, method = 'GET', body = null) {
  const url = new URL(path, API_URL);
  const protocol = url.protocol === 'https:' ? https : http;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };

  return new Promise((resolve, reject) => {
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) reject(json.error || data);
          else resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    switch (command) {
      case 'list':
        const ws = await request('/workspaces');
        console.table(ws.map(w => ({ id: w.id, url: w.url, status: w.status })));
        break;
      case 'create':
        const newWs = await request('/workspace', 'POST', { name: args[1] });
        console.log('✅ Workspace created:', newWs);
        break;
      case 'stop':
        await request(`/workspace/${args[1]}`, 'DELETE');
        console.log('🛑 Stopped workspace:', args[1]);
        break;
      case 'run':
        const job = await request('/ai/run', 'POST', { workspaceId: args[1], task: args.slice(2).join(' ') });
        console.log('🚀 Job queued:', job.jobId);
        break;
      case 'status':
        const status = await request(`/ai/status/${args[1]}`);
        console.log('📊 Job Status:', status);
        break;
      default:
        console.log('Unknown command:', command);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
