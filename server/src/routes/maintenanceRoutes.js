const express = require('express');
const {
  getMaintenanceLogs,
  getMaintenanceLog,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getMaintenanceLogs)
  .post(protect, createMaintenanceLog);

router.route('/:id')
  .get(protect, getMaintenanceLog)
  .put(protect, updateMaintenanceLog)
  .delete(protect, deleteMaintenanceLog);

module.exports = router;
