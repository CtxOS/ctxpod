import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_COST_DATA = [
  { time: '00:00', spend: 0 },
  { time: '04:00', spend: 4.2 },
  { time: '08:00', spend: 8.5 },
  { time: '12:00', spend: 15.3 },
  { time: '16:00', spend: 22.1 },
  { time: '20:00', spend: 28.4 },
  { time: '23:59', spend: 32.5 },
];

export default function CostTimeline({ data = MOCK_COST_DATA }: { data?: any[] }) {
  return (
    <div className="glass p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Cloud Burn Rate (24h)
        </h2>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase">Daily Total</div>
          <div className="text-xl font-bold text-emerald-400">$32.50</div>
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            />
            <Area type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-around pt-4 border-t border-white/5">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase">Avg / Hr</div>
          <div className="text-sm font-semibold text-white">$1.35</div>
        </div>
        <div className="text-center border-l border-white/5 pl-8">
          <div className="text-[10px] text-gray-500 uppercase">Est. Monthly</div>
          <div className="text-sm font-semibold text-white">$975.00</div>
        </div>
      </div>
    </div>
  );
}
