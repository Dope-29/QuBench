import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard({ metrics, qmsScore, history = [] }) {
  // Demo history if none provided: simulates real-time chart
  const localHistory = history.length ? history : [
    { time: '1s', score: 80 },
    { time: '2s', score: 85 },
    { time: '3s', score: qmsScore || 90 }
  ];

  return (
    <div className="w-full h-full p-4 glass-panel rounded-xl flex flex-col gap-4">
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-blue-500 flex items-center gap-2">
         Efficiency Analytics
      </h2>
      
      <div className="flex gap-4">
        <div className="flex-1 bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center">
            <span className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Quantum Merit Score</span>
            <span className="text-4xl font-bold text-green-400 tracking-tighter">
              {qmsScore ? qmsScore.toFixed(1) : '--'}
            </span>
        </div>
        
        <div className="flex-1 bg-black/40 rounded-lg p-4 border border-white/5 grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Circuit Depth</div>
            <div className="text-right font-mono text-purple-300">{metrics?.depth || 0}</div>
            
            <div className="text-gray-400">Total Gates</div>
            <div className="text-right font-mono text-blue-300">{metrics?.gate_count || 0}</div>
            
            <div className="text-gray-400">Purity Status</div>
            <div className="text-right font-mono text-yellow-300">
               {metrics ? (qmsScore > 50 ? 'Mixed' : 'Decohered') : 'Pure'}
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-[150px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={localHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} />
            <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#ffffff20', borderRadius: '8px' }}
              itemStyle={{ color: '#a855f7' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
