/**
 * Models index file
 * Centralizes model registration to prevent "Cannot overwrite model" errors
 */

const mongoose = require('mongoose');

// Get or create model function
const getOrCreateModel = (modelName, schema) => {
  return mongoose.models[modelName] || mongoose.model(modelName, schema);
};

// Register all models here
const User = require('./User')(mongoose, getOrCreateModel);

// Export all models
module.exports = {
  User
};
