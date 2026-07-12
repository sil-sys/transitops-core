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

    // Self-healing database alignment for all fetched trips
    let anyHealed = false;
    for (const trip of trips) {
      if (trip.status === 'Dispatched') {
        if (trip.driver && trip.driver.status !== 'On Trip') {
          await Driver.findByIdAndUpdate(trip.driver._id, { status: 'On Trip' });
          anyHealed = true;
        }
        if (trip.vehicle && trip.vehicle.status !== 'On Trip') {
          await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'On Trip' });
          anyHealed = true;
        }
      } else if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        if (trip.driver && trip.driver.status !== 'Available') {
          await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Available' });
          anyHealed = true;
        }
        if (trip.vehicle && trip.vehicle.status !== 'Available') {
          await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'Available' });
          anyHealed = true;
        }
      }
    }

    let finalTrips = trips;
    if (anyHealed) {
      finalTrips = await Trip.find(filter)
        .populate('driver')
        .populate('vehicle')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({ success: true, count: finalTrips.length, data: finalTrips });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single trip
// @route  GET /api/trips/:id
// @access Private
const getTrip = async (req, res, next) => {
  try {
    let trip = await Trip.findById(req.params.id)
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

    // Self-healing database alignment for the loaded trip
    let healed = false;
    if (trip.status === 'Dispatched') {
      if (trip.driver && trip.driver.status !== 'On Trip') {
        await Driver.findByIdAndUpdate(trip.driver._id, { status: 'On Trip' });
        healed = true;
      }
      if (trip.vehicle && trip.vehicle.status !== 'On Trip') {
        await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'On Trip' });
        healed = true;
      }
    } else if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      if (trip.driver && trip.driver.status !== 'Available') {
        await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Available' });
        healed = true;
      }
      if (trip.vehicle && trip.vehicle.status !== 'Available') {
        await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'Available' });
        healed = true;
      }
    }

    if (healed) {
      trip = await Trip.findById(req.params.id)
        .populate('driver')
        .populate('vehicle');
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

    // Authorization: Drivers can only update their own trips
    if (req.user.role === 'Driver') {
      const driverDoc = await Driver.findOne({ name: req.user.name });
      if (!driverDoc || trip.driver?.toString() !== driverDoc._id.toString()) {
        return next(new ApiError(403, 'You are not authorized to update this trip'));
      }
    }

    const incomingStatus = req.body.status;
    const currentStatus = trip.status;

    // Enforce status transition validation
    if (incomingStatus && incomingStatus !== currentStatus) {
      const validTransitions = {
        'Draft': ['Vehicle Assigned', 'Driver Assigned', 'Route Planned', 'Ready for Dispatch', 'Cancelled'],
        'Vehicle Assigned': ['Draft', 'Driver Assigned', 'Route Planned', 'Ready for Dispatch', 'Cancelled'],
        'Driver Assigned': ['Draft', 'Vehicle Assigned', 'Route Planned', 'Ready for Dispatch', 'Cancelled'],
        'Route Planned': ['Draft', 'Vehicle Assigned', 'Driver Assigned', 'Ready for Dispatch', 'Cancelled'],
        'Ready for Dispatch': ['Dispatched', 'Cancelled'],
        'Dispatched': ['Completed', 'Cancelled'],
        'Completed': [],
        'Cancelled': []
      };

      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(incomingStatus)) {
        return next(new ApiError(400, `Invalid status transition from '${currentStatus}' to '${incomingStatus}'`));
      }

      // Auto-set timestamps
      if (incomingStatus === 'Dispatched') {
        req.body.dispatchedAt = Date.now();
      } else if (incomingStatus === 'Completed' || incomingStatus === 'Cancelled') {
        req.body.completedAt = Date.now();
      }
    }

    const previousDriverId = trip.driver ? trip.driver.toString() : null;
    const previousVehicleId = trip.vehicle ? trip.vehicle.toString() : null;

    // Apply the update
    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('driver').populate('vehicle');

    const currentDriverId = trip.driver ? trip.driver._id.toString() : null;
    const currentVehicleId = trip.vehicle ? trip.vehicle._id.toString() : null;

    // --- INTEGRATION: Trip ↔ Vehicle ↔ Driver ---

    // 1) ON DISPATCH: Lock driver and vehicle to 'On Trip'
    if (incomingStatus === 'Dispatched') {
      if (currentDriverId) {
        await Driver.findByIdAndUpdate(currentDriverId, { status: 'On Trip' });
      }
      if (currentVehicleId) {
        await Vehicle.findByIdAndUpdate(currentVehicleId, { status: 'On Trip' });
      }
    }

    // 2) ON COMPLETE or CANCEL: Release driver and vehicle back to 'Available'
    else if (incomingStatus === 'Completed' || incomingStatus === 'Cancelled') {
      // Release current driver
      if (currentDriverId) {
        await Driver.findByIdAndUpdate(currentDriverId, { status: 'Available' });
      }
      // Also release previous driver if it changed (edge case)
      if (previousDriverId && previousDriverId !== currentDriverId) {
        await Driver.findByIdAndUpdate(previousDriverId, { status: 'Available' });
      }
      // Release current vehicle
      if (currentVehicleId) {
        await Vehicle.findByIdAndUpdate(currentVehicleId, { status: 'Available' });
      }
      // Also release previous vehicle if it changed (edge case)
      if (previousVehicleId && previousVehicleId !== currentVehicleId) {
        await Vehicle.findByIdAndUpdate(previousVehicleId, { status: 'Available' });
      }
    }

    // 3) ON DRIVER REASSIGNMENT (during prep stages): update old/new driver status
    else if (currentDriverId !== previousDriverId) {
      if (previousDriverId) {
        await Driver.findByIdAndUpdate(previousDriverId, { status: 'Available' });
      }
      // Only mark new driver 'On Trip' if the trip is already active
      if (currentDriverId && currentStatus === 'Dispatched') {
        await Driver.findByIdAndUpdate(currentDriverId, { status: 'On Trip' });
      }
    }

    // 4) ON VEHICLE REASSIGNMENT (during prep stages): update old/new vehicle status
    else if (currentVehicleId !== previousVehicleId) {
      if (previousVehicleId) {
        await Vehicle.findByIdAndUpdate(previousVehicleId, { status: 'Available' });
      }
      if (currentVehicleId && currentStatus === 'Dispatched') {
        await Vehicle.findByIdAndUpdate(currentVehicleId, { status: 'On Trip' });
      }
    }

    // Re-populate trip to get the latest driver and vehicle status after updates
    trip = await Trip.findById(trip._id).populate('driver').populate('vehicle');

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
