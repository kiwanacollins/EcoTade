/**
 * Database connection handler
 */
const mongoose = require('mongoose');

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_INTERVAL_BASE = 1000; // 1 second base, will increase with backoff

const connectDB = async (retryAttempt = 1) => {
  try {
    // Check for multiple possible environment variable names
    const connectionString = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!connectionString) {
      throw new Error('MongoDB connection string not found. Please set MONGODB_URI in your environment variables.');
    }
    
    console.log(`Attempting to connect to database (attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS})...`);
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // These options help maintain stable connections
      serverSelectionTimeoutMS: 5000, // Timeout for selecting a server
      socketTimeoutMS: 45000, // How long socket stays inactive before timing out
      connectTimeoutMS: 10000, // How long to wait for initial connection
    });

    if (!conn) {
      throw new Error('Database connection failed');
    }
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
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