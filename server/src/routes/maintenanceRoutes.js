const express = require('express');
const {
  getMaintenanceLogs,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getMaintenanceLogs);
router.post('/', authorize('FleetManager'), createMaintenanceLog);
router.put('/:id', authorize('FleetManager'), updateMaintenanceLog);
router.delete('/:id', authorize('FleetManager'), deleteMaintenanceLog);

module.exports = router;
