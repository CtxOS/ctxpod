import React from 'react';

const NodeChip = ({ node }: any) => {
  const isBusy = node.status === 'busy';
  const isCloud = node.type === 'cloud';

  return (
    <div className={`p-4 rounded-xl glass border-l-4 transition-all duration-300 ${
      isBusy ? 'border-accent opacity-90' : 'border-emerald-500'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-xs text-gray-400">{node.id}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
          isCloud ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {node.type}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isBusy ? 'bg-accent animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-sm font-medium">{isBusy ? 'Executing Job' : 'Idle'}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="text-gray-500">VRAM: <span className="text-gray-300">{node.resources.vram_gb}GB</span></div>
        <div className="text-gray-500">GPU: <span className="text-gray-300">NVIDIA A10G</span></div>
      </div>
    </div>
  );
};

export default function GPUHeatmap({ nodes }: { nodes: any[] }) {
  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Node Registry Heatmap
        </h2>
        <span className="text-xs text-gray-500">{nodes.length} Nodes Active</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {nodes.length > 0 ? (
          nodes.map(node => <NodeChip key={node.id} node={node} />)
        ) : (
          <div className="col-span-full h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-gray-600">
            No active nodes detected in registry
          </div>
        )}
      </div>
    </div>
  );
}
