const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from various sources (header, cookie, query)
  const token = 
    req.header('Authorization')?.replace('Bearer ', '') || 
    req.cookies?.token ||
    req.query?.token;

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No authentication token, access denied'
    });
  }

  // Verify token with proper error handling
  try {
    // Ensure we have a JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('Missing JWT_SECRET in environment. Authentication will fail.');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error',
        error: 'authentication_config_error'
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    // Add user data to request
    req.user = decoded;
    
    // For debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Authenticated user: ${decoded.id}`);
    }
    
    next();
  } catch (err) {
    // Log the error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth error:', err.message);
    }
    
    // Provide helpful error responses based on error type
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired, please login again',
        error: 'token_expired'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token, please login again',
        error: 'token_invalid'
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Token verification failed',
      error: 'authentication_failed'
    });
  }
};
