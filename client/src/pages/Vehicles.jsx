import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Available', 'On Trip', 'In Shop', 'Retired'];

function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    type: '',
    maxLoadCapacity: '',
    acquisitionCost: '',
    region: '',
  });

  const canManage = user?.role === 'FleetManager';

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.data);
    } catch (err) {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/vehicles', formData);
      setFormData({
        registrationNumber: '',
        name: '',
        type: '',
        maxLoadCapacity: '',
        acquisitionCost: '',
        region: '',
      });
      setShowForm(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vehicle');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/vehicles/${id}`, { status });
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Vehicle Registry</h1>
          {canManage && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              {showForm ? 'Cancel' : '+ Add Vehicle'}
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
            <input
              name="registrationNumber"
              placeholder="Registration Number"
              required
              value={formData.registrationNumber}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              name="name"
              placeholder="Vehicle Name/Model"
              required
              value={formData.name}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              name="type"
              placeholder="Type (e.g. Van, Truck)"
              required
              value={formData.type}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              name="maxLoadCapacity"
              type="number"
              placeholder="Max Load Capacity (kg)"
              required
              value={formData.maxLoadCapacity}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              name="acquisitionCost"
              type="number"
              placeholder="Acquisition Cost"
              required
              value={formData.acquisitionCost}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              name="region"
              placeholder="Region"
              value={formData.region}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="col-span-2 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              Save Vehicle
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="p-6 text-slate-500">Loading...</p>
          ) : vehicles.length === 0 ? (
            <p className="p-6 text-slate-500">No vehicles registered yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3">Reg. No.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{v.registrationNumber}</td>
                    <td className="px-4 py-3">{v.name}</td>
                    <td className="px-4 py-3">{v.type}</td>
                    <td className="px-4 py-3">{v.maxLoadCapacity} kg</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={v.status}
                          onChange={(e) => handleStatusChange(v._id, e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 rounded-lg">{v.status}</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(v._id)}
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

export default Vehicles;