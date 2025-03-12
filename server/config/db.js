/**
 * Database connection handler
 */
const mongoose = require('mongoose');

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_INTERVAL_BASE = 1000; // 1 second base, will increase with backoff

const connectDB = async (retryAttempt = 1) => {
  try {
    // Always use the MONGODB_URI environment variable - should be set by server.js
    const connectionString = process.env.MONGODB_URI;
    
    console.log(`Attempting to connect to MongoDB at attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS}`);
    console.log(`Using connection string: ${connectionString.replace(/\/\/.*:.*@/, '//****:****@')}`); // Hide credentials
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    if (!conn) {
      throw new Error('Database connection failed');
    }
    
    console.log(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    // Implement retry logic with exponential backoff
    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      const retryDelay = RETRY_INTERVAL_BASE * Math.pow(2, retryAttempt - 1);
      console.error(`Retrying in ${retryDelay / 1000} seconds...`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(connectDB(retryAttempt + 1));
        }, retryDelay);
      });
    } else {
      console.error('Maximum database connection attempts reached. Starting server without database connection.');
      // Return null instead of throwing to allow server to start without DB
      return null;
    }
  }
};

module.exports = connectDB;