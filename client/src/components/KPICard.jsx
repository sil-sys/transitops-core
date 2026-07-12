import React from 'react';

export default function KPICard({ title, value, icon, loading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
      {icon && <div className="text-3xl bg-slate-50 p-3 rounded-lg text-slate-500">{icon}</div>}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{title}</span>
        <span className="text-3xl font-extrabold text-slate-800 mt-1 block">
          {loading ? '...' : value}
        </span>
      </div>
    </div>
  );
}
