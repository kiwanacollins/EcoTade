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
  'null',
  undefined
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
    // Either accept a known origin or just allow any origin for development/testing
    // This is more permissive but necessary if you have users on various devices
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      console.log(`Setting Access-Control-Allow-Origin to: ${origin}`);
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      console.log(`Origin not in allowed list: ${origin}`);
      // For production, dynamically set the origin if it includes your domain
      // This allows subdomains and various device browsers to connect
      if (origin.includes('forexprox.com') || origin.includes('srv749600.hstgr.cloud')) {
        console.log(`Setting Access-Control-Allow-Origin to: ${origin}`);
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // For other origins, use a default allowed origin
        console.log('Using default Access-Control-Allow-Origin');
        res.setHeader('Access-Control-Allow-Origin', 'https://forexprox.com');
      }
    }
    res.setHeader('Vary', 'Origin');
  } else {
    console.log('Request has no origin header');
    // For requests with no origin (like mobile apps), be permissive
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Expanded set of allowed headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests with detailed logging
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    console.log('Request headers:', req.headers);
    return res.status(200).end();
  }
  
  next();
};
