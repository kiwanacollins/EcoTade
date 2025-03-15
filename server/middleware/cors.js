/**
 * Enhanced CORS middleware to handle missing origin headers
 * Fixed to prevent auth issues with the dashboard
 */

// Allowed origins - modify as needed
const ALLOWED_ORIGINS = [
  'https://forexprox.com',
  'https://www.forexprox.com',
  'https://srv749600.hstgr.cloud',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000'
];

// Extract domain from referer or host header
const extractDomain = (req) => {
  // Try to get from referer first
  const referer = req.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch (e) {
      console.error('Error parsing referer URL:', e);
    }
  }
  
  // Fall back to host header
  const host = req.get('host');
  if (host) {
    // Check if host includes protocol
    if (host.includes('://')) {
      try {
        const url = new URL(host);
        return url.origin;
      } catch (e) {
        console.error('Error parsing host as URL:', e);
      }
    } else {
      // Assume HTTPS for production
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return `${protocol}://${host}`;
    }
  }
  
  return null;
};

// Main CORS middleware function with fixes for missing origin
module.exports = (req, res, next) => {
  // Log the type of request and whether it's preflight
  console.log(`CORS middleware processing ${req.method} request to ${req.path}`);
  
  // Get origin from headers
  let origin = req.get('origin');
  
  // Debug output
  if (!origin) {
    console.log('No origin header in the request');
    
    // Check if mobile user agent
    const userAgent = req.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    
    if (isMobile) {
      console.log('Mobile device detected without origin header');
    }
    
    // Try to infer origin from referer or host
    const inferredOrigin = extractDomain(req);
    if (inferredOrigin) {
      console.log(`Using inferred origin from host: ${inferredOrigin}`);
      origin = inferredOrigin;
    }
  } else {
    console.log(`Request origin: ${origin}`);
  }
  
  // KEY FIX: For the missing origin issue, use the first allowed origin 
  // This ensures that API requests will work even when origin is missing
  if (!origin) {
    origin = ALLOWED_ORIGINS[0];
    console.log(`Using default origin: ${origin}`);
  }
  
  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
  
  console.log(`Origin ${origin} ${isAllowed ? 'is' : 'is NOT'} allowed`);
  
  // Set allowed origin
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For security, we still need to set a valid origin for CORS to work
    // Using the first allowed origin as fallback
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  
  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Add Vary header to prevent browser caching issues
  res.setHeader('Vary', 'Origin');
  
  // Allowed headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Allowed methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    return res.status(204).end();
  }
  
  next();
};
