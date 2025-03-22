/**
 * Test script for daily profit/loss updates
 * Run this script to test the daily profit/loss update functionality
 */

const { scheduledDailyUpdate } = require('../controllers/financial.controller');
const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin';

async function testDailyUpdate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected!');

    console.log('Running scheduled daily profit/loss update...');
    const result = await scheduledDailyUpdate();
    
    console.log('Update completed with results:', JSON.stringify(result, null, 2));
    
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in test script:', error);
    process.exit(1);
  }
}

// Run the test
testDailyUpdate();