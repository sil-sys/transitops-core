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
  
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    region: ''
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await api.get(`/dashboard?${queryParams}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setError('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filters]); // Re-fetch when filters change

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-slate-500">
            Logged in as <span className="font-semibold text-slate-700">{user?.role}</span>
          </p>
        </div>
        
        {/* Dashboard Filters */}
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <select name="type" value={filters.type} onChange={handleFilterChange} className="px-3 py-1.5 text-sm border-none bg-slate-50 rounded-lg text-slate-600 focus:ring-0 outline-none">
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bus">Bus</option>
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="px-3 py-1.5 text-sm border-none bg-slate-50 rounded-lg text-slate-600 focus:ring-0 outline-none">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
          </select>
          <select name="region" value={filters.region} onChange={handleFilterChange} className="px-3 py-1.5 text-sm border-none bg-slate-50 rounded-lg text-slate-600 focus:ring-0 outline-none">
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
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
