import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">
          Welcome, {user?.name}
        </h1>
        <p className="text-slate-500 mb-4">Role: {user?.role}</p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
        >
          Logout
        </button>
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
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;