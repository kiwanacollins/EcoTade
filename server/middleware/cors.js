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
  'null'
  // Removed 'undefined' from the list as it's not a valid origin
];

module.exports = (req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`CORS middleware handling ${req.method} request from origin: ${origin}`);
  console.log('Request path:', req.path);
  
  // Clear any existing CORS headers to prevent duplicates
  res.removeHeader('Access-Control-Allow-Origin');
  res.removeHeader('Access-Control-Allow-Methods');
  res.removeHeader('Access-Control-Allow-Headers');
  res.removeHeader('Access-Control-Allow-Credentials');
  
  // Set CORS headers based on origin
  if (origin) {
    // Either accept a known origin or check if it includes our domain
    if (allowedOrigins.includes(origin) || 
        origin.includes('forexprox.com') || 
        origin.includes('srv749600.hstgr.cloud')) {
      console.log(`Setting Access-Control-Allow-Origin to specific origin: ${origin}`);
      res.setHeader('Access-Control-Allow-Origin', origin);
      // When using a specific origin, we can enable credentials
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // For unknown origins in production, we don't set credentials and use a restrictive approach
      console.log(`Origin not in allowed list: ${origin}`);
      // In production, we don't allow unknown origins for security
      if (process.env.NODE_ENV === 'production') {
        console.log('Production environment - restricting unknown origin');
        res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
      } else {
        // For development, be more permissive
        console.log('Development environment - allowing unknown origin');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }
    res.setHeader('Vary', 'Origin');
  } else {
    console.log('Request has no origin header');
    
    // For requests with no origin (like mobile apps without explicit origin),
    // we need to handle differently - can't use * with credentials
    
    // Check for mobile user-agent patterns
    const userAgent = req.headers['user-agent'] || '';
    const isMobileRequest = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobileRequest) {
      console.log('Mobile client detected without origin - allowing with restricted credentials');
      // For mobile clients, use the host as the allowed origin
      const host = req.headers.host;
      if (host) {
        const protocol = req.secure ? 'https://' : 'http://';
        const inferredOrigin = protocol + host;
        res.setHeader('Access-Control-Allow-Origin', inferredOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        // Fallback to the main domain when host is unavailable
        res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    } else {
      // For non-mobile requests with no origin, we're more restrictive
      // Don't use '*' with credentials, as browsers will reject this
      res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  // Expanded set of allowed headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests with detailed logging
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    console.log('Request headers:', req.headers);
    return res.status(200).end();
  }
  
  next();
};
