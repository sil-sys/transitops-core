import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import TripDetails from './pages/TripDetails';
import FuelLogs from './pages/FuelLogs';
import Expenses from './pages/Expenses';
import ComingSoon from './pages/ComingSoon';
import api from './api/axios';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    draft: 0,
    readyApproval: 0,
    approved: 0,
    readyDispatch: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/trips');
        const trips = res.data.data;
        const counts = {
          draft: trips.filter(t => t.status === 'Draft').length,
          readyApproval: trips.filter(t => t.status === 'Ready for Approval').length,
          approved: trips.filter(t => t.status === 'Approved').length,
          readyDispatch: trips.filter(t => t.status === 'Ready for Dispatch').length,
          total: trips.length
        };
        setStats(counts);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const hasTripAccess = ['FleetManager', 'Driver', 'SafetyOfficer'].includes(user?.role);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-500 mb-6">
          Logged in as <span className="font-semibold text-slate-700">{user?.role}</span>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Draft Widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Draft Trips</span>
            <span className="text-3xl font-extrabold text-slate-850 mt-1 block">{loading ? '...' : stats.draft}</span>
          </div>

          {/* Ready for Approval Widget */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Ready for Approval</span>
            <span className="text-3xl font-extrabold text-amber-800 mt-1 block">{loading ? '...' : stats.readyApproval}</span>
          </div>

          {/* Approved Widget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Approved Trips</span>
            <span className="text-3xl font-extrabold text-emerald-800 mt-1 block">{loading ? '...' : stats.approved}</span>
          </div>

          {/* Ready for Dispatch Widget */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Ready for Dispatch</span>
            <span className="text-3xl font-extrabold text-indigo-800 mt-1 block">{loading ? '...' : stats.readyDispatch}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
          <Link
            to="/vehicles"
            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-sm"
          >
            Go to Vehicle Registry &rarr;
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/drivers"
            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-sm"
          >
            Go to Driver Management &rarr;
          </Link>
          {hasTripAccess && (
            <>
              <span className="text-slate-300">|</span>
              <Link
                to={user?.role === 'Driver' ? '/my-trips' : '/trips'}
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-sm"
              >
                Go to Trips Workspace &rarr;
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <Layout>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'SafetyOfficer']}>
              <Layout>
                <Drivers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'Driver', 'SafetyOfficer']}>
              <Layout>
                <Trips />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'Driver', 'SafetyOfficer']}>
              <Layout>
                <TripDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-trips"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'Driver', 'SafetyOfficer']}>
              <Layout>
                <Trips />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute allowedRoles={['FleetManager']}>
              <Layout>
                <ComingSoon />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-logs"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'FinancialAnalyst']}>
              <Layout>
                <FuelLogs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'FinancialAnalyst']}>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['FleetManager', 'SafetyOfficer', 'FinancialAnalyst']}>
              <Layout>
                <ComingSoon />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;