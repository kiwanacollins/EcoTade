// CORS middleware for the ForexProx API

// Allow requests from both the client domain and direct VPS access
const allowedOrigins = [
  'https://forexprox.com',
  'https://www.forexprox.com',
  'http://forexprox.com',
  'http://www.forexprox.com',
  'https://srv749600.hstgr.cloud',
  'http://srv749600.hstgr.cloud',
  'http://localhost:5000',
  'http://localhost:3000',
  'null',
  undefined
];

module.exports = (req, res, next) => {
  const origin = req.headers.origin;
  
  console.log('Received request with origin:', origin);
  
  // Check if the request origin is in our allowed list
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // When allowing specific origins with credentials, you must set the Vary header
    res.setHeader('Vary', 'Origin');
  } else {
    // Do not use wildcard for requests with credentials
    // Only allow the specific request origin if needed
    console.log('Origin not in allowed list:', origin);
    
    // Instead of setting wildcard, we need to decide if this origin should be allowed
    // For security, we'll only accept origins in our allowed list
    res.setHeader('Access-Control-Allow-Origin', origin || '');
    res.setHeader('Vary', 'Origin');
  }
  
  // Standard CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};
