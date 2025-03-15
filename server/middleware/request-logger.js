/**
 * Enhanced request logger and error handler for API requests
 * Catches malformed JSON and provides detailed logging
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create specific log file for request errors
const requestErrorLog = fs.createWriteStream(
  path.join(logsDir, 'request-errors.log'),
  { flags: 'a' }
);

module.exports = {
  // Log all incoming requests with their bodies (for debugging)
  requestLogger: (req, res, next) => {
    // Skip logging for static assets and health checks
    if (req.originalUrl.startsWith('/static') || 
        req.originalUrl.includes('health') ||
        req.originalUrl === '/favicon.ico') {
      return next();
    }

    const requestData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    };
    
    // Don't log sensitive data in production
    if (process.env.NODE_ENV !== 'production' && req.body && 
        Object.keys(req.body).length > 0 && 
        !req.originalUrl.includes('/auth')) {
      requestData.body = req.body;
    }
    
    // Only log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📥 Request: ${req.method} ${req.originalUrl}`);
    }
    
    // Store request data in res.locals for potential error handling later
    res.locals.requestData = requestData;
    
    next();
  },

  // Handle JSON parsing errors specifically
  jsonErrorHandler: (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      // Log the error details for debugging
      const errorDetails = {
        timestamp: new Date().toISOString(),
        error: 'Invalid JSON',
        message: err.message,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        rawBody: err.body && typeof err.body === 'string' ? 
                 err.body.substring(0, 100) + (err.body.length > 100 ? '...' : '') : 
                 'Not captured'
      };
      
      // Write to error log
      requestErrorLog.write(JSON.stringify(errorDetails) + '\n');
      
      // Only log detailed error in non-production
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ JSON Parse Error:', err.message);
        console.error('Raw payload (truncated):', 
          err.body && typeof err.body === 'string' ? 
          err.body.substring(0, 100) + (err.body.length > 100 ? '...' : '') : 
          'Not captured');
      } else {
        // Log minimal info in production
        console.error(`❌ JSON Parse Error: ${req.method} ${req.originalUrl}`);
      }

      // Send friendly response to client
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON payload',
        error: 'The request contains malformed JSON data'
      });
    }

    next(err);
  }
};
