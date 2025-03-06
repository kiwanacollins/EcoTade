const express = require('express');
const { register, login, getMe, logout, getDashboard } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.get('/dashboard', protect, getDashboard);

module.exports = router;