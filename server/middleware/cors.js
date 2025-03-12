// CORS middleware for the ForexProx API

// Allow requests from both the client domain and direct VPS access
const allowedOrigins = [
  'https://forexprox.com',
  'https://www.forexprox.com',
  'http://localhost:5000',
  'http://localhost:3000'
];

module.exports = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if the request origin is in our allowed list
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For development/testing, you might want to allow all origins
    // Comment this out in strict production environments
    res.setHeader('Access-Control-Allow-Origin', '*');
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
