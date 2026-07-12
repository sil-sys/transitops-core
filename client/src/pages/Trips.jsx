import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Trips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    cargoWeight: '',
    plannedDistance: '',
    priority: 'Medium',
  });

  // Search & Filter States
  const [searchSource, setSearchSource] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const isFleetManager = user?.role === 'FleetManager';

  let title = 'Trips';
  if (user?.role === 'Driver') {
    title = 'My Trips';
  } else if (user?.role === 'SafetyOfficer') {
    title = 'Trips (View Only)';
  }

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/trips', {
        ...formData,
        cargoWeight: Number(formData.cargoWeight),
        plannedDistance: Number(formData.plannedDistance),
      });
      setSuccessMsg('Trip created successfully as Draft!');
      setShowModal(false);
      setFormData({
        source: '',
        destination: '',
        cargoWeight: '',
        plannedDistance: '',
        priority: 'Medium',
      });
      fetchTrips();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    }
  };

  const getPriorityBadgeColor = (p) => {
    switch (p) {
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeColor = (s) => {
    switch (s) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Vehicle Assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Driver Assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Route Planned': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Ready for Approval': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ready for Dispatch': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Dispatched': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSource = (t.source || '').toLowerCase().includes(searchSource.toLowerCase());
    const matchesDest = (t.destination || '').toLowerCase().includes(searchDest.toLowerCase());
    const matchesStatus = filterStatus ? t.status === filterStatus : true;
    const matchesPriority = filterPriority ? t.priority === filterPriority : true;
    return matchesSource && matchesDest && matchesStatus && matchesPriority;
  });

  // Stats derived from trips list
  const stats = {
    total: trips.length,
    active: trips.filter(t => !['Dispatched', 'Completed', 'Cancelled'].includes(t.status)).length,
    dispatched: trips.filter(t => t.status === 'Dispatched').length,
    completed: trips.filter(t => t.status === 'Completed').length,
    cancelled: trips.filter(t => t.status === 'Cancelled').length,
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">{successMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and track trip lifecycle from Draft to Dispatch</p>
          </div>
          {isFleetManager && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition text-sm font-semibold shadow-sm"
            >
              + Create Trip
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', count: stats.total, color: 'border-slate-200 bg-white', numColor: 'text-slate-800' },
            { label: 'In Preparation', count: stats.active, color: 'border-amber-200 bg-amber-50', numColor: 'text-amber-700' },
            { label: 'Dispatched', count: stats.dispatched, color: 'border-blue-200 bg-blue-50', numColor: 'text-blue-700' },
            { label: 'Completed', count: stats.completed, color: 'border-emerald-200 bg-emerald-50', numColor: 'text-emerald-700' },
          ].map(({ label, count, color, numColor }) => (
            <div key={label} className={`rounded-2xl border p-4 ${color} shadow-sm`}>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">{label}</p>
              <p className={`text-3xl font-extrabold ${numColor}`}>{count}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Search Source</label>
              <input
                type="text"
                placeholder="e.g. New York"
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Search Destination</label>
              <input
                type="text"
                placeholder="e.g. Boston"
                value={searchDest}
                onChange={(e) => setSearchDest(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Filter Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Vehicle Assigned">Vehicle Assigned</option>
                <option value="Driver Assigned">Driver Assigned</option>
                <option value="Route Planned">Route Planned</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Filter Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading trips...</span>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No trips available.</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {isFleetManager
                  ? 'Click the "Create Trip" button above to register a new trip in the system.'
                  : 'Trips assigned to you or registered in your region will appear here.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Trip ID / Route</th>
                  <th className="px-6 py-4">Assigned Vehicle</th>
                  <th className="px-6 py-4">Assigned Driver</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Workflow Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTrips.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{t.source}</span>
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span>{t.destination}</span>
                      </div>
                      <span className="text-slate-400 text-xs block mt-0.5">ID: {t._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {t.vehicle ? (
                        <div>
                          <div className="font-medium text-slate-800">{t.vehicle.registrationNumber}</div>
                          <div className="text-slate-400 text-xs">{t.vehicle.name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.driver ? (
                        <div>
                          <div className="font-medium text-slate-800">{t.driver.name}</div>
                          <div className="text-slate-400 text-xs">{t.driver.contactNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 border text-xs font-semibold rounded-full ${getPriorityBadgeColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 border text-xs font-semibold rounded-full ${getStatusBadgeColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/trips/${t._id}`)}
                        className="px-3.5 py-1.5 text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition duration-150"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Create Trip */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Create New Trip</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Source</label>
                    <input
                      type="text"
                      name="source"
                      required
                      placeholder="e.g. New York Hub"
                      value={formData.source}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Destination</label>
                    <input
                      type="text"
                      name="destination"
                      required
                      placeholder="e.g. Boston Facility"
                      value={formData.destination}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cargo Weight (kg)</label>
                    <input
                      type="number"
                      name="cargoWeight"
                      required
                      min="0"
                      placeholder="e.g. 500"
                      value={formData.cargoWeight}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Planned Distance (km)</label>
                    <input
                      type="number"
                      name="plannedDistance"
                      required
                      min="0"
                      placeholder="e.g. 350"
                      value={formData.plannedDistance}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-sm font-semibold rounded-lg shadow-md transition"
                  >
                    Create Draft Trip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
