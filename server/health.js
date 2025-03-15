/**
 * Health monitoring endpoint
 * Provides status information about the server and its connections
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint
router.get('/', async (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'UP',
    memory: process.memoryUsage(),
  };
  
  try {
    // Check MongoDB connection status
    const dbState = mongoose.connection.readyState;
    healthData.database = {
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
      state: dbState
    };
    
    if (dbState === 1) {
      // If connected, add server stats
      try {
        const stats = await mongoose.connection.db.stats();
        healthData.database.collections = stats.collections;
        healthData.database.documents = stats.objects;
        healthData.database.storageSize = stats.storageSize;
      } catch (err) {
        healthData.database.statsError = err.message;
      }
    }
    
    return res.json(healthData);
  } catch (error) {
    healthData.status = 'DOWN';
    healthData.error = error.message;
    return res.status(503).json(healthData);
  }
});

// MongoDB specific health check
router.get('/mongodb', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        status: 'DOWN', 
        message: 'MongoDB not connected',
        readyState: mongoose.connection.readyState
      });
    }
    
    // Perform a ping to check mongodb responsiveness
    await mongoose.connection.db.admin().ping();
    
    return res.json({
      status: 'UP',
      message: 'MongoDB connected',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    });
  } catch (error) {
    return res.status(503).json({
      status: 'DOWN',
      message: 'MongoDB health check failed',
      error: error.message
    });
  }
});

// Add auth check endpoint that always returns success
router.get('/auth-check', (req, res) => {
  res.json({
    status: 'ok',
    auth: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
