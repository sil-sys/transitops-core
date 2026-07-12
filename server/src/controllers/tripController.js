const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');

// @desc   Get all trips (filtered by role)
// @route  GET /api/trips
// @access Private
const getTrips = async (req, res, next) => {
  try {
    const filter = {};

    // If user is a Driver, only show trips assigned to them
    if (req.user.role === 'Driver') {
      const driverDoc = await Driver.findOne({ name: req.user.name });
      if (!driverDoc) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      filter.driver = driverDoc._id;
    }

    const trips = await Trip.find(filter)
      .populate('driver')
      .populate('vehicle')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single trip
// @route  GET /api/trips/:id
// @access Private
const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driver')
      .populate('vehicle');

    if (!trip) return next(new ApiError(404, 'Trip not found'));

    // If user is a Driver, make sure it's their trip
    if (req.user.role === 'Driver') {
      const driverDoc = await Driver.findOne({ name: req.user.name });
      if (!driverDoc || trip.driver?._id.toString() !== driverDoc._id.toString()) {
        return next(new ApiError(403, 'You are not authorized to view this trip'));
      }
    }

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc   Create trip
// @route  POST /api/trips
// @access Private (FleetManager only)
const createTrip = async (req, res, next) => {
  try {
    const tripData = {
      ...req.body,
      status: 'Draft',
      checklist: {
        driverAssigned: false,
        vehicleAssigned: false,
        documentsUploaded: false,
        routePlanned: false,
        fuelPlanned: false,
        cargoVerified: false,
        safetyInspection: false,
      }
    };

    const trip = await Trip.create(tripData);
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc   Update trip
// @route  PUT /api/trips/:id
// @access Private (FleetManager/Driver/SafetyOfficer role-based updates)
const updateTrip = async (req, res, next) => {
  try {
    let trip = await Trip.findById(req.params.id);
    if (!trip) return next(new ApiError(404, 'Trip not found'));

    // Authorization checks
    if (req.user.role === 'Driver') {
      const driverDoc = await Driver.findOne({ name: req.user.name });
      if (!driverDoc || trip.driver?.toString() !== driverDoc._id.toString()) {
        return next(new ApiError(403, 'You are not authorized to update this trip'));
      }
    }

    const previousDriver = trip.driver ? trip.driver.toString() : null;
    const previousVehicle = trip.vehicle ? trip.vehicle.toString() : null;

    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('driver').populate('vehicle');

    // Update Driver Availability if modified
    const currentDriver = trip.driver ? trip.driver._id.toString() : null;
    if (currentDriver !== previousDriver) {
      if (previousDriver) {
        await Driver.findByIdAndUpdate(previousDriver, { status: 'Available' });
      }
      if (currentDriver) {
        await Driver.findByIdAndUpdate(currentDriver, { status: 'On Trip' });
      }
    }

    // Update Vehicle Availability if modified
    const currentVehicle = trip.vehicle ? trip.vehicle._id.toString() : null;
    if (currentVehicle !== previousVehicle) {
      if (previousVehicle) {
        await Vehicle.findByIdAndUpdate(previousVehicle, { status: 'Available' });
      }
      if (currentVehicle) {
        await Vehicle.findByIdAndUpdate(currentVehicle, { status: 'On Trip' });
      }
    }

    // Handle terminal status completions and cancellations
    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      if (trip.driver) await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Available' });
      if (trip.vehicle) await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'Available' });
    }

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete trip
// @route  DELETE /api/trips/:id
// @access Private (FleetManager only)
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return next(new ApiError(404, 'Trip not found'));

    if (trip.driver) {
      await Driver.findByIdAndUpdate(trip.driver, { status: 'Available' });
    }
    if (trip.vehicle) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
};
