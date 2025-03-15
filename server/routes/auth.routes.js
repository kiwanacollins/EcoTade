const express = require('express');
const router = express.Router();
const { User } = require('../models'); // Fixed import to use models index
const { register, login, getMe, logout, getDashboard, googleAuth } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth); // Add Google auth route

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.get('/dashboard', protect, getDashboard);

module.exports = router;