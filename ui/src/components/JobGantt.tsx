import React from 'react';

const MOCK_JOBS = [
  { id: 'job-1', type: 'LLM Inference', start: 10, end: 40, status: 'completed', node: 'local-gpu-0' },
  { id: 'job-2', type: 'CVE Scanner', start: 25, end: 85, status: 'running', node: 'cloud-node-a1' },
  { id: 'job-3', type: 'Hash Brute', start: 50, end: 70, status: 'completed', node: 'local-gpu-0' },
  { id: 'job-4', type: 'LLM Training', start: 60, end: 95, status: 'running', node: 'cloud-node-b2' },
];

export default function JobGantt() {
  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Grid Throughput Timeline
        </h2>
        <div className="flex gap-4 text-[10px] uppercase tracking-wider font-bold">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Done</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Active</span>
        </div>
      </div>

      <div className="relative h-[250px] border-l border-b border-white/10 mt-4">
        {/* Time markers */}
        <div className="absolute bottom-[-20px] left-0 w-full flex justify-between text-[10px] text-gray-500">
           <span>0m</span><span>5m</span><span>10m</span><span>15m</span><span>20m</span>
        </div>

        <div className="space-y-4 pt-4">
          {MOCK_JOBS.map((job, idx) => (
            <div key={job.id} className="relative h-8 group">
              <div 
                className={`absolute h-full rounded-lg transition-all duration-500 flex items-center px-3 text-[10px] font-bold overflow-hidden whitespace-nowrap ${
                  job.status === 'completed' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                }`}
                style={{ left: `${job.start}%`, width: `${job.end - job.start}%` }}
              >
                {job.type} • {job.node}
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute hidden group-hover:block bg-black/90 border border-white/10 p-2 rounded-md -top-10 z-10 text-[10px] left-[50%] -translate-x-1/2">
                ID: {job.id} | Result: Success
              </div>
            </div>
          ))}
        </div>
        
        {/* Scanning line */}
        <div className="absolute top-0 bottom-0 w-px bg-white/20 animate-scan left-[75%]" />
      </div>
    </div>
  );
}
