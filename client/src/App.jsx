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
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import ComingSoon from './pages/ComingSoon';
import Dashboard from './pages/Dashboard';
import api from './api/axios';



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
                <Maintenance />
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
                <Reports />
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