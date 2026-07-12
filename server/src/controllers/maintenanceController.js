const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');

// @desc   Get all maintenance logs
// @route  GET /api/maintenance
// @access Private
const getMaintenanceLogs = async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find().populate('vehicle', 'name registrationNumber status').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single maintenance log
// @route  GET /api/maintenance/:id
// @access Private
const getMaintenanceLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle', 'name registrationNumber status');
    if (!log) return next(new ApiError(404, 'Maintenance log not found'));
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc   Create maintenance log
// @route  POST /api/maintenance
// @access Private
const createMaintenanceLog = async (req, res, next) => {
  try {
    // Check if vehicle exists
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) {
      return next(new ApiError(404, 'Vehicle not found'));
    }

    // Force status to Active on creation
    req.body.status = 'Active';
    const log = await MaintenanceLog.create(req.body);

    // Update vehicle status to 'In Shop'
    vehicle.status = 'In Shop';
    await vehicle.save();

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc   Update maintenance log (Used for closing)
// @route  PUT /api/maintenance/:id
// @access Private
const updateMaintenanceLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return next(new ApiError(404, 'Maintenance log not found'));

    // Check if we are closing the maintenance
    const isClosing = req.body.status === 'Closed' && log.status !== 'Closed';

    if (isClosing) {
      req.body.closedAt = Date.now();
    }

    const updatedLog = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (isClosing) {
      // Update vehicle status back to 'Available' unless it is 'Retired'
      const vehicle = await Vehicle.findById(log.vehicle);
      if (vehicle && vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    res.status(200).json({ success: true, data: updatedLog });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete maintenance log
// @route  DELETE /api/maintenance/:id
// @access Private
const deleteMaintenanceLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findByIdAndDelete(req.params.id);
    if (!log) return next(new ApiError(404, 'Maintenance log not found'));
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceLogs,
  getMaintenanceLog,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
};
