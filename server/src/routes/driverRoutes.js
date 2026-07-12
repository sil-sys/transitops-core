const express = require('express');
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware'); // assuming standard naming

const router = express.Router();

router.route('/')
  .get(protect, getDrivers)
  .post(protect, createDriver);

router.route('/:id')
  .get(protect, getDriver)
  .put(protect, updateDriver)
  .delete(protect, deleteDriver);

module.exports = router;
