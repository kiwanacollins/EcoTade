const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = function(req, res, next) {
  // Get token from header or query parameter (fallback for downloads/files)
  const token = req.header('Authorization')?.replace('Bearer ', '') || 
                req.query?.token;

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token with proper error handling
  try {
    // Ensure we have a JWT secret
    if (!config.jwtSecret) {
      console.error('JWT_SECRET is not configured! Authentication will fail.');
      return res.status(500).json({ 
        message: 'Server authentication configuration error',
        error: 'JWT_SECRET_MISSING'
      });
    }
    
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    // Provide more helpful error messages based on error type
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN' 
      });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};
