/**
 * Models index file
 * Centralizes model registration to prevent "Cannot overwrite model" errors
 */

const mongoose = require('mongoose');
const UserSchema = require('./User');

// Function to add methods to schema before model creation
const enhanceSchema = (schema) => {
    // Add any additional methods or configurations here
    return schema;
};

// Get model function that ensures methods are added
const getModel = (name, schema) => {
    try {
        return mongoose.model(name);
    } catch {
        const enhancedSchema = enhanceSchema(schema);
        return mongoose.model(name, enhancedSchema);
    }
};

// Create User model with enhanced schema
const User = getModel('User', UserSchema);

module.exports = {
    User
};
