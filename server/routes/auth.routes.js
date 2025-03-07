const express = require('express');
const { register, login, getMe, logout, getDashboard, googleAuth } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth); // Add Google auth route

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.get('/dashboard', protect, getDashboard);

module.exports = router;