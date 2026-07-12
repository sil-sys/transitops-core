import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const initialForm = {
  vehicle: '',
  type: 'Repair',
  description: '',
  cost: '',
  startedAt: '',
};

export default function Maintenance() {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintenanceRes, vehicleRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles'),
      ]);
      setMaintenanceLogs(maintenanceRes.data.data || []);
      setVehicles(vehicleRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { vehicle, type, description, cost, startedAt } = formData;

    if (!vehicle) {
      setError('Please select a vehicle');
      return;
    }
    if (!type) {
      setError('Maintenance type is required');
      return;
    }
    const parsedCost = Number(cost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setError('Valid cost is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicle,
        type,
        description,
        cost: parsedCost,
        startedAt: startedAt || new Date().toISOString(),
      };

      const response = await api.post('/maintenance', payload);
      const savedLog = response.data.data;
      setMaintenanceLogs((prev) => [savedLog, ...prev]);

      setShowModal(false);
      resetForm();
      await fetchData(); // Refresh data to update vehicle statuses
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save maintenance log');
    } finally {
      setSaving(false);
    }
  };

  const confirmCloseMaintenance = (id) => setClosingId(id);

  const handleCloseMaintenance = async () => {
    if (!closingId) return;
    try {
      await api.put(`/maintenance/${closingId}`, { status: 'Closed' });
      setClosingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close maintenance');
      setClosingId(null);
    }
  };

  const confirmDelete = (id) => setDeletingId(id);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/maintenance/${deletingId}`);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete maintenance log');
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Maintenance</h1>
            <p className="text-sm text-slate-500">Manage vehicle maintenance and repairs</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + Add Maintenance
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading maintenance logs...</div>
          ) : maintenanceLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No maintenance logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Issue/Type</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenanceLogs.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.vehicle?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{item.vehicle?.registrationNumber || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{item.type}</div>
                        <div className="text-xs text-slate-500">{item.description || 'No description'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">${Number(item.cost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-700">{new Date(item.startedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${item.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {item.status === 'Active' && (
                            <button onClick={() => confirmCloseMaintenance(item._id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Close Maintenance</button>
                          )}
                          <button onClick={() => confirmDelete(item._id)} className="text-sm font-medium text-rose-600 hover:text-rose-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-800">Add Maintenance</h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle</label>
                    <select name="vehicle" value={formData.vehicle} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>{vehicle.registrationNumber} — {vehicle.name} ({vehicle.status})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Type / Issue</label>
                    <input type="text" name="type" value={formData.type} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Oil Change, Repair" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Cost</label>
                    <input type="number" min="0" step="0.01" name="cost" value={formData.cost} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Details about the maintenance..."></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Date Started</label>
                    <input type="date" name="startedAt" value={formData.startedAt} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Maintenance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {closingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-slate-800">Close Maintenance</h3>
              <p className="mb-6 text-sm text-slate-600">Are you sure you want to close this maintenance log? The vehicle will be made Available.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setClosingId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button onClick={handleCloseMaintenance} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Close Log</button>
              </div>
            </div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-slate-800">Delete Maintenance Log</h3>
              <p className="mb-6 text-sm text-slate-600">Are you sure you want to delete this maintenance log? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeletingId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button onClick={handleDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
