const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Expense = require('../models/Expense');

// @desc   Get Dashboard data
// @route  GET /api/dashboard
// @access Private
const getDashboardData = async (req, res, next) => {
  try {
    const { type, status, region } = req.query;

    const vehicleMatch = {};
    if (type) vehicleMatch.type = type;
    if (status) vehicleMatch.status = status;
    if (region) vehicleMatch.region = region;

    const FuelLog = require('../models/FuelLog');
    const MaintenanceLog = require('../models/MaintenanceLog');

    const [vehicles, trips, drivers, expensesAgg, fuelAgg, maintenanceAgg] = await Promise.all([
      Vehicle.find(vehicleMatch),
      Trip.find(),
      Driver.find(),
      Expense.aggregate([{ $group: { _id: '$vehicle', expense: { $sum: '$amount' } } }]),
      FuelLog.aggregate([{ $group: { _id: '$vehicle', expense: { $sum: '$cost' } } }]),
      MaintenanceLog.aggregate([{ $group: { _id: '$vehicle', expense: { $sum: '$cost' } } }]),
    ]);

    // Combine all expenses by vehicle ID
    const combinedExpensesMap = {};
    const addToMap = (aggData) => {
      aggData.forEach(item => {
        if (!item._id) return;
        const vId = item._id.toString();
        combinedExpensesMap[vId] = (combinedExpensesMap[vId] || 0) + item.expense;
      });
    };
    
    addToMap(expensesAgg);
    addToMap(fuelAgg);
    addToMap(maintenanceAgg);

    // Map to vehicle registration numbers
    const expensesPerVehicleRaw = [];
    // We already fetched filtered vehicles above into the 'vehicles' variable.
    // By matching against this filtered array, we ensure the chart respects the dashboard filters!
    for (const [vId, total] of Object.entries(combinedExpensesMap)) {
      const vehicleDoc = vehicles.find(v => v._id.toString() === vId);
      if (vehicleDoc) {
        expensesPerVehicleRaw.push({
          vehicle: vehicleDoc.registrationNumber,
          expense: total
        });
      }
    }

    // Vehicles
    const activeVehicles = vehicles.filter(v => v.status !== 'Retired').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'In Shop').length;
    const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const retiredVehicles = vehicles.filter(v => v.status === 'Retired').length;

    const fleetUtilization = activeVehicles > 0 ? Math.round((onTripVehicles / activeVehicles) * 100) : 0;

    const vehicleStatus = {
      'Available': availableVehicles,
      'On Trip': onTripVehicles,
      'In Shop': maintenanceVehicles,
      'Retired': retiredVehicles,
    };

    // Trips
    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => ['Draft', 'Vehicle Assigned', 'Driver Assigned', 'Route Planned', 'Ready for Dispatch'].includes(t.status)).length;

    // Drivers
    const driversOnDuty = drivers.filter(d => ['Available', 'On Trip'].includes(d.status)).length;

    // Expenses sorting
    const expensesPerVehicle = expensesPerVehicleRaw.sort((a, b) => b.expense - a.expense).slice(0, 5); // Top 5

    res.status(200).json({
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      vehicleStatus,
      expensesPerVehicle,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData };
