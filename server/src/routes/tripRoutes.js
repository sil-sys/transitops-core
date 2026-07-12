const express = require('express');
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // require login for all trip routes

router.get('/', authorize('FleetManager', 'Driver', 'SafetyOfficer'), getTrips);
router.get('/:id', authorize('FleetManager', 'Driver', 'SafetyOfficer'), getTrip);
router.post('/', authorize('FleetManager'), createTrip);
router.put('/:id', authorize('FleetManager', 'Driver', 'SafetyOfficer'), updateTrip);
router.delete('/:id', authorize('FleetManager'), deleteTrip);

module.exports = router;
