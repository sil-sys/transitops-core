const express = require('express');
const { getCostReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/cost', authorize('FleetManager', 'FinancialAnalyst'), getCostReport);

module.exports = router;
