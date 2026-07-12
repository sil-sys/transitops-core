import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [costs, setCosts] = useState({
    fuelCost: 0,
    maintenanceCost: 0,
    totalOperationalCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const res = await api.get('/reports/cost');
        setCosts(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load cost report');
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Financial Reports</h1>
        <p className="text-sm text-slate-500">Aggregate operational costs overview</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fuel Cost Widget */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-2">Total Fuel Cost</span>
            <span className="text-4xl font-extrabold text-amber-800">
              {loading ? '...' : `$${costs.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200/50">
            <p className="text-xs text-amber-700/70">Aggregated from all fuel logs</p>
          </div>
        </div>

        {/* Maintenance Cost Widget */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-2">Total Maintenance Cost</span>
            <span className="text-4xl font-extrabold text-rose-800">
              {loading ? '...' : `$${costs.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-rose-200/50">
            <p className="text-xs text-rose-700/70">Aggregated from all maintenance logs</p>
          </div>
        </div>

        {/* Total Operational Cost Widget */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-2">Total Operational Cost</span>
            <span className="text-4xl font-extrabold text-emerald-800">
              {loading ? '...' : `$${costs.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-200/50">
            <p className="text-xs text-emerald-700/70">Combined fuel and maintenance expenses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
