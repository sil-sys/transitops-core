import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const initialForm = {
  vehicle: '',
  trip: '',
  liters: '',
  cost: '',
  date: '',
};

export default function FuelLogs() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fuelRes, vehicleRes, tripRes] = await Promise.all([
        api.get('/fuel'),
        api.get('/vehicles'),
        api.get('/trips'),
      ]);
      setFuelLogs(fuelRes.data.data || []);
      setVehicles(vehicleRes.data.data || []);
      setTrips(tripRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fuel logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (fuelLog) => {
    setEditingId(fuelLog._id);
    setFormData({
      vehicle: fuelLog.vehicle?._id || '',
      trip: fuelLog.trip?._id || '',
      liters: fuelLog.liters || '',
      cost: fuelLog.cost || '',
      date: fuelLog.date ? new Date(fuelLog.date).toISOString().slice(0, 10) : '',
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const form = e.currentTarget;
    const vehicle = form.vehicle.value;
    const trip = form.trip.value || null;
    const liters = Number(form.liters.value);
    const cost = Number(form.cost.value);
    const date = form.date.value || new Date().toISOString();

    if (!vehicle) {
      setError('Please select a vehicle');
      return;
    }
    if (!Number.isFinite(liters) || liters <= 0) {
      setError('Liters must be greater than 0');
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setError('Cost must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicle,
        trip,
        liters,
        cost,
        date,
      };

      let savedFuelLog;
      if (editingId) {
        const response = await api.put(`/fuel/${editingId}`, payload);
        savedFuelLog = response.data.data;
        setFuelLogs((prev) => prev.map((item) => (item._id === savedFuelLog._id ? savedFuelLog : item)));
        setSuccess('Fuel log updated successfully');
      } else {
        const response = await api.post('/fuel', payload);
        savedFuelLog = response.data.data;
        setFuelLogs((prev) => [savedFuelLog, ...prev]);
        setSuccess('Fuel log created successfully');
      }

      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fuel log');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel log?')) return;
    try {
      await api.delete(`/fuel/${id}`);
      setSuccess('Fuel log deleted successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete fuel log');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Fuel Logs</h1>
            <p className="text-sm text-slate-500">Record and review vehicle fuel usage</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + Add Fuel Log
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading fuel logs...</div>
          ) : fuelLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No fuel logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Trip</th>
                    <th className="px-4 py-3">Liters</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fuelLogs.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.vehicle?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{item.vehicle?.registrationNumber || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.trip ? `${item.trip.source || ''} → ${item.trip.destination || ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.liters}</td>
                      <td className="px-4 py-3 text-slate-700">${Number(item.cost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-700">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(item)} className="text-sm font-medium text-slate-700 hover:text-slate-900">Edit</button>
                          <button onClick={() => handleDelete(item._id)} className="text-sm font-medium text-rose-600 hover:text-rose-700">Delete</button>
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
                <h3 className="text-lg font-semibold text-slate-800">{editingId ? 'Edit Fuel Log' : 'Add Fuel Log'}</h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle</label>
                    <select name="vehicle" value={formData.vehicle} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>{vehicle.registrationNumber} — {vehicle.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Trip (optional)</label>
                    <select name="trip" value={formData.trip} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="">No trip</option>
                      {trips.map((trip) => (
                        <option key={trip._id} value={trip._id}>{trip.source} → {trip.destination}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Liters</label>
                    <input type="number" min="0.01" step="0.01" name="liters" value={formData.liters} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Cost</label>
                    <input type="number" min="0.01" step="0.01" name="cost" value={formData.cost} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        handleSubmit({ preventDefault: () => {}, currentTarget: form });
                      }
                    }}
                    disabled={saving}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update Fuel Log' : 'Save Fuel Log'}
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
