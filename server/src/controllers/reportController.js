const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const ApiError = require('../utils/ApiError');

const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

// @desc   Get aggregated cost report
// @route  GET /api/reports/cost
// @access Private
const getCostReport = async (req, res, next) => {
  try {
    const [fuelData, maintenanceData, trips, vehicles] = await Promise.all([
      FuelLog.aggregate([{ $group: { _id: null, totalCost: { $sum: '$cost' }, totalLiters: { $sum: '$liters' } } }]),
      MaintenanceLog.aggregate([{ $group: { _id: null, totalCost: { $sum: '$cost' } } }]),
      Trip.find({ status: 'Completed' }),
      Vehicle.find()
    ]);

    const fuelCost = fuelData.length > 0 ? fuelData[0].totalCost : 0;
    const maintenanceCost = maintenanceData.length > 0 ? maintenanceData[0].totalCost : 0;
    const totalOperationalCost = fuelCost + maintenanceCost;

    // Fuel Efficiency (Distance / Fuel)
    let totalDistance = 0;
    let totalFuelTrips = 0;
    let totalRevenue = 0;
    trips.forEach(t => {
      totalDistance += (t.plannedDistance || t.estimatedDistance || 0);
      totalFuelTrips += (t.fuelConsumed || 0);
      totalRevenue += (t.revenue || 0);
    });
    const totalLiters = totalFuelTrips > 0 ? totalFuelTrips : (fuelData.length > 0 ? fuelData[0].totalLiters : 0);
    const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 0;

    // Fleet Utilization
    const activeVehicles = vehicles.filter(v => v.status !== 'Retired').length;
    const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const fleetUtilization = activeVehicles > 0 ? Math.round((onTripVehicles / activeVehicles) * 100) : 0;

    // Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.acquisitionCost || 0), 0);
    let vehicleROI = 0;
    if (totalAcquisitionCost > 0) {
      vehicleROI = (((totalRevenue - totalOperationalCost) / totalAcquisitionCost) * 100).toFixed(2);
    }

    res.status(200).json({
      fuelCost,
      maintenanceCost,
      totalOperationalCost,
      fuelEfficiency,
      fleetUtilization,
      totalRevenue,
      vehicleROI,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCostReport };
