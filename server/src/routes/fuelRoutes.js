const express = require('express');
const {
  getFuelLogs,
  getFuelLog,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
} = require('../controllers/fuelController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getFuelLogs);
router.get('/:id', getFuelLog);
router.post('/', createFuelLog);
router.put('/:id', updateFuelLog);
router.delete('/:id', deleteFuelLog);

module.exports = router;
