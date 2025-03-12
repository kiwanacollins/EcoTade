/**
 * Database connection handler
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check for multiple possible environment variable names
    const connectionString = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!connectionString) {
      throw new Error('MongoDB connection string not found. Please set MONGODB_URI in your environment variables.');
    }
    
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
    throw error;
  }
};

module.exports = connectDB;