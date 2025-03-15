/**
 * User model definition
 * Now with proper export pattern to prevent multiple registrations
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
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
    minlength: 6,
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
    activeTrades: {
      type: Number,
      default: 0
    },
    activeTraders: {
      type: Number,
      default: 0
    },
    selectedTrader: {
      type: Object,
      default: null
    },
    transactions: [{
      date: Date,
      type: String,
      description: String,
      amount: Number,
      status: String
    }],
    investments: [{
      name: String,
      amount: Number,
      startDate: Date,
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

// Export schema only, not model
module.exports = UserSchema;
