const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // ...existing code...
  
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
  // ...existing code...
});

// ...existing code...

module.exports = mongoose.model('User', UserSchema);
