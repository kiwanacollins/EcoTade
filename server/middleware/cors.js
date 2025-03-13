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
  
  console.log(`CORS middleware handling ${req.method} request from origin: ${origin}`);
  console.log('Request path:', req.path);
  
  // Clear any existing CORS headers to prevent duplicates
  res.removeHeader('Access-Control-Allow-Origin');
  res.removeHeader('Access-Control-Allow-Methods');
  res.removeHeader('Access-Control-Allow-Headers');
  res.removeHeader('Access-Control-Allow-Credentials');
  
  // Set CORS headers based on origin
  if (origin) {
    console.log(`Setting Access-Control-Allow-Origin to: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    console.log('Request has no origin header');
    // Do not set any Access-Control-Allow-Origin for requests without origin
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
