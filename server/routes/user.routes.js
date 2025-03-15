const express = require('express');
const router = express.Router();
const { User } = require('../models'); // Fixed import to use models index
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// All routes are protected and only accessible to admin users
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;