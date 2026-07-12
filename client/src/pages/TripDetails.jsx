import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PREP_STAGES = [
  'Draft',
  'Vehicle Assigned',
  'Driver Assigned',
  'Route Planned',
  'Ready for Dispatch',
];

const TERMINAL_STAGES = ['Dispatched', 'Completed', 'Cancelled'];

const STATUS_COLORS = {
  'Draft': 'bg-slate-100 text-slate-700 border-slate-300',
  'Vehicle Assigned': 'bg-blue-50 text-blue-700 border-blue-200',
  'Driver Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Route Planned': 'bg-purple-50 text-purple-700 border-purple-200',
  'Ready for Dispatch': 'bg-teal-50 text-teal-700 border-teal-200',
  'Dispatched': 'bg-blue-100 text-blue-800 border-blue-300',
  'Completed': 'bg-green-100 text-green-800 border-green-300',
  'Cancelled': 'bg-rose-100 text-rose-800 border-rose-300',
};

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // {label, status, color}

  // Form state
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [routeForm, setRouteForm] = useState({
    source: '', destination: '', stopsInput: '', stops: [],
    estimatedDistance: 0, estimatedDuration: 0,
  });
  const [cargoForm, setCargoForm] = useState({
    cargoType: '', cargoWeight: 0, volume: 0,
    packages: 0, specialInstructions: '',
  });
  const [checklist, setChecklist] = useState({
    driverAssigned: false, vehicleAssigned: false, documentsUploaded: false,
    routePlanned: false, fuelPlanned: false, cargoVerified: false, safetyInspection: false,
  });
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({ name: '', type: 'Driver License' });

  const isFleetManager = user?.role === 'FleetManager';
  const isSafetyOfficer = user?.role === 'SafetyOfficer';
  const isReadOnly = !isFleetManager || TERMINAL_STAGES.includes(trip?.status);

  const FUEL_RATE = 0.15; // L/km
  const FUEL_PRICE = 1.25; // $/L
  const estFuelLiters = Math.round(routeForm.estimatedDistance * FUEL_RATE * 10) / 10;
  const estFuelCost = Math.round(estFuelLiters * FUEL_PRICE * 100) / 100;

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tripRes, driversRes, vehiclesRes] = await Promise.all([
        api.get(`/trips/${id}`),
        api.get('/drivers'),
        api.get('/vehicles'),
      ]);
      const t = tripRes.data.data;
      setTrip(t);
      setDrivers(driversRes.data.data);
      setVehicles(vehiclesRes.data.data);
      setSelectedDriver(t.driver?._id || '');
      setSelectedVehicle(t.vehicle?._id || '');
      setPriority(t.priority || 'Medium');
      setRouteForm({
        source: t.source || '', destination: t.destination || '',
        stopsInput: '', stops: t.stops || [],
        estimatedDistance: t.estimatedDistance || 0,
        estimatedDuration: t.estimatedDuration || 0,
      });
      setCargoForm({
        cargoType: t.cargoType || '', cargoWeight: t.cargoWeight || 0,
        volume: t.volume || 0, packages: t.packages || 0,
        specialInstructions: t.specialInstructions || '',
      });
      setChecklist(t.checklist || {
        driverAssigned: false, vehicleAssigned: false, documentsUploaded: false,
        routePlanned: false, fuelPlanned: false, cargoVerified: false, safetyInspection: false,
      });
      setDocuments(t.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // Auto-sync checklist with form state
  useEffect(() => {
    if (!trip) return;
    setChecklist(prev => ({
      ...prev,
      driverAssigned: !!selectedDriver,
      vehicleAssigned: !!selectedVehicle,
      routePlanned: !!(routeForm.source && routeForm.destination && routeForm.estimatedDistance > 0),
      fuelPlanned: routeForm.estimatedDistance > 0,
      documentsUploaded: documents.length > 0,
    }));
  }, [selectedDriver, selectedVehicle, routeForm.source, routeForm.destination, routeForm.estimatedDistance, documents]);

  const checklistPct = () => {
    const vals = Object.values(checklist);
    return Math.round((vals.filter(Boolean).length / vals.length) * 100);
  };

  const showToast = (msg, isErr = false) => {
    if (isErr) { setError(msg); setTimeout(() => setError(''), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  };

  const buildPayload = (overrideStatus = null) => ({
    driver: selectedDriver || null,
    vehicle: selectedVehicle || null,
    priority,
    stops: routeForm.stops,
    estimatedDistance: routeForm.estimatedDistance,
    estimatedDuration: routeForm.estimatedDuration,
    cargoType: cargoForm.cargoType,
    cargoWeight: cargoForm.cargoWeight,
    volume: cargoForm.volume,
    packages: cargoForm.packages,
    specialInstructions: cargoForm.specialInstructions,
    checklist,
    documents,
    ...(overrideStatus ? { status: overrideStatus } : {}),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const autoStatus = () => {
        const s = trip.status;
        if (TERMINAL_STAGES.includes(s)) return s;
        if (!selectedVehicle) return 'Draft';
        if (!selectedDriver) return 'Vehicle Assigned';
        const routed = routeForm.source && routeForm.destination && routeForm.estimatedDistance > 0;
        if (!routed) return 'Driver Assigned';
        return 'Route Planned';
      };
      const res = await api.put(`/trips/${id}`, buildPayload(autoStatus()));
      setTrip(res.data.data);
      showToast('Changes saved!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (nextStatus) => {
    // Validate before critical approval transitions
    if (['Ready for Dispatch', 'Dispatched'].includes(nextStatus)) {
      if (!selectedDriver) return showToast('A driver must be assigned first.', true);
      if (!selectedVehicle) return showToast('A vehicle must be assigned first.', true);
      if (!routeForm.source || !routeForm.destination || routeForm.estimatedDistance <= 0) {
        return showToast('Route details (source, destination, distance) must be complete.', true);
      }
      if (nextStatus === 'Dispatched' && checklistPct() < 100) {
        return showToast('All checklist items must be verified before dispatching.', true);
      }
    }
    setSaving(true);
    try {
      const res = await api.put(`/trips/${id}`, buildPayload(nextStatus));
      setTrip(res.data.data);
      showToast(`Status updated to: ${nextStatus}`);
      setConfirmAction(null);
      // Reload to reflect live vehicle/driver status changes
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Transition failed.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStop = () => {
    if (!routeForm.stopsInput.trim()) return;
    setRouteForm(p => ({ ...p, stops: [...p.stops, p.stopsInput.trim()], stopsInput: '' }));
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!docForm.name.trim()) return;
    setDocuments(p => [...p, { name: docForm.name.trim(), type: docForm.type, url: `/uploads/${Date.now()}`, uploadedAt: new Date() }]);
    setDocForm({ name: '', type: 'Driver License' });
  };

  const getDriverById = (dId) => drivers.find(d => d._id === dId);
  const getVehicleById = (vId) => vehicles.find(v => v._id === vId);
  const isExpiredLicense = (d) => d?.licenseExpiryDate && new Date(d.licenseExpiryDate) < new Date();

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600 font-medium text-sm">Loading trip details...</span>
      </div>
    </div>
  );

  if (!trip) return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
        <h2 className="text-lg font-bold text-rose-800 mb-2">Trip Not Found</h2>
        <p className="text-sm text-rose-600 mb-4">{error}</p>
        <button onClick={() => navigate('/trips')} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold">Back to Trips</button>
      </div>
    </div>
  );

  const isDispatched = trip.status === 'Dispatched';
  const isCompleted = trip.status === 'Completed';
  const isCancelled = trip.status === 'Cancelled';
  const isTerminal = isCompleted || isCancelled;
  const prepStepIndex = PREP_STAGES.includes(trip.status) ? PREP_STAGES.indexOf(trip.status) : (TERMINAL_STAGES.includes(trip.status) ? PREP_STAGES.length : 0);
  const selectedDriverObj = getDriverById(selectedDriver);
  const selectedVehicleObj = getVehicleById(selectedVehicle);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Toast: Success */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}
      {/* Toast: Error */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-rose-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-rose-600 max-w-md">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction.iconBg}`}>
              {confirmAction.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmAction.label}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={() => handleTransition(confirmAction.nextStatus)}
                className={`flex-1 py-2 text-white rounded-lg text-sm font-semibold shadow-md transition ${confirmAction.btnClass}`}
              >
                {saving ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button onClick={() => navigate('/trips')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-3 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Back to Trips
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              {trip.source} <span className="text-slate-400 font-normal">→</span> {trip.destination}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[trip.status]}`}>
                {trip.status}
              </span>
              <span className="text-xs text-slate-400">ID: {trip._id.slice(-8).toUpperCase()}</span>
              <span className="text-xs text-slate-400">Created: {new Date(trip.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Active Status Banner for dispatched/completed/cancelled */}
          {isDispatched && (
            <div className="bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block"></span>
              <div>
                <p className="font-bold text-sm">Trip is Active</p>
                <p className="text-xs text-blue-200">Dispatched {trip.dispatchedAt ? new Date(trip.dispatchedAt).toLocaleString() : ''}</p>
              </div>
            </div>
          )}
          {isCompleted && (
            <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <div>
                <p className="font-bold text-sm">Trip Completed</p>
                <p className="text-xs text-emerald-200">{trip.completedAt ? new Date(trip.completedAt).toLocaleString() : ''}</p>
              </div>
            </div>
          )}
          {isCancelled && (
            <div className="bg-rose-600 text-white px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              <div>
                <p className="font-bold text-sm">Trip Cancelled</p>
                <p className="text-xs text-rose-200">{trip.completedAt ? new Date(trip.completedAt).toLocaleString() : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Preparation Stepper - only shown for prep stages */}
        {!TERMINAL_STAGES.includes(trip.status) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Preparation Progress</p>
            <div className="flex items-center min-w-max gap-0">
              {PREP_STAGES.map((stage, idx) => {
                const done = idx < prepStepIndex;
                const current = idx === prepStepIndex;
                return (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        done ? 'bg-slate-800 border-slate-800 text-white' :
                        current ? 'bg-white border-slate-800 text-slate-800 ring-2 ring-slate-800/20' :
                        'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] font-semibold text-center whitespace-nowrap max-w-[70px] leading-tight ${current ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                        {stage}
                      </span>
                    </div>
                    {idx < PREP_STAGES.length - 1 && (
                      <div className={`h-0.5 flex-1 min-w-8 mx-1 mb-4 ${done ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Integration Status Banner (shows live driver/vehicle assignment state) */}
        {(trip.driver || trip.vehicle) && (
          <div className={`rounded-2xl p-4 border flex items-start gap-4 flex-wrap ${
            isDispatched ? 'bg-blue-50 border-blue-200' :
            isCompleted ? 'bg-emerald-50 border-emerald-200' :
            isCancelled ? 'bg-rose-50 border-rose-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 w-full mb-1">
              🔗 Active Integration Status
            </div>
            {trip.driver && (
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                  {trip.driver.name?.[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{trip.driver.name}</p>
                  <p className={`text-[10px] font-bold uppercase ${
                    trip.driver.status === 'On Trip' ? 'text-blue-600' :
                    trip.driver.status === 'Available' ? 'text-emerald-600' : 'text-slate-500'
                  }`}>Driver • {trip.driver.status}</p>
                </div>
              </div>
            )}
            {trip.vehicle && (
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                  🚛
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{trip.vehicle.registrationNumber}</p>
                  <p className={`text-[10px] font-bold uppercase ${
                    trip.vehicle.status === 'On Trip' ? 'text-blue-600' :
                    trip.vehicle.status === 'Available' ? 'text-emerald-600' : 'text-slate-500'
                  }`}>Vehicle • {trip.vehicle.status}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: form sections */}
          <div className="lg:col-span-2 space-y-6">

            {/* Section 1: Driver Assignment */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-base font-bold text-slate-800">Driver Assignment</h2>
                {selectedDriver && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    isExpiredLicense(selectedDriverObj) ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isExpiredLicense(selectedDriverObj) ? 'License Expired' : 'License Valid'}
                  </span>
                )}
              </div>

              {isFleetManager && !isTerminal && !isDispatched && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Select Driver</label>
                  <select
                    value={selectedDriver}
                    onChange={e => setSelectedDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/20"
                  >
                    <option value="">— Unassigned —</option>
                    {drivers.map(d => {
                      const expired = isExpiredLicense(d);
                      const busy = d.status !== 'Available' && d._id !== trip.driver?._id;
                      return (
                        <option key={d._id} value={d._id} disabled={busy || expired}>
                          {d.name} — {d.status} {expired ? '[Expired License]' : ''} {busy ? '[Busy]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {selectedDriverObj ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Name', value: selectedDriverObj.name },
                    { label: 'License', value: `${selectedDriverObj.licenseNumber} (${selectedDriverObj.licenseCategory})` },
                    { label: 'Expiry', value: <span className={isExpiredLicense(selectedDriverObj) ? 'text-rose-600 font-semibold' : ''}>{new Date(selectedDriverObj.licenseExpiryDate).toLocaleDateString()}</span> },
                    { label: 'Safety Score / Exp', value: `${selectedDriverObj.safetyScore}/100 · ${selectedDriverObj.experience || 0} yrs` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-slate-400 block font-semibold uppercase text-[10px]">{label}</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No driver assigned.</p>
              )}
            </div>

            {/* Section 2: Vehicle Assignment */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-base font-bold text-slate-800">Vehicle Assignment</h2>
                {selectedVehicleObj && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Fuel:</span>
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${selectedVehicleObj.fuelLevel > 40 ? 'bg-emerald-500' : selectedVehicleObj.fuelLevel > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${selectedVehicleObj.fuelLevel || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{selectedVehicleObj.fuelLevel || 0}%</span>
                  </div>
                )}
              </div>

              {isFleetManager && !isTerminal && !isDispatched && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Select Vehicle</label>
                  <select
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/20"
                  >
                    <option value="">— Unassigned —</option>
                    {vehicles.map(v => {
                      const busy = v.status !== 'Available' && v._id !== trip.vehicle?._id;
                      return (
                        <option key={v._id} value={v._id} disabled={busy}>
                          {v.registrationNumber} — {v.name} ({v.status}) {busy ? '[Busy]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {selectedVehicleObj ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Registration', value: selectedVehicleObj.registrationNumber },
                    { label: 'Model / Type', value: `${selectedVehicleObj.name} (${selectedVehicleObj.type})` },
                    { label: 'Max Capacity', value: `${selectedVehicleObj.maxLoadCapacity} kg` },
                    { label: 'Odometer', value: `${selectedVehicleObj.odometer?.toLocaleString() || 0} km` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-slate-400 block font-semibold uppercase text-[10px]">{label}</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No vehicle assigned.</p>
              )}
            </div>

            {/* Section 3: Route Planning */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Route Planning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Start Location', field: 'source', placeholder: 'e.g. New York Hub' },
                  { label: 'Destination', field: 'destination', placeholder: 'e.g. Boston Facility' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder={placeholder}
                      value={routeForm[field]}
                      onChange={e => setRouteForm(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimated Distance (km)</label>
                  <input
                    type="number" min="0" disabled={isReadOnly}
                    value={routeForm.estimatedDistance}
                    onChange={e => setRouteForm(p => ({ ...p, estimatedDistance: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimated Duration (mins)</label>
                  <input
                    type="number" min="0" disabled={isReadOnly}
                    value={routeForm.estimatedDuration}
                    onChange={e => setRouteForm(p => ({ ...p, estimatedDuration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Stops */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Intermediate Stops</label>
                {isFleetManager && !isReadOnly && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text" placeholder="Add stop name..."
                      value={routeForm.stopsInput}
                      onChange={e => setRouteForm(p => ({ ...p, stopsInput: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddStop())}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                    />
                    <button type="button" onClick={handleAddStop} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition">
                      + Add
                    </button>
                  </div>
                )}
                {routeForm.stops.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {routeForm.stops.map((stop, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                        {stop}
                        {isFleetManager && !isReadOnly && (
                          <button onClick={() => setRouteForm(p => ({ ...p, stops: p.stops.filter((_, idx) => idx !== i) }))} className="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No stops added.</p>
                )}
              </div>
            </div>

            {/* Section 4: Cargo */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Cargo Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Cargo Type', field: 'cargoType', type: 'text', placeholder: 'e.g. Perishables' },
                  { label: 'Weight (kg)', field: 'cargoWeight', type: 'number', placeholder: '0' },
                  { label: 'Volume (m³)', field: 'volume', type: 'number', placeholder: '0' },
                  { label: 'Packages', field: 'packages', type: 'number', placeholder: '0' },
                ].map(({ label, field, type, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>
                    <input
                      type={type} disabled={isReadOnly} placeholder={placeholder}
                      value={cargoForm[field]}
                      onChange={e => setCargoForm(p => ({ ...p, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                ))}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Special Instructions</label>
                  <textarea
                    rows="2" disabled={isReadOnly}
                    placeholder="e.g. Handle with care, temperature-sensitive"
                    value={cargoForm.specialInstructions}
                    onChange={e => setCargoForm(p => ({ ...p, specialInstructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Documents */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Compliance Documents</h2>
              {isFleetManager && !isReadOnly && (
                <form onSubmit={handleAddDocument} className="flex gap-3 mb-4 flex-wrap bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <input
                    type="text" required placeholder="e.g. driver_license.pdf"
                    value={docForm.name}
                    onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 min-w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
                  />
                  <select
                    value={docForm.type}
                    onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
                  >
                    {['Driver License', 'Vehicle Registration', 'Insurance', 'Permit', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700">+ Add Doc</button>
                </form>
              )}
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">{doc.type.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        {isFleetManager && !isReadOnly && (
                          <button onClick={() => setDocuments(p => p.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-600 text-xs font-semibold">Remove</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
              )}
            </div>

            {/* Trip History / Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Trip Timeline</h2>
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-2">
                {[
                  {
                    num: 1, title: 'Draft Initiated', done: true,
                    time: new Date(trip.createdAt).toLocaleString(),
                    color: 'bg-slate-800 text-white',
                  },
                  {
                    num: 2, title: 'Dispatched', done: !!trip.dispatchedAt,
                    time: trip.dispatchedAt ? new Date(trip.dispatchedAt).toLocaleString() : 'Not yet dispatched',
                    color: trip.dispatchedAt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200',
                    pending: !trip.dispatchedAt,
                  },
                  {
                    num: 3, title: trip.status === 'Cancelled' ? 'Trip Cancelled' : 'Trip Completed',
                    done: !!trip.completedAt,
                    time: trip.completedAt ? new Date(trip.completedAt).toLocaleString() : 'In progress',
                    color: trip.completedAt
                      ? (trip.status === 'Cancelled' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white')
                      : 'bg-slate-100 text-slate-400 border border-slate-200',
                    pending: !trip.completedAt,
                  },
                ].map(({ num, title, done, time, color, pending }) => (
                  <div key={num} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white ${color}`}>{num}</div>
                    <h4 className={`text-sm font-semibold ${pending ? 'text-slate-400' : 'text-slate-800'}`}>{title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{time}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Fuel Estimates */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Fuel Planning</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Est. Fuel</p>
                  <p className="text-2xl font-extrabold text-slate-800">{estFuelLiters}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Liters</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Est. Cost</p>
                  <p className="text-2xl font-extrabold text-slate-800">${estFuelCost}</p>
                  <p className="text-xs text-slate-400 mt-0.5">USD</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 text-center">Rate: {FUEL_RATE} L/km · ${FUEL_PRICE}/L</p>
            </div>

            {/* Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-base font-bold text-slate-800">Checklist</h2>
                <span className="text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">{checklistPct()}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${checklistPct() === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  style={{ width: `${checklistPct()}%` }}
                />
              </div>
              <div className="space-y-2.5">
                {[
                  { key: 'driverAssigned', label: 'Driver Assigned', auto: true },
                  { key: 'vehicleAssigned', label: 'Vehicle Assigned', auto: true },
                  { key: 'routePlanned', label: 'Route Planned', auto: true },
                  { key: 'fuelPlanned', label: 'Fuel Planned', auto: true },
                  { key: 'documentsUploaded', label: 'Documents Uploaded', auto: true },
                  { key: 'cargoVerified', label: 'Cargo Verified', auto: false },
                  { key: 'safetyInspection', label: 'Safety Inspection', auto: false },
                ].map(({ key, label, auto }) => {
                  const checked = checklist[key];
                  return (
                    <label key={key} className={`flex items-center gap-3 p-2 rounded-lg transition cursor-pointer ${checked ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={auto || !isFleetManager || isReadOnly}
                        onChange={e => setChecklist(p => ({ ...p, [key]: e.target.checked }))}
                        className="w-4 h-4 text-slate-800 border-slate-300 rounded"
                      />
                      <span className={`text-sm font-medium flex-1 ${checked ? 'text-slate-700' : 'text-slate-500'}`}>{label}</span>
                      {auto && <span className="text-[9px] text-slate-400 font-semibold uppercase">Auto</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Panel */}
            {isFleetManager && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Actions</h2>
                <div className="space-y-2.5">

                  {/* SAVE - available in prep stages */}
                  {!isTerminal && !isDispatched && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                  )}

                  {/* MARK READY FOR DISPATCH */}
                  {['Draft', 'Vehicle Assigned', 'Driver Assigned', 'Route Planned'].includes(trip.status) && (
                    <button
                      onClick={() => handleTransition('Ready for Dispatch')}
                      disabled={saving}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      Mark Ready for Dispatch
                    </button>
                  )}

                  {/* DISPATCH — KEY INTEGRATION ACTION */}
                  {trip.status === 'Ready for Dispatch' && (
                    <button
                      onClick={() => setConfirmAction({
                        nextStatus: 'Dispatched',
                        label: 'Dispatch Trip?',
                        message: `This will set the Driver (${trip.driver?.name || 'Assigned'}) and Vehicle (${trip.vehicle?.registrationNumber || 'Assigned'}) to "On Trip" status.`,
                        btnClass: 'bg-blue-600 hover:bg-blue-700',
                        iconBg: 'bg-blue-100',
                        icon: <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                      })}
                      disabled={saving}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-md"
                    >
                      ⚡ Dispatch Trip
                    </button>
                  )}

                  {/* COMPLETE — KEY INTEGRATION ACTION */}
                  {isDispatched && (
                    <button
                      onClick={() => setConfirmAction({
                        nextStatus: 'Completed',
                        label: 'Complete Trip?',
                        message: `This will release the Driver and Vehicle back to "Available" status.`,
                        btnClass: 'bg-emerald-600 hover:bg-emerald-700',
                        iconBg: 'bg-emerald-100',
                        icon: <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
                      })}
                      disabled={saving}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md"
                    >
                      ✓ Complete Trip
                    </button>
                  )}

                  {/* CANCEL — KEY INTEGRATION ACTION */}
                  {!isTerminal && (
                    <button
                      onClick={() => setConfirmAction({
                        nextStatus: 'Cancelled',
                        label: 'Cancel Trip?',
                        message: `This will release the Driver and Vehicle back to "Available" status and mark the trip as Cancelled.`,
                        btnClass: 'bg-rose-600 hover:bg-rose-700',
                        iconBg: 'bg-rose-100',
                        icon: <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
                      })}
                      disabled={saving}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-semibold transition"
                    >
                      Cancel Trip
                    </button>
                  )}

                  {isTerminal && (
                    <p className="text-xs text-slate-400 text-center italic py-2">
                      This trip is in a terminal state. No further actions available.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-white border-b border-slate-700 pb-3 mb-4">Trip Summary</h2>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Status', value: trip.status, bold: true, white: true },
                  { label: 'Priority', value: priority },
                  { label: 'Route', value: `${trip.source} → ${trip.destination}` },
                  { label: 'Distance', value: `${routeForm.estimatedDistance} km` },
                  { label: 'Duration', value: `${routeForm.estimatedDuration} mins` },
                  { label: 'Cargo', value: `${cargoForm.cargoType || 'N/A'} · ${cargoForm.cargoWeight} kg` },
                  { label: 'Driver', value: trip.driver?.name || 'Not Assigned' },
                  { label: 'Vehicle', value: trip.vehicle?.registrationNumber || 'Not Assigned' },
                  { label: 'Fuel Plan', value: `${estFuelLiters} L · $${estFuelCost}` },
                  { label: 'Checklist', value: `${checklistPct()}%` },
                ].map(({ label, value, bold, white }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">{label}</span>
                    <span className={`font-medium ${white ? 'text-white font-bold' : 'text-slate-200'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
