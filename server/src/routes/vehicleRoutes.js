const express = require('express');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every route below requires login

router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', authorize('FleetManager'), createVehicle);
router.put('/:id', authorize('FleetManager'), updateVehicle);
router.delete('/:id', authorize('FleetManager'), deleteVehicle);

module.exports = router;