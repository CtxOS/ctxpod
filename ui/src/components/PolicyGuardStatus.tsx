import React from 'react';
import { ShieldCheck, Lock, Maximize2, ZapOff } from 'lucide-react';

export default function PolicyGuardStatus() {
  return (
    <div className="glass p-8 rounded-3xl space-y-6 bg-gradient-to-br from-white/5 to-transparent">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-6 h-6" />
          Safety Constraints
        </h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Active Policy Enforcement</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
           <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
              <span>Recursion Depth</span>
              <Lock className="w-3 h-3" />
           </div>
           <div className="text-xl font-mono text-white">5 <span className="text-[10px] text-gray-600">MAX</span></div>
        </div>
        
        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
           <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
              <span>Budget Cap</span>
              <ZapOff className="w-3 h-3" />
           </div>
           <div className="text-xl font-mono text-white">$250.00</div>
        </div>
      </div>

      <div className="space-y-3">
         <h4 className="text-[10px] text-gray-500 uppercase font-bold">Allowed Agents</h4>
         <div className="flex flex-wrap gap-2">
            {['recon', 'scanner', 'base', 'analyst'].map(name => (
              <span key={name} className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono">
                {name}
              </span>
            ))}
            <span className="px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-mono line-through">
              exploit
            </span>
         </div>
      </div>

      <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
         <div className="flex items-center gap-2 text-orange-500 text-[10px] font-bold uppercase mb-1">
            <Maximize2 className="w-3 h-3" />
            Active Warning
         </div>
         <p className="text-gray-400 text-[10px] leading-relaxed">
            Automatic mutation throttle is ACTIVE. High-complexity workflows will require manual operator checkpoint.
         </p>
      </div>
    </div>
  );
}
