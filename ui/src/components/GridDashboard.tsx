import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Activity, Server, Cpu, Database, 
  TrendingUp, Shield, Zap, Info, Brain,
  Gavel, History, LayoutGrid, Users
} from 'lucide-react';
import GPUHeatmap from './GPUHeatmap';
import CostTimeline from './CostTimeline';
import JobGantt from './JobGantt';
import NodeDrillDown from './NodeDrillDown';
import MemoryGraph from './MemoryGraph';
import AdaptivePanel from './AdaptivePanel';
import DecisionTimeline from './DecisionTimeline';
import PolicyGuardStatus from './PolicyGuardStatus';
import UserQuotas from './UserQuotas';

const MOCK_DATA = [
  { time: '10:00', queue: 4, active: 2 },
  { time: '10:05', queue: 7, active: 3 },
  { time: '10:10', queue: 5, active: 4 },
  { time: '10:15', queue: 12, active: 5 },
  { time: '10:20', queue: 8, active: 6 },
  { time: '10:25', queue: 15, active: 7 },
  { time: '10:30', queue: 10, active: 8 },
];

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="glass p-6 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
    <p className="text-4xl font-bold mt-1 text-white">{value}</p>
  </div>
);

type ViewMode = 'grid' | 'intelligence' | 'governance';

export default function GridDashboard() {
  const [metrics, setMetrics] = useState({ queue_size: 0, active_jobs: 0 });
  const [historicalData, setHistoricalData] = useState(MOCK_DATA);
  const [nodes, setNodes] = useState([
    { id: 'local-gpu-0', type: 'local', status: 'ready', resources: { vram_gb: 24 } },
    { id: 'cloud-node-a1', type: 'cloud', status: 'busy', resources: { vram_gb: 48 } },
  ]);
  const [selectedNode, setSelectedNode] = useState(nodes[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8000/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics_update') {
        setMetrics({
          queue_size: data.queue_size,
          active_jobs: data.active_jobs
        });
        
        if (data.nodes) {
            setNodes(data.nodes);
        }

        const newEntry = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          queue: data.queue_size,
          active: data.active_jobs
        };
        setHistoricalData(prev => [...prev.slice(-19), newEntry]);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  return (
    <div className="min-h-screen p-8 space-y-8 bg-[#09090b] text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Zap className="text-blue-500 w-8 h-8" />
            KhulnaSoft AI Compute Grid
          </h1>
          <p className="text-gray-400 mt-2">
            Governance & Multi-Agent Control Plane • v5.5 (Enterprise)
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'grid' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Grid
          </button>
          <button 
            onClick={() => setViewMode('intelligence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'intelligence' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" /> IQ
          </button>
          <button 
            onClick={() => setViewMode('governance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'governance' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gavel className="w-4 h-4" /> Governance
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Job Queue" 
          value={metrics.queue_size} 
          icon={Activity} 
          color="bg-blue-500" 
          trend="+12%"
        />
        <StatCard 
          title="Active Workers" 
          value={metrics.active_jobs} 
          icon={Cpu} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="User Namespace" 
          value="tenant-01" 
          icon={Users} 
          color="bg-accent" 
        />
        <StatCard 
          title="Security Status" 
          value="Locked" 
          icon={Shield} 
          color="bg-emerald-500" 
        />
      </div>

      {/* Main View Area */}
      <div className="transition-all duration-500">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="xl:col-span-2">
              <GPUHeatmap nodes={nodes} onNodeSelect={setSelectedNode} />
            </div>
            <div className="xl:col-span-1">
              <NodeDrillDown node={selectedNode} />
            </div>
          </div>
        )}

        {viewMode === 'intelligence' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="xl:col-span-2">
              <MemoryGraph />
            </div>
            <div className="xl:col-span-1">
              <AdaptivePanel />
            </div>
          </div>
        )}

        {viewMode === 'governance' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="xl:col-span-2">
              <DecisionTimeline />
            </div>
            <div className="xl:col-span-1 space-y-8">
              <PolicyGuardStatus />
              <UserQuotas />
            </div>
          </div>
        )}
      </div>

      {/* Extended Timeline View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-3">
            <JobGantt />
         </div>
         <div className="xl:col-span-1">
            <CostTimeline />
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-400">
              <Database className="w-5 h-5" />
              Queue Pressure
            </h2>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="queue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQueue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-purple-400">
              <TrendingUp className="w-5 h-5" />
              Compute Utilization
            </h2>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="active" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
