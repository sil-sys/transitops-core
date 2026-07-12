const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const ApiError = require('../utils/ApiError');

// @desc   Get aggregated cost report
// @route  GET /api/reports/cost
// @access Private
const getCostReport = async (req, res, next) => {
  try {
    const [fuelData, maintenanceData] = await Promise.all([
      FuelLog.aggregate([{ $group: { _id: null, totalCost: { $sum: '$cost' } } }]),
      MaintenanceLog.aggregate([{ $group: { _id: null, totalCost: { $sum: '$cost' } } }]),
    ]);

    const fuelCost = fuelData.length > 0 ? fuelData[0].totalCost : 0;
    const maintenanceCost = maintenanceData.length > 0 ? maintenanceData[0].totalCost : 0;
    const totalOperationalCost = fuelCost + maintenanceCost;

    res.status(200).json({
      fuelCost,
      maintenanceCost,
      totalOperationalCost,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCostReport };
