import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Maintenance() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicle: '',
    type: '',
    description: '',
    cost: '',
  });

  const canManage = user?.role === 'FleetManager';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles')
      ]);
      setLogs(logsRes.data.data);
      setVehicles(vehiclesRes.data.data);
    } catch (err) {
      setError('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      vehicle: '',
      type: '',
      description: '',
      cost: '',
    });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/maintenance', formData);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create maintenance log');
    }
  };

  const handleCloseMaintenance = async (id) => {
    if (!confirm('Are you sure you want to close this maintenance record? The vehicle will become Available.')) return;
    try {
      await api.put(`/maintenance/${id}`, { status: 'Closed' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close maintenance');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance record?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete maintenance log');
    }
  };

  // Only show vehicles that are Available for new maintenance
  const availableVehicles = vehicles.filter(v => v.status === 'Available');

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Maintenance Logs</h1>
          {canManage && (
            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              {showForm ? 'Cancel' : '+ Add Maintenance'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-2 gap-4"
          >
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Vehicle</label>
              <select
                name="vehicle"
                required
                value={formData.vehicle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">-- Choose a Vehicle --</option>
                {availableVehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.registrationNumber})
                  </option>
                ))}
              </select>
              {availableVehicles.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">No available vehicles found. All are In Shop, On Trip, or Retired.</p>
              )}
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue / Type</label>
              <input
                name="type"
                placeholder="e.g. Oil Change, Brake Replacement"
                required
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
              <input
                name="cost"
                type="number"
                min="0"
                placeholder="Cost"
                required
                value={formData.cost}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
              <input
                name="description"
                placeholder="Details about the maintenance"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={!formData.vehicle}
              className="col-span-2 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Maintenance Log
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="p-6 text-slate-500">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="p-6 text-slate-500">No maintenance records found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Issue (Type)</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {log.vehicle ? `${log.vehicle.name} (${log.vehicle.registrationNumber})` : 'Deleted Vehicle'}
                    </td>
                    <td className="px-4 py-3">
                      {log.type}
                      {log.description && <span className="block text-xs text-slate-500">{log.description}</span>}
                    </td>
                    <td className="px-4 py-3">${log.cost}</td>
                    <td className="px-4 py-3">{new Date(log.startedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        log.status === 'Active' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right space-x-3">
                        {log.status === 'Active' && (
                          <button
                            onClick={() => handleCloseMaintenance(log._id)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Close Maintenance
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(log._id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Maintenance;
