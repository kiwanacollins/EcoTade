// CORS middleware for the ForexProx API

// Create a comprehensive list of allowed origins
const allowedOrigins = [
  'https://forexprox.com',
  'https://www.forexprox.com',
  'http://forexprox.com',
  'http://www.forexprox.com',
  'https://m.forexprox.com',
  'http://m.forexprox.com',
  'https://srv749600.hstgr.cloud',
  'http://srv749600.hstgr.cloud',
  'http://localhost:5000',
  'http://localhost:3000',
  'capacitor://localhost',
  'http://localhost',
  // Add explicit entries for accessing from mobile devices
  'http://192.168.1.1:5000',
  'http://192.168.0.1:5000',
  'http://10.0.0.1:5000',
  // Include null for file:// origins
  'null'
];

module.exports = (req, res, next) => {
  // Store the original end method to intercept it and log the final headers
  const originalEnd = res.end;
  
  // Override res.end to log the final CORS headers before sending the response
  res.end = function() {
    console.log('Final CORS headers being sent:');
    console.log('- Access-Control-Allow-Origin:', res.getHeader('Access-Control-Allow-Origin') || 'not set');
    console.log('- Access-Control-Allow-Credentials:', res.getHeader('Access-Control-Allow-Credentials') || 'not set');
    console.log('- Access-Control-Allow-Methods:', res.getHeader('Access-Control-Allow-Methods') || 'not set');
    console.log('- Access-Control-Allow-Headers:', res.getHeader('Access-Control-Allow-Headers') || 'not set');
    
    // Call the original end method
    return originalEnd.apply(this, arguments);
  };

  const origin = req.headers.origin;
  const method = req.method;
  const path = req.path;
  
  console.log(`CORS middleware processing ${method} request to ${path} from origin: ${origin || 'no origin'}`);
  
  // CRITICAL: Remove any existing CORS headers to prevent conflicts
  res.removeHeader('Access-Control-Allow-Origin');
  res.removeHeader('Access-Control-Allow-Methods');
  res.removeHeader('Access-Control-Allow-Headers');
  res.removeHeader('Access-Control-Allow-Credentials');
  res.removeHeader('Access-Control-Max-Age');
  
  // Set up Vary header to indicate that responses vary based on Origin
  res.setHeader('Vary', 'Origin');
  
  // Handle the Origin header presence
  if (origin) {
    // Check if the origin is in our allowed list or matches our domain pattern
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.includes('forexprox.com') || 
                      origin.includes('srv749600.hstgr.cloud');
    
    if (isAllowed) {
      // For allowed origins, send back the specific origin with credentials
      console.log(`✓ Origin ${origin} is allowed - setting specific origin`);
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // For non-allowed origins
      console.log(`✗ Origin ${origin} is not in allowed list`);
      
      // In development, be more permissive
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode - allowing unknown origin:', origin);
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        // In production, reject unknown origins for security
        console.log('Production mode - rejecting unknown origin');
        // Instead of sending a wildcard, set a default origin
        res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
        // Don't set credentials flag for security
      }
    }
  } else {
    // Handle requests with no Origin header (like API clients and curl)
    console.log('No origin header in the request');
    
    // For requests with no origin header, we need a special approach
    // We can detect mobile devices through user agent
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) {
      console.log('Mobile device detected without origin header');
      
      // For mobile devices, use the host as the allowed origin if available
      const host = req.headers.host;
      if (host) {
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https://' : 'http://';
        const inferredOrigin = protocol + host;
        console.log('Using inferred origin from host:', inferredOrigin);
        res.setHeader('Access-Control-Allow-Origin', inferredOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        // Fallback to main site origin
        console.log('No host header available, using default origin');
        res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    } else {
      // For API calls without origin (like from Node.js client)
      // IMPORTANT FIX: We CANNOT use * with credentials, so set a specific origin
      console.log('Non-mobile request without origin header - using default origin');
      res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
      // Don't set credentials for these types of requests
    }
  }
  
  // Set standard headers for all responses
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Set max age to cache preflight requests
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    return res.status(204).end(); // No content needed for OPTIONS
  }
  
  // Continue with request
  next();
};
