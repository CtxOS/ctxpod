import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';

const MOCK_DECISIONS = [
  { 
    id: 'd-1', 
    timestamp: '11:15:10', 
    component: 'PlannerAgent', 
    action: 'Workflow Synthesized', 
    rationale: 'Generated 3-stage recon plan based on user objective.',
    status: 'Authorized'
  },
  { 
    id: 'd-2', 
    timestamp: '11:15:45', 
    component: 'CriticAgent', 
    action: 'Sanity Check Passed', 
    rationale: 'Verified all agent roles are within governance bounds.',
    status: 'Authorized'
  },
  { 
    id: 'd-3', 
    timestamp: '11:20:00', 
    component: 'ObserverAgent', 
    action: 'Runtime Warning', 
    rationale: 'Step "VulnScan" is exceeding predicted execution time by 40%.',
    status: 'Warning'
  }
];

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Authorized': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'Blocked': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    case 'Warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    default: return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

export default function DecisionTimeline() {
  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Autonomous Decision Audit</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Deterministic Replay Log</p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
        {MOCK_DECISIONS.map((decision, idx) => (
          <div key={decision.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#18181b] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <StatusIcon status={decision.status} />
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/5 bg-white/5 glass-card">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-white text-xs">{decision.component}</div>
                <time className="font-mono text-[10px] text-blue-500">{decision.timestamp}</time>
              </div>
              <div className="text-gray-400 text-[11px] mb-2 font-medium">{decision.action}</div>
              <p className="text-gray-500 text-[10px] italic">"{decision.rationale}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
