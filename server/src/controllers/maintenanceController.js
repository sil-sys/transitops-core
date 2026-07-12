const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');

// @desc   Get all maintenance logs
// @route  GET /api/maintenance
// @access Private
const getMaintenanceLogs = async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find()
      .populate('vehicle', 'name registrationNumber status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc   Create maintenance log
// @route  POST /api/maintenance
// @access Private
const createMaintenanceLog = async (req, res, next) => {
  try {
    const { vehicle, type, description, cost, startedAt } = req.body;

    if (!vehicle) return next(new ApiError(400, 'Vehicle is required'));
    if (!type) return next(new ApiError(400, 'Maintenance type is required'));
    if (cost === undefined || Number(cost) < 0) return next(new ApiError(400, 'Valid cost is required'));

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) return next(new ApiError(404, 'Vehicle not found'));

    // Create the log
    const log = await MaintenanceLog.create({
      vehicle,
      type,
      description,
      cost: Number(cost),
      status: 'Active',
      startedAt: startedAt || Date.now(),
    });

    // Update vehicle status to 'In Shop'
    if (vehicleExists.status !== 'Retired') {
      vehicleExists.status = 'In Shop';
      await vehicleExists.save();
    }

    const populatedLog = await log.populate('vehicle', 'name registrationNumber status');

    res.status(201).json({ success: true, data: populatedLog });
  } catch (error) {
    next(error);
  }
};

// @desc   Update / Close maintenance log
// @route  PUT /api/maintenance/:id
// @access Private
const updateMaintenanceLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return next(new ApiError(404, 'Maintenance log not found'));

    const { status, cost, description, type, closedAt } = req.body;
    let isClosing = false;

    if (status === 'Closed' && log.status !== 'Closed') {
      isClosing = true;
      log.status = 'Closed';
      log.closedAt = closedAt || Date.now();
    }

    if (cost !== undefined) log.cost = Number(cost);
    if (description !== undefined) log.description = description;
    if (type !== undefined) log.type = type;

    await log.save();

    // If closing, update vehicle status
    if (isClosing) {
      const vehicle = await Vehicle.findById(log.vehicle);
      if (vehicle && vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    const updatedLog = await MaintenanceLog.findById(log._id).populate('vehicle', 'name registrationNumber status');

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
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return next(new ApiError(404, 'Maintenance log not found'));

    await MaintenanceLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceLogs,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog
};
