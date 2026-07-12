import React from 'react';
import { useLocation } from 'react-router-dom';

const PATH_LABELS = {
  '/maintenance': 'Maintenance Logs',
  '/fuel-logs': 'Fuel Logs',
  '/expenses': 'Expenses Tracking',
  '/reports': 'System Reports',
};

export default function ComingSoon() {
  const location = useLocation();
  const title = PATH_LABELS[location.pathname] || 'Feature Module';

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{title}</h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <svg
              className="w-8 h-8 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Coming Soon</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            The {title} functionality is scheduled for a future development milestone.
            Please access the <strong>Vehicles</strong>, <strong>Drivers</strong>, or <strong>Trips</strong> module in the top navigation.
          </p>
        </div>
      </div>
    </div>
  );
}
