import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/KPICard';
import VehicleStatusChart from '../components/VehicleStatusChart';
import ExpenseChart from '../components/ExpenseChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-500">
          Logged in as <span className="font-semibold text-slate-700">{user?.role}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Active Vehicles" value={dashboardData?.activeVehicles} loading={loading} />
        <KPICard title="Available Vehicles" value={dashboardData?.availableVehicles} loading={loading} />
        <KPICard title="In Shop" value={dashboardData?.maintenanceVehicles} loading={loading} />
        <KPICard title="Active Trips" value={dashboardData?.activeTrips} loading={loading} />
        <KPICard title="Pending Trips" value={dashboardData?.pendingTrips} loading={loading} />
        <KPICard title="Drivers On Duty" value={dashboardData?.driversOnDuty} loading={loading} />
        <KPICard title="Fleet Utilization" value={loading ? '' : `${dashboardData?.fleetUtilization}%`} loading={loading} />
      </div>

      {/* Charts */}
      {!loading && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <VehicleStatusChart data={dashboardData.vehicleStatus} />
          <ExpenseChart data={dashboardData.expensesPerVehicle} />
        </div>
      )}
      
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 h-[400px] flex items-center justify-center animate-pulse">
            <div className="text-slate-400">Loading chart...</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 h-[400px] flex items-center justify-center animate-pulse">
            <div className="text-slate-400">Loading chart...</div>
          </div>
        </div>
      )}
    </div>
  );
}
