/**
 * Model validation script
 * This script helps identify issues with model loading
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || "mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin")
  .then(() => {
    console.log('MongoDB connected');
    validateModels();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function validateModels() {
  try {
    console.log('\nChecking existing models...');
    
    // Log any existing models (these would cause conflicts if registered again)
    console.log('Current models in Mongoose registry:', Object.keys(mongoose.models));

    // Check for model files
    const modelsDir = path.join(__dirname, '../models');
    console.log(`\nScanning models directory: ${modelsDir}`);
    
    const files = fs.readdirSync(modelsDir);
    console.log('Model files found:');
    files.forEach(file => {
      const filePath = path.join(modelsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file} (${stats.isDirectory() ? 'dir' : 'file'})`);
      
      // Check for user.model.js specifically
      if (file === 'user.model.js') {
        console.error('\n⚠️ CONFLICT DETECTED: user.model.js file exists!');
        console.error('This file needs to be renamed or removed to avoid model conflicts.\n');
      }
    });

    // Check if our centralized model loading works
    try {
      console.log('\nTesting centralized model loading...');
      const { User } = require('../models');
      console.log(`✅ User model loaded successfully (ID: ${User.modelName})`);
      const testUser = await User.findOne();
      console.log(`User query test: ${testUser ? 'Success' : 'No users found but query worked'}`);
    } catch (error) {
      console.error('❌ Error loading centralized models:', error);
    }
    
    console.log('\nValidation complete');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error validating models:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
