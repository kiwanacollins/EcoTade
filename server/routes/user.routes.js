const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Import controllers
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

// Get current user profile - NEW ENDPOINT TO FIX DASHBOARD REDIRECT
// This needs to be before the admin routes to prevent auth issues
router.get('/profile', protect, async (req, res) => {
  try {
    // Find user but exclude password
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user data
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// All admin routes are protected and only accessible to admin users
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;