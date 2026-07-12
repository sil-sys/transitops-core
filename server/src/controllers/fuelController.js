const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');

const serializeFuelLog = (fuelLog) => {
  if (!fuelLog) return fuelLog;

  const object = fuelLog.toObject ? fuelLog.toObject() : fuelLog;
  return {
    ...object,
    liters: Number(object.liters),
    cost: Number(object.cost),
  };
};

// @desc   Get all fuel logs
// @route  GET /api/fuel
// @access Private
const getFuelLogs = async (req, res, next) => {
  try {
    const fuelLogs = await FuelLog.find()
      .populate('vehicle', 'name registrationNumber')
      .populate('trip', 'source destination')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: fuelLogs.length, data: fuelLogs.map(serializeFuelLog) });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single fuel log
// @route  GET /api/fuel/:id
// @access Private
const getFuelLog = async (req, res, next) => {
  try {
    const fuelLog = await FuelLog.findById(req.params.id)
      .populate('vehicle', 'name registrationNumber')
      .populate('trip', 'source destination');

    if (!fuelLog) return next(new ApiError(404, 'Fuel log not found'));

    res.status(200).json({ success: true, data: serializeFuelLog(fuelLog) });
  } catch (error) {
    next(error);
  }
};

// @desc   Create fuel log
// @route  POST /api/fuel
// @access Private
const createFuelLog = async (req, res, next) => {
  try {
    const { vehicle, trip, liters, cost, date } = req.body;

    if (!vehicle) return next(new ApiError(400, 'Vehicle is required'));
    if (!liters || Number(liters) <= 0) return next(new ApiError(400, 'Liters must be greater than 0'));
    if (!cost || Number(cost) <= 0) return next(new ApiError(400, 'Cost must be greater than 0'));

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) return next(new ApiError(404, 'Vehicle not found'));

    if (trip) {
      const tripExists = await Trip.findById(trip);
      if (!tripExists) return next(new ApiError(404, 'Trip not found'));
    }

    const fuelLog = await FuelLog.create({
      vehicle,
      trip: trip || null,
      liters: Number(liters),
      cost: Number(cost),
      date: date || new Date(),
    });

    const populatedFuelLog = await fuelLog.populate('vehicle', 'name registrationNumber').populate('trip', 'source destination');

    res.status(201).json({ success: true, data: serializeFuelLog(populatedFuelLog) });
  } catch (error) {
    next(error);
  }
};

// @desc   Update fuel log
// @route  PUT /api/fuel/:id
// @access Private
const updateFuelLog = async (req, res, next) => {
  try {
    const fuelLog = await FuelLog.findById(req.params.id);
    if (!fuelLog) return next(new ApiError(404, 'Fuel log not found'));

    const { vehicle, trip, liters, cost, date } = req.body;

    if (vehicle) {
      const vehicleExists = await Vehicle.findById(vehicle);
      if (!vehicleExists) return next(new ApiError(404, 'Vehicle not found'));
    }

    if (trip) {
      const tripExists = await Trip.findById(trip);
      if (!tripExists) return next(new ApiError(404, 'Trip not found'));
    }

    if (liters !== undefined && Number(liters) <= 0) return next(new ApiError(400, 'Liters must be greater than 0'));
    if (cost !== undefined && Number(cost) <= 0) return next(new ApiError(400, 'Cost must be greater than 0'));

    const updatedFuelLog = await FuelLog.findByIdAndUpdate(
      req.params.id,
      {
        ...(vehicle ? { vehicle } : {}),
        ...(trip !== undefined ? { trip: trip || null } : {}),
        ...(liters !== undefined ? { liters: Number(liters) } : {}),
        ...(cost !== undefined ? { cost: Number(cost) } : {}),
        ...(date ? { date } : {}),
      },
      { new: true, runValidators: true }
    )
      .populate('vehicle', 'name registrationNumber')
      .populate('trip', 'source destination');

    res.status(200).json({ success: true, data: serializeFuelLog(updatedFuelLog) });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete fuel log
// @route  DELETE /api/fuel/:id
// @access Private
const deleteFuelLog = async (req, res, next) => {
  try {
    const fuelLog = await FuelLog.findById(req.params.id);
    if (!fuelLog) return next(new ApiError(404, 'Fuel log not found'));

    await FuelLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFuelLogs, getFuelLog, createFuelLog, updateFuelLog, deleteFuelLog };
