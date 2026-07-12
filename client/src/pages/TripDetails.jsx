import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const WORKFLOW_STATES = [
  'Draft',
  'Vehicle Assigned',
  'Driver Assigned',
  'Route Planned',
  'Ready for Approval',
  'Approved',
  'Ready for Dispatch'
];

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

  // Form states matching details schema
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  const [routeForm, setRouteForm] = useState({
    source: '',
    destination: '',
    stopsInput: '',
    stops: [],
    estimatedDistance: 0,
    estimatedDuration: 0,
  });

  const [cargoForm, setCargoForm] = useState({
    cargoType: '',
    cargoWeight: 0,
    volume: 0,
    packages: 0,
    specialInstructions: '',
  });

  const [checklist, setChecklist] = useState({
    driverAssigned: false,
    vehicleAssigned: false,
    documentsUploaded: false,
    routePlanned: false,
    fuelPlanned: false,
    cargoVerified: false,
    safetyInspection: false,
  });

  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({ name: '', type: 'Driver License' });

  const isFleetManager = user?.role === 'FleetManager';
  const isSafetyOfficer = user?.role === 'SafetyOfficer';
  const isDriver = user?.role === 'Driver';

  // Fetch initial details
  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const tripRes = await api.get(`/trips/${id}`);
      const t = tripRes.data.data;
      setTrip(t);
      
      setSelectedDriver(t.driver?._id || '');
      setSelectedVehicle(t.vehicle?._id || '');
      setPriority(t.priority || 'Medium');
      
      setRouteForm({
        source: t.source || '',
        destination: t.destination || '',
        stopsInput: '',
        stops: t.stops || [],
        estimatedDistance: t.estimatedDistance || 0,
        estimatedDuration: t.estimatedDuration || 0,
      });

      setCargoForm({
        cargoType: t.cargoType || '',
        cargoWeight: t.cargoWeight || 0,
        volume: t.volume || 0,
        packages: t.packages || 0,
        specialInstructions: t.specialInstructions || '',
      });

      setChecklist(t.checklist || {
        driverAssigned: false,
        vehicleAssigned: false,
        documentsUploaded: false,
        routePlanned: false,
        fuelPlanned: false,
        cargoVerified: false,
        safetyInspection: false,
      });

      setDocuments(t.documents || []);

      const driversRes = await api.get('/drivers');
      setDrivers(driversRes.data.data);

      const vehiclesRes = await api.get('/vehicles');
      setVehicles(vehiclesRes.data.data);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Handle Checklist Calculations
  const getChecklistPercentage = () => {
    const total = Object.keys(checklist).length;
    const completed = Object.values(checklist).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  // Auto-fill checklist fields based on form status
  useEffect(() => {
    if (!trip) return;
    setChecklist(prev => ({
      ...prev,
      driverAssigned: !!selectedDriver,
      vehicleAssigned: !!selectedVehicle,
      routePlanned: routeForm.source && routeForm.destination && routeForm.estimatedDistance > 0,
      fuelPlanned: routeForm.estimatedDistance > 0,
      documentsUploaded: documents.length > 0,
    }));
  }, [selectedDriver, selectedVehicle, routeForm.estimatedDistance, routeForm.source, routeForm.destination, documents]);

  // Fuel Calculations
  const ESTIMATED_CONSUMPTION_RATE = 0.15; // liters per km
  const ESTIMATED_FUEL_PRICE = 1.25;      // USD per liter
  const estFuelLiters = Math.round(routeForm.estimatedDistance * ESTIMATED_CONSUMPTION_RATE * 10) / 10;
  const estFuelCost = Math.round(estFuelLiters * ESTIMATED_FUEL_PRICE * 100) / 100;

  // Add Stop
  const handleAddStop = () => {
    if (!routeForm.stopsInput.trim()) return;
    setRouteForm(prev => ({
      ...prev,
      stops: [...prev.stops, prev.stopsInput.trim()],
      stopsInput: '',
    }));
  };

  // Remove Stop
  const handleRemoveStop = (index) => {
    setRouteForm(prev => ({
      ...prev,
      stops: prev.stops.filter((_, idx) => idx !== index),
    }));
  };

  // Mock document upload
  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!docForm.name.trim()) return;
    const newDoc = {
      name: docForm.name.trim(),
      type: docForm.type,
      url: `/uploads/${Date.now()}-${docForm.name.trim()}`,
      uploadedAt: new Date(),
    };
    setDocuments(prev => [...prev, newDoc]);
    setDocForm({ name: '', type: 'Driver License' });
    setSuccess('Document added locally. Make sure to click Save Changes.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRemoveDocument = (index) => {
    setDocuments(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save changes API handler
  const handleSave = async (updatedStatus = null) => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const statusToSave = updatedStatus || determineWorkflowStatus();

      const payload = {
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
        status: statusToSave,
      };

      const res = await api.put(`/trips/${id}`, payload);
      setTrip(res.data.data);
      setSuccess('Trip progress saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Auto determine workflow status based on filled details
  const determineWorkflowStatus = () => {
    if (trip.status === 'Approved' || trip.status === 'Ready for Dispatch' || trip.status === 'Dispatched' || trip.status === 'Completed' || trip.status === 'Cancelled') {
      return trip.status;
    }
    if (trip.status === 'Ready for Approval') {
      return 'Ready for Approval';
    }

    if (!selectedVehicle) return 'Draft';
    if (!selectedDriver) return 'Vehicle Assigned';
    
    const isRoutePlanned = routeForm.source && routeForm.destination && routeForm.estimatedDistance > 0;
    if (!isRoutePlanned) return 'Driver Assigned';

    return 'Route Planned';
  };

  // Approval Handlers
  const handleWorkflowTransition = async (nextState) => {
    // Validate first
    if (nextState === 'Ready for Approval' || nextState === 'Approved') {
      if (!selectedDriver) {
        setError('Validation Error: A driver must be assigned before submitting for approval.');
        return;
      }
      if (!selectedVehicle) {
        setError('Validation Error: A vehicle must be assigned before submitting for approval.');
        return;
      }
      if (!routeForm.source || !routeForm.destination || routeForm.estimatedDistance <= 0) {
        setError('Validation Error: Route details must be completed before submitting for approval.');
        return;
      }
      if (getChecklistPercentage() < 100) {
        setError('Validation Error: All checklist items must be verified before approval.');
        return;
      }
    }

    setError('');
    setSaving(true);
    try {
      const payload = {
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
        status: nextState,
      };

      const res = await api.put(`/trips/${id}`, payload);
      setTrip(res.data.data);
      setSuccess(`Trip status updated to: ${nextState}!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Workflow transition failed.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedDriverDetails = () => {
    return drivers.find(d => d._id === selectedDriver);
  };

  const getSelectedVehicleDetails = () => {
    return vehicles.find(v => v._id === selectedVehicle);
  };

  const isDriverLicenseExpired = (driver) => {
    if (!driver?.licenseExpiryDate) return false;
    return new Date(driver.licenseExpiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium">Loading trip preparation dashboard...</span>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center">
          <h2 className="text-lg font-bold mb-2">Error Loading Trip</h2>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/trips')} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold">
            Return to Trips
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = WORKFLOW_STATES.indexOf(
    WORKFLOW_STATES.includes(trip.status) ? trip.status : 'Draft'
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Banner Toast Alerts */}
        {success && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4 duration-200">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 z-50 bg-rose-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-rose-500 animate-in fade-in slide-in-from-top-4 duration-200">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(user?.role === 'Driver' ? '/my-trips' : '/trips')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition font-medium"
          >
            &larr; Back to Trips List
          </button>
          <span className="text-xs text-slate-400">Trip ID: {trip._id}</span>
        </div>

        {/* Stepper Status Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trip Preparation Stage</h3>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {WORKFLOW_STATES.map((state, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={state} className="flex-1 w-full flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      isCompleted ? 'bg-slate-800 text-white border-slate-800' :
                      isCurrent ? 'bg-slate-50 text-slate-800 border-slate-800 ring-2 ring-slate-800/20 font-bold' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {state}
                    </span>
                  </div>
                  {idx < WORKFLOW_STATES.length - 1 && (
                    <div className={`hidden lg:block flex-1 h-[2px] mx-2 ${idx < currentStepIndex ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Outer Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Sections */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECTION 1: Basic Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">1. Basic Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Source location</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{trip.source}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Destination</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{trip.destination}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Priority</span>
                  {isFleetManager ? (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="mt-1 px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-800/20"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-800 block mt-0.5">{priority}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Workflow Status</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    {trip.status}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Driver Assignment */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">2. Driver Assignment</h2>
              {isFleetManager ? (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Driver</label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/20"
                  >
                    <option value="">-- Unassigned --</option>
                    {drivers.map(d => {
                      const isExpired = isDriverLicenseExpired(d);
                      const isBusy = d.status !== 'Available';
                      const isDisabled = isBusy || isExpired;
                      return (
                        <option
                          key={d._id}
                          value={d._id}
                          disabled={isDisabled && d._id !== trip.driver?._id}
                        >
                          {d.name} ({d.status === 'Available' ? 'Available' : 'Busy: ' + d.status}) {isExpired ? '[Expired License]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : null}

              {selectedDriver ? (
                (() => {
                  const driver = getSelectedDriverDetails();
                  if (!driver) return null;
                  const isExpired = isDriverLicenseExpired(driver);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">Driver Name</span>
                        <span className="font-semibold text-slate-800">{driver.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">License Number</span>
                        <span className="font-semibold text-slate-800">{driver.licenseNumber} ({driver.licenseCategory})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">License Validity</span>
                        <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>
                          {new Date(driver.licenseExpiryDate).toLocaleDateString()} {isExpired ? '(Expired)' : '(Valid)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">Phone / Score / Exp</span>
                        <span className="font-semibold text-slate-800">{driver.contactNumber} / {driver.safetyScore} pts / {driver.experience || 0} yrs</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-slate-400 italic">No driver assigned to this trip.</p>
              )}
            </div>

            {/* SECTION 3: Vehicle Assignment */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">3. Vehicle Assignment</h2>
              {isFleetManager ? (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Vehicle</label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/20"
                  >
                    <option value="">-- Unassigned --</option>
                    {vehicles.map(v => {
                      const isBusy = v.status !== 'Available';
                      return (
                        <option
                          key={v._id}
                          value={v._id}
                          disabled={isBusy && v._id !== trip.vehicle?._id}
                        >
                          {v.registrationNumber} - {v.name} ({v.status})
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : null}

              {selectedVehicle ? (
                (() => {
                  const vehicle = getSelectedVehicleDetails();
                  if (!vehicle) return null;
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">Reg. Number</span>
                        <span className="font-semibold text-slate-800">{vehicle.registrationNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">Model / Type</span>
                        <span className="font-semibold text-slate-800">{vehicle.name} ({vehicle.type})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">Capacity Limit</span>
                        <span className="font-semibold text-slate-800">{vehicle.maxLoadCapacity} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold">Odometer / Fuel</span>
                        <span className="font-semibold text-slate-800">{vehicle.odometer} km / {vehicle.fuelLevel}%</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-slate-400 italic">No vehicle assigned to this trip.</p>
              )}
            </div>

            {/* SECTION 4: Route Planning */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">4. Route Planning</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Location</label>
                    <input
                      type="text"
                      disabled={!isFleetManager}
                      value={routeForm.source}
                      onChange={(e) => setRouteForm({ ...routeForm, source: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Destination</label>
                    <input
                      type="text"
                      disabled={!isFleetManager}
                      value={routeForm.destination}
                      onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Stops */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stops / Waypoints</label>
                  {isFleetManager && (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add stop name"
                        value={routeForm.stopsInput}
                        onChange={(e) => setRouteForm({ ...routeForm, stopsInput: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddStop}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition"
                      >
                        + Add Stop
                      </button>
                    </div>
                  )}

                  {routeForm.stops.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {routeForm.stops.map((stop, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                          <span>{stop}</span>
                          {isFleetManager && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(idx)}
                              className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No intermediate stops added yet.</p>
                  )}
                </div>

                {/* Estimate fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimated Distance (km)</label>
                    <input
                      type="number"
                      disabled={!isFleetManager}
                      min="0"
                      value={routeForm.estimatedDistance}
                      onChange={(e) => setRouteForm({ ...routeForm, estimatedDistance: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimated Duration (mins)</label>
                    <input
                      type="number"
                      disabled={!isFleetManager}
                      min="0"
                      value={routeForm.estimatedDuration}
                      onChange={(e) => setRouteForm({ ...routeForm, estimatedDuration: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: Cargo Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">5. Cargo Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cargo Type</label>
                  <input
                    type="text"
                    disabled={!isFleetManager}
                    placeholder="e.g. Perishable Food"
                    value={cargoForm.cargoType}
                    onChange={(e) => setCargoForm({ ...cargoForm, cargoType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    disabled={!isFleetManager}
                    min="0"
                    value={cargoForm.volume}
                    onChange={(e) => setCargoForm({ ...cargoForm, volume: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Packages Count</label>
                  <input
                    type="number"
                    disabled={!isFleetManager}
                    min="0"
                    value={cargoForm.packages}
                    onChange={(e) => setCargoForm({ ...cargoForm, packages: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    disabled={!isFleetManager}
                    min="0"
                    value={cargoForm.cargoWeight}
                    onChange={(e) => setCargoForm({ ...cargoForm, cargoWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Special Handling Instructions</label>
                  <textarea
                    rows="2"
                    disabled={!isFleetManager}
                    placeholder="e.g. Maintain temperature at 4°C."
                    value={cargoForm.specialInstructions}
                    onChange={(e) => setCargoForm({ ...cargoForm, specialInstructions: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: Fuel Planning */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">6. Fuel Planning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Est. Fuel Required</span>
                    <span className="text-3xl font-extrabold text-slate-800">{estFuelLiters} <span className="text-sm font-semibold text-slate-500">Liters</span></span>
                  </div>
                  <span className="text-slate-400 text-xs mt-3 block">Estimated rate: {ESTIMATED_CONSUMPTION_RATE} L / km</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Estimated Fuel Cost</span>
                    <span className="text-3xl font-extrabold text-slate-800">${estFuelCost} <span className="text-sm font-semibold text-slate-500">USD</span></span>
                  </div>
                  <span className="text-slate-400 text-xs mt-3 block">Market avg price: ${ESTIMATED_FUEL_PRICE} / Liter</span>
                </div>
              </div>
            </div>

            {/* SECTION 8: Document Upload */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">8. Document Checklist Upload</h2>
              
              {isFleetManager && (
                <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">File Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. driver_license_alex.pdf"
                      value={docForm.name}
                      onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Document Category</label>
                    <div className="flex gap-2">
                      <select
                        value={docForm.type}
                        onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                      >
                        <option value="Driver License">Driver License</option>
                        <option value="Vehicle Registration">Vehicle Registration</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Permit">Permit</option>
                        <option value="Other">Other</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {doc.type.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                          <span className="text-[10px] text-slate-600 font-semibold uppercase">{doc.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        {isFleetManager && (
                          <button
                            onClick={() => handleRemoveDocument(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No compliance documents uploaded yet.</p>
              )}
            </div>

          </div>

          {/* Sticky Sidebar Details */}
          <div className="space-y-8">
            
            {/* SECTION 7: Checklist Meter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-20">
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">7. Checklist Progress</h2>
                <span className="text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {getChecklistPercentage()}%
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                <div
                  className="bg-slate-800 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getChecklistPercentage()}%` }}
                />
              </div>

              <div className="space-y-3">
                {[
                  { key: 'driverAssigned', label: 'Driver Assigned', description: 'Available driver linked' },
                  { key: 'vehicleAssigned', label: 'Vehicle Assigned', description: 'Available vehicle linked' },
                  { key: 'routePlanned', label: 'Route Planned', description: 'Source, destination, and distance set' },
                  { key: 'fuelPlanned', label: 'Fuel Planned', description: 'Estimate requirement generated' },
                  { key: 'documentsUploaded', label: 'Documents Uploaded', description: 'License and insurance records attached' },
                  { key: 'cargoVerified', label: 'Cargo Verified', description: 'Manual weight check' },
                  { key: 'safetyInspection', label: 'Safety Inspection', description: 'Vehicle mechanical status check' },
                ].map((item) => {
                  const isChecked = checklist[item.key];
                  const isAuto = ['driverAssigned', 'vehicleAssigned', 'routePlanned', 'fuelPlanned', 'documentsUploaded'].includes(item.key);
                  return (
                    <div key={item.key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        disabled={!isFleetManager || isAuto}
                        checked={isChecked}
                        onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                        className="mt-1 h-4.5 w-4.5 text-slate-800 border-slate-300 rounded focus:ring-slate-850"
                      />
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block leading-tight">{item.label}</label>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.description} {isAuto ? '(Auto-fill)' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 9: Approval Actions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">9. Trip Approvals</h2>
              
              <div className="space-y-3">
                {isFleetManager && (
                  <>
                    <button
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition"
                    >
                      {saving ? 'Saving...' : 'Save Draft Settings'}
                    </button>

                    {trip.status === 'Draft' && (
                      <button
                        onClick={() => handleWorkflowTransition('Ready for Approval')}
                        disabled={saving}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-sm font-semibold transition"
                      >
                        Submit for Approval
                      </button>
                    )}

                    {trip.status === 'Ready for Approval' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWorkflowTransition('Approved')}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
                        >
                          Approve Trip
                        </button>
                        <button
                          onClick={() => handleWorkflowTransition('Draft')}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {trip.status === 'Approved' && (
                      <button
                        onClick={() => handleWorkflowTransition('Ready for Dispatch')}
                        disabled={saving}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        Mark Ready for Dispatch
                      </button>
                    )}
                  </>
                )}

                {isFleetManager && trip.status === 'Ready for Dispatch' && (
                  <button
                    onClick={() => handleWorkflowTransition('Dispatched')}
                    disabled={saving}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Dispatch Trip
                  </button>
                )}

                {!isFleetManager && (
                  <p className="text-xs text-slate-400 text-center italic">
                    Approvals and status transitions are reserved for Fleet Manager accounts.
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 10: Summary Panel Card */}
            <div className="bg-slate-800 border border-slate-900 text-slate-300 rounded-2xl p-6 shadow-sm">
              <h2 className="text-md font-bold text-white border-b border-slate-700 pb-3 mb-4">10. Quick Trip Summary</h2>
              
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Active Status</span>
                  <span className="font-bold text-white text-sm block mt-0.5">{trip.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Assigned Driver</span>
                  <span className="font-medium text-slate-200">
                    {trip.driver ? trip.driver.name : 'None Assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Assigned Vehicle</span>
                  <span className="font-medium text-slate-200">
                    {trip.vehicle ? trip.vehicle.registrationNumber : 'None Assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Total Distance / Duration</span>
                  <span className="font-medium text-slate-200">
                    {routeForm.estimatedDistance} km / {routeForm.estimatedDuration} mins
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Fuel Plan Liters</span>
                  <span className="font-medium text-slate-200">{estFuelLiters} Liters (${estFuelCost})</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Cargo Details</span>
                  <span className="font-medium text-slate-200">
                    {cargoForm.cargoType || 'No details'} ({cargoForm.cargoWeight} kg)
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
