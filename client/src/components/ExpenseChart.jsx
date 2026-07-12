import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExpenseChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-[400px] flex items-center justify-center">
      <p className="text-slate-500">No expense data available</p>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-[400px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Expenses Per Vehicle</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="vehicle" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [`$${value}`, 'Expense']}
          />
          <Bar dataKey="expense" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
