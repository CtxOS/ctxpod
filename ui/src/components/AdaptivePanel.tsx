import React from 'react';
import { Brain, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function AdaptivePanel() {
  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Adaptive Intelligence
        </h2>
        <RefreshCw className="w-4 h-4 text-gray-500 animate-spin-slow" />
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Local Pref Weight</span>
              <span className="text-emerald-400 text-xs flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +12%
              </span>
           </div>
           <div className="text-2xl font-bold font-mono">1.62 <span className="text-xs text-gray-600 font-normal">x baseline</span></div>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Cloud Penalty</span>
              <span className="text-rose-400 text-xs flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> -5%
              </span>
           </div>
           <div className="text-2xl font-bold font-mono">0.76 <span className="text-xs text-gray-600 font-normal">x baseline</span></div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
         <h4 className="text-[10px] text-gray-500 uppercase font-bold mb-3">Self-Optimization Log</h4>
         <div className="space-y-2">
            <div className="text-[10px] font-mono text-gray-400 border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-500/5">
               [Success] Job #823 finished on local-0. Incrementing local preference.
            </div>
            <div className="text-[10px] font-mono text-gray-400 border-l-2 border-blue-500 pl-3 py-1">
               [Analyzed] Cloud latency (ap-southeast) decreased by 40ms. Adjusting penalty.
            </div>
         </div>
      </div>
    </div>
  );
}
