const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

// Try to load environment from dotenv files
try {
  // Load .env file (created by restart-pm2.sh)
  dotenv.config();
  console.log('Attempted to load environment variables from .env');
  
  // Log if we found the MongoDB URI
  if (process.env.MONGODB_URI) {
    console.log('Found MONGODB_URI in environment variables');
  } else {
    console.warn('MONGODB_URI not found in environment variables');
  }
} catch (error) {
  console.error('Error loading environment variables:', error);
}

// ALWAYS set a hardcoded fallback for Docker MongoDB - this ensures it always works
console.log('Setting Docker MongoDB connection...');
process.env.MONGODB_URI = "mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin";

// Log what we're using
console.log('Application Settings:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//****:****@')); // Hide credentials
console.log('- Running on port:', process.env.PORT || 5000);

// Continue with the existing server.js content
const connectDB = require('./config/db');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log streams
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'), 
  { flags: 'a' }
);
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'), 
  { flags: 'a' }
);

// Custom logger function
function logMessage(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  
  console[type === 'error' ? 'error' : 'log'](message);
  
  if (type === 'error') {
    errorLogStream.write(logEntry);
  } else {
    accessLogStream.write(logEntry);
  }
}

// Handle uncaught exceptions - prevent immediate crash
process.on('uncaughtException', (error) => {
  logMessage(`UNCAUGHT EXCEPTION: ${error.message}\n${error.stack}`, 'error');
  // Give time to log before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logMessage(`UNHANDLED REJECTION: ${reason}`, 'error');
});

// Initialize the Express app
const app = express();

// Middleware
// Updated CORS options to set origin based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*')
    : function(origin, callback) { callback(null, true); },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Enable preflight for all routes
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setup database connection with retry logic
let dbConnected = false;
const maxRetries = 5;
const connectWithRetry = (retryCount = 0) => {
  logMessage(`Attempting to connect to database (attempt ${retryCount + 1}/${maxRetries})...`);
  
  connectDB()
    .then(() => {
      dbConnected = true;
      logMessage('Database connection established successfully');
    })
    .catch((err) => {
      logMessage(`Database connection failed: ${err.message}`, 'error');
      
      if (retryCount < maxRetries - 1) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        logMessage(`Retrying in ${retryDelay/1000} seconds...`);
        
        setTimeout(() => {
          connectWithRetry(retryCount + 1);
        }, retryDelay);
      } else {
        logMessage('Maximum database connection attempts reached. Starting server without database connection.', 'error');
        // Don't crash - let endpoints handle the lack of DB connection
      }
    });
};

// Start database connection process
connectWithRetry();

// Routes with try-catch blocks
try {
  // Add health check routes
  const healthRoutes = require('./health');
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);
  
  // Only set up routes that need database if connected
  app.use('/api/auth', (req, res, next) => {
    if (!dbConnected) {
      return res.status(503).json({ 
        message: 'Database connection not available',
        status: 'maintenance',
        retry: true
      });
    }
    next();
  }, require('./routes/auth.routes'));
  
  app.use('/api/users', (req, res, next) => {
    if (!dbConnected) {
      return res.status(503).json({ 
        message: 'Database connection not available',
        status: 'maintenance',
        retry: true
      });
    }
    next();
  }, require('./routes/user.routes'));
  
  // Default route - always accessible
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Welcome to Forexprox API',
      status: dbConnected ? 'online' : 'limited',
      databaseConnected: dbConnected
    });
  });
  
  // API status endpoint - always accessible
  app.get('/api', (req, res) => {
    res.json({ 
      message: 'API is running',
      version: '1.0.0',
      status: dbConnected ? 'online' : 'limited',
      databaseConnected: dbConnected
    });
  });
} catch (error) {
  logMessage(`Error setting up routes: ${error.message}\n${error.stack}`, 'error');
}

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logMessage(`[${req.method}] ${req.url} - ${statusCode}: ${message}\n${err.stack || ''}`, 'error');
  
  res.status(statusCode).json({ 
    message,
    status: 'error',
    path: req.url
  });
});

// Ensure server listens on all network interfaces (important for VPS)
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Server accessible via: https://srv749600.hstgr.cloud`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  logMessage('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logMessage('Process terminated');
  });
});

process.on('SIGINT', () => {
  logMessage('SIGINT received, shutting down gracefully');
  server.close(() => {
    logMessage('Process terminated');
  });
});

module.exports = server; // Export for testing