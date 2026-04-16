import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MOCK_MEMORY = [
  { name: 'Log4j Patterns', x: 20, y: 80, z: 100, type: 'exploit' },
  { name: 'Nmap Scan Res', x: 50, y: 40, z: 80, type: 'recon' },
  { name: 'Auth Bypass', x: 80, y: 90, z: 60, type: 'exploit' },
  { name: 'DNS Records', x: 10, y: 10, z: 40, type: 'recon' },
  { name: 'SSH Keys', x: 40, y: 60, z: 120, type: 'intel' },
  { name: 'SQLi Payloads', x: 90, y: 20, z: 90, type: 'exploit' },
];

const COLORS: any = {
  exploit: '#f43f5e', // rose-500
  recon: '#3b82f6',   // blue-500
  intel: '#8b5cf6',   // violet-500
};

export default function MemoryGraph() {
  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Agent Knowledge Space</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Vector DB Clustering (ChromaDB)</p>
        </div>
        <div className="flex gap-4 text-[10px] font-bold">
           {Object.keys(COLORS).map(type => (
             <div key={type} className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[type]}} />
               <span className="uppercase text-gray-400">{type}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" hide />
            <YAxis type="number" dataKey="y" hide />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            />
            <Scatter name="Memory Clusters" data={MOCK_MEMORY} fill="#8884d8">
              {MOCK_MEMORY.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.type]} className="animate-pulse" style={{ animationDuration: `${2 + index}s` }} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
         <span>Total Knowledge Nodes: 1,248</span>
         <span>Similarity Threshold: 0.85</span>
      </div>
    </div>
  );
}
