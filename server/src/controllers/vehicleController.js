const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');

// @desc   Get all vehicles (optional filters: type, status, region)
// @route  GET /api/vehicles
// @access Private
const getVehicles = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.region) filter.region = req.query.region;

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single vehicle
// @route  GET /api/vehicles/:id
// @access Private
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return next(new ApiError(404, 'Vehicle not found'));
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc   Create vehicle
// @route  POST /api/vehicles
// @access Private (FleetManager only)
const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A vehicle with this registration number already exists'));
    }
    next(error);
  }
};

// @desc   Update vehicle
// @route  PUT /api/vehicles/:id
// @access Private (FleetManager only)
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) return next(new ApiError(404, 'Vehicle not found'));
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A vehicle with this registration number already exists'));
    }
    next(error);
  }
};

// @desc   Delete vehicle
// @route  DELETE /api/vehicles/:id
// @access Private (FleetManager only)
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return next(new ApiError(404, 'Vehicle not found'));
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle };