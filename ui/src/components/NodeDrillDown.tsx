import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DATA = [
  { name: 'Used VRAM', value: 16, color: '#3b82f6' },
  { name: 'Free VRAM', value: 8, color: '#1e293b' },
];

export default function NodeDrillDown({ node }: { node: any }) {
  if (!node) return null;

  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{node.id}</h2>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">
            Detailed Resource Inspection
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
          node.type === 'local' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
        }`}>
          {node.type.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 items-center">
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DATA}
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
           <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500 uppercase">GPU Load</span>
                <span className="text-white">68%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[68%]" />
              </div>
           </div>
           <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500 uppercase">CPU Usage</span>
                <span className="text-white">12%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[12%]" />
              </div>
           </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5">
        <h4 className="text-[10px] text-gray-500 uppercase font-bold mb-3">Running Processes</h4>
        <div className="space-y-2">
           <div className="flex justify-between items-center glass-card p-3 rounded-xl border border-white/5">
              <span className="text-xs font-mono">llm_inference_v3</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">8GB VRAM</span>
           </div>
           <div className="flex justify-between items-center glass-card p-3 rounded-xl border border-white/5">
              <span className="text-xs font-mono">cve_scanner_auto</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">512MB VRAM</span>
           </div>
        </div>
      </div>
    </div>
  );
}
