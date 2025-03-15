/**
 * Models index file
 * Centralizes model registration to prevent "Cannot overwrite model" errors
 */

const mongoose = require('mongoose');
const UserSchema = require('./User');

// Function to get or create model to prevent duplicate registration
const getModel = (name, schema) => {
  try {
    // Try to get existing model first
    return mongoose.model(name);
  } catch (e) {
    // If model doesn't exist, create it
    return mongoose.model(name, schema);
  }
};

// Register models
const User = getModel('User', UserSchema);

// Export models
module.exports = {
  User
};
