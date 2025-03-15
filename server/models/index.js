/**
 * Models index file
 * Centralizes model registration to prevent "Cannot overwrite model" errors
 */

const mongoose = require('mongoose');

// Import schemas
const UserSchema = require('./User');

// Create models only if they don't exist
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Export models
module.exports = {
    User
};
