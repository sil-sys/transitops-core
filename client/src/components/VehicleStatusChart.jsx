import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#64748b'];

export default function VehicleStatusChart({ data }) {
  if (!data) return null;
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-[400px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Vehicle Status</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
