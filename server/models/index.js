/**
 * Models index file
 * Centralizes model registration to prevent "Cannot overwrite model" errors
 */

const mongoose = require('mongoose');

// Delete the model if it exists (only in development)
if (process.env.NODE_ENV !== 'production') {
  if (mongoose.models.User) {
    delete mongoose.models.User;
    delete mongoose.modelSchemas.User;
  }
}

const UserSchema = require('./User');

// Get or create model function
const getOrCreateModel = (name, schema) => {
  try {
    return mongoose.model(name);
  } catch (error) {
    return mongoose.model(name, schema);
  }
};

// Register models
const User = getOrCreateModel('User', UserSchema);

module.exports = {
  User
};
