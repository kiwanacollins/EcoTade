/**
 * User model definition
 * Now with proper export pattern to prevent multiple registrations
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {  // Changed from username to name to match registration data
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  fullName: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Financial data fields
  financialData: {
    totalBalance: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    dailyProfit: {
      type: Number,
      default: 0
    },
    dailyLoss: {
      type: Number,
      default: 0
    },
    activeTrades: {
      type: Number,
      default: 0
    },
    activeTraders: {
      type: Number,
      default: 0
    },
    selectedTrader: {
      type: mongoose.Schema.Types.Mixed, // Use Mixed type to allow more flexible trader object
      default: null
    },
    transactions: [{
      date: {
        type: Date,
        default: Date.now
      },
      type: String,
      description: String,
      amount: Number,
      status: String
    }],
    investments: [{
      name: String,
      amount: Number,
      startDate: {
        type: Date,
        default: Date.now
      },
      returnRate: Number,
      progress: Number
    }]
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add JWT signing method
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Export schema only, not model
module.exports = UserSchema;
