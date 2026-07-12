import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: '',
    licenseExpiryDate: '',
    contactNumber: '',
    safetyScore: 100,
    experience: 2,
  });

  // Depending on requirements, only FleetManager or SafetyOfficer might be allowed to manage drivers
  const canManage = user?.role === 'FleetManager' || user?.role === 'SafetyOfficer';

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data.data);
    } catch (err) {
      setError('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      licenseNumber: '',
      licenseCategory: '',
      licenseExpiryDate: '',
      contactNumber: '',
      safetyScore: 100,
      experience: 2,
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleEditClick = (driver) => {
    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.split('T')[0] : '',
      contactNumber: driver.contactNumber,
      safetyScore: driver.safetyScore,
      experience: driver.experience || 2,
    });
    setEditId(driver._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/drivers/${editId}`, formData);
      } else {
        await api.post('/drivers', formData);
      }
      resetForm();
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save driver');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/drivers/${id}`, { status });
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete driver');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Driver Management</h1>
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
              {showForm ? 'Cancel' : '+ Add Driver'}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                name="name"
                placeholder="e.g. John Doe"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
              <input
                name="licenseNumber"
                placeholder="e.g. DL-12345"
                required
                value={formData.licenseNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Category</label>
              <input
                name="licenseCategory"
                placeholder="e.g. Heavy Commercial"
                required
                value={formData.licenseCategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Expiry Date</label>
              <input
                name="licenseExpiryDate"
                type="date"
                required
                value={formData.licenseExpiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
              <input
                name="contactNumber"
                placeholder="e.g. +1 234 567 8900"
                required
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Safety Score (0-100)</label>
              <input
                name="safetyScore"
                type="number"
                min="0"
                max="100"
                placeholder="Safety Score (0-100)"
                value={formData.safetyScore}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
              <input
                name="experience"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="col-span-2 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              {editId ? 'Update Driver' : 'Save Driver'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="p-6 text-slate-500">Loading...</p>
          ) : drivers.length === 0 ? (
            <p className="p-6 text-slate-500">No drivers registered yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">License No.</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  // Check if expired
                  const isExpired = new Date(d.licenseExpiryDate) < new Date();
                  
                  return (
                    <tr key={d._id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                      <td className="px-4 py-3">{d.licenseNumber}</td>
                      <td className="px-4 py-3">{d.licenseCategory}</td>
                      <td className={`px-4 py-3 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                        {new Date(d.licenseExpiryDate).toLocaleDateString()}
                        {isExpired && ' (Expired)'}
                      </td>
                      <td className="px-4 py-3">{d.contactNumber}</td>
                      <td className="px-4 py-3">{d.safetyScore}</td>
                      <td className="px-4 py-3">{d.experience || 0} yrs</td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <select
                            value={d.status}
                            onChange={(e) => handleStatusChange(d._id, e.target.value)}
                            className="border border-slate-300 rounded-lg px-2 py-1"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 rounded-lg">{d.status}</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right space-x-3">
                          <button
                            onClick={() => handleEditClick(d)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(d._id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Drivers;
