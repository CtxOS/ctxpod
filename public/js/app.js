document.addEventListener('DOMContentLoaded', () => {
    // API and Socket config
    const API_BASE = '';
    const socket = io();

    // DOM Elements
    const workspaceList = document.getElementById('workspace-list');
    const jobList = document.getElementById('job-list');
    const logConsole = document.getElementById('log-console');
    const statActiveWs = document.getElementById('stat-active-ws');
    const statTotalJobs = document.getElementById('stat-total-jobs');
    const statHealth = document.getElementById('stat-health');
    const btnNewWorkspace = document.getElementById('btn-new-workspace');
    const modalWorkspace = document.getElementById('modal-workspace');
    const closeModal = document.querySelector('.close-modal');
    const formNewWorkspace = document.getElementById('form-new-workspace');

    // Initialize Terminal
    const term = new Terminal({
        theme: {
            background: '#010409',
            foreground: '#e6edf3',
            cursor: '#58a6ff',
            selectionBackground: '#58a6ff'
        },
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
        convertEol: true,
        cursorBlink: true
    });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('xterm-container'));
    fitAddon.fit();

    appendLog('System: Connection established to Control Plane', 'success');

    // Initial load
    fetchWorkspaces();
    fetchJobs();
    updateHealth();

    // Event Listeners
    btnNewWorkspace.addEventListener('click', () => {
        modalWorkspace.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        modalWorkspace.style.display = 'none';
    });

    formNewWorkspace.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formNewWorkspace.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Launching...';

        try {
            const res = await fetch(`${API_BASE}/workspace`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Development Workspace' })
            });
            const data = await res.json();
            
            if (data.error) throw new Error(data.error);
            
            appendLog(`System: Workspace ${data.id} created successfully.`, 'success');
            modalWorkspace.style.display = 'none';
            fetchWorkspaces();
        } catch (err) {
            appendLog(`Error: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Launch Environment';
        }
    });

    // Socket listeners for real-time logs
    socket.on('connect', () => {
        appendLog('Socket: Connected to control plane', 'success');
    });

    socket.on('progress', (data) => {
        appendLog(`[Job ${jobIdShort(data.jobId)}] ${data.message || data.progress + '%'}`, 'info');
    });

    // Functions
    async function fetchWorkspaces() {
        try {
            const res = await fetch(`${API_BASE}/workspaces`);
            const data = await res.json();
            
            statActiveWs.textContent = data.length;
            
            if (data.length === 0) {
                workspaceList.innerHTML = '<div class="empty-state"><p>No active workspaces</p></div>';
                return;
            }

            workspaceList.innerHTML = data.map(ws => `
                <div class="card workspace-item" style="margin-bottom: 12px; padding: 16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="font-size: 14px; margin-bottom: 4px;">${ws.id}</h4>
                            <p style="font-size: 11px; font-family: monospace; color: var(--text-secondary);">${ws.url || 'Initializing...'}</p>
                        </div>
                        <div style="display:flex; gap: 8px;">
                            ${ws.url ? `<a href="${ws.url}" target="_blank" class="btn btn-primary btn-sm">Open IDE</a>` : ''}
                            <button class="btn btn-secondary btn-sm" onclick="stopWorkspace('${ws.id}')">Stop</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Failed to fetch workspaces', err);
        }
    }

    async function fetchJobs() {
        try {
            const res = await fetch(`${API_BASE}/ai/metrics`); // Using metrics endpoint for overview
            const status = await res.json();
            
            statTotalJobs.textContent = status.metrics.jobs_active + status.metrics.jobs_completed;
            
            // In a real app, you'd fetch the actual job list here
            // This is a placeholder for the jobs UI
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        }
    }

    async function updateHealth() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            const data = await res.json();
            statHealth.textContent = data.status === 'healthy' ? 'Healthy' : 'Warning';
        } catch (err) {
            statHealth.textContent = 'Offline';
        }
    }

    function appendLog(message, type = 'system') {
        const time = new Date().toLocaleTimeString();
        let prefix = '\x1b[38;5;240m[' + time + ']\x1b[0m ';
        
        switch(type) {
            case 'success': prefix += '\x1b[32m✔\x1b[0m '; break;
            case 'error': prefix += '\x1b[31m✘\x1b[0m '; break;
            case 'info': prefix += '\x1b[34mℹ\x1b[0m '; break;
        }
        
        term.writeln(prefix + message);
    }

    function jobIdShort(id) {
        return id ? id.substring(0, 8) : 'unknown';
    }

    // Global actions
    window.stopWorkspace = async (id) => {
        if (!confirm('Are you sure you want to stop this workspace?')) return;
        try {
            await fetch(`${API_BASE}/workspace/${id}`, { method: 'DELETE' });
            fetchWorkspaces();
        } catch (err) {
            alert('Failed to stop workspace');
        }
    };

    // Auto refresh
    setInterval(fetchWorkspaces, 5000);
    setInterval(updateHealth, 5000);
    window.addEventListener('resize', () => fitAddon.fit());
});
