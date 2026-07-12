const Driver = require('../models/Driver');
const ApiError = require('../utils/ApiError');

// @desc   Get all drivers
// @route  GET /api/drivers
// @access Private
const getDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single driver
// @route  GET /api/drivers/:id
// @access Private
const getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return next(new ApiError(404, 'Driver not found'));
    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc   Create driver
// @route  POST /api/drivers
// @access Private
const createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A driver with this license number already exists'));
    }
    next(error);
  }
};

// @desc   Update driver
// @route  PUT /api/drivers/:id
// @access Private
const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!driver) return next(new ApiError(404, 'Driver not found'));
    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A driver with this license number already exists'));
    }
    next(error);
  }
};

// @desc   Delete driver
// @route  DELETE /api/drivers/:id
// @access Private
const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return next(new ApiError(404, 'Driver not found'));
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDrivers, getDriver, createDriver, updateDriver, deleteDriver };
