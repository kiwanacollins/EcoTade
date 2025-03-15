const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getDashboard,
  updateDashboard,
  saveSelectedTrader
} = require('../controllers/financial.controller');

// Apply authentication middleware to all routes
router.use(protect);

// Financial dashboard routes
router.get('/dashboard', getDashboard);
router.put('/dashboard', updateDashboard);

// Trader selection route
router.post('/trader', saveSelectedTrader);

module.exports = router;
