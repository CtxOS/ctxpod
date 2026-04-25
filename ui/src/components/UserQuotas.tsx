import React from 'react';
import { CreditCard, Zap, Clock, AlertCircle } from 'lucide-react';

const MOCK_QUOTAS = {
  used: 16.5,
  limit: 24.0,
  cost_used: 142.50,
  cost_limit: 500.0,
  rpm_used: 42,
  rpm_limit: 60
};

export default function UserQuotas() {
  const gpuProgress = (MOCK_QUOTAS.used / MOCK_QUOTAS.limit) * 100;
  const costProgress = (MOCK_QUOTAS.cost_used / MOCK_QUOTAS.cost_limit) * 100;

  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Usage & Quotas</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Multi-Tenancy Enforcement</p>
        </div>
        <CreditCard className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> GPU Hours</span>
            <span className="text-white font-mono">{MOCK_QUOTAS.used} / {MOCK_QUOTAS.limit}h</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${gpuProgress > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${gpuProgress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Cost Burn</span>
            <span className="text-white font-mono">${MOCK_QUOTAS.cost_used} / ${MOCK_QUOTAS.cost_limit}</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-emerald-500 transition-all duration-1000`}
              style={{ width: `${costProgress}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
           <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Your current tier allows for <span className="text-white">60 requests/min</span> across all grid namespaces. 
                Auto-refill occurs at 00:00 UTC.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
