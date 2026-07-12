import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-slate-800">
              TransitOps
            </Link>
            <div className="flex gap-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/vehicles"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/vehicles') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Vehicles
              </Link>
              <Link
                to="/drivers"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/drivers') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Drivers
              </Link>
              <Link
                to="/maintenance"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/maintenance') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Maintenance
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="text-sm px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default Layout;
