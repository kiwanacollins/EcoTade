// CORS middleware for the ForexProx API

// Allow requests from both the client domain and direct VPS access
const allowedOrigins = [
  'https://forexprox.com',
  'https://www.forexprox.com',
  'http://forexprox.com',
  'http://www.forexprox.com',
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
  } else {
    // Allow all origins for now until we debug
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('Setting CORS for unknown origin:', origin);
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
