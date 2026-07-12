import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_MENUS = {
  FleetManager: [
    { label: 'Dashboard', path: '/' },
    { label: 'Vehicles', path: '/vehicles' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Trips', path: '/trips' },
    { label: 'Maintenance', path: '/maintenance' },
    { label: 'Fuel Logs', path: '/fuel-logs' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Reports', path: '/reports' },
  ],
  Driver: [
    { label: 'Dashboard', path: '/' },
    { label: 'My Trips', path: '/my-trips' },
  ],
  SafetyOfficer: [
    { label: 'Dashboard', path: '/' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Trips (View Only)', path: '/trips' },
    { label: 'Reports', path: '/reports' },
  ],
  FinancialAnalyst: [
    { label: 'Dashboard', path: '/' },
    { label: 'Fuel Logs', path: '/fuel-logs' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Reports', path: '/reports' },
  ]
};

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const isActive = (path) => location.pathname === path;
  const menuItems = ROLE_MENUS[user?.role] || [{ label: 'Dashboard', path: '/' }];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto select-none py-1">
            <Link to="/" className="text-xl font-bold text-slate-800 shrink-0">
              TransitOps
            </Link>
            <div className="flex gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-sm text-slate-500 font-medium hidden sm:inline">
              {user.name} <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 ml-1 text-slate-600 font-semibold">{user.role}</span>
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
