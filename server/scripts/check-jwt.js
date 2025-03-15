/**
 * Check if JWT secret is properly configured
 * This script is imported in server.js
 */

function isJwtConfigured() {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set! User authentication will fail.');
    console.error('Please set JWT_SECRET in your environment or .env file');
    
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback JWT_SECRET for development only');
      process.env.JWT_SECRET = 'ecotradesecurekey2024';
      return true; // Allow development to continue with fallback
    }
    return false;
  }
  
  console.log('✅ JWT_SECRET is configured correctly');
  return true;
}

// Try to fix missing JWT_SECRET by checking alternate environments
function attemptJwtFix() {
  // Check if JWT_SECRET exists in another common environment variable name
  const possibleAlternatives = ['JWT_TOKEN', 'API_SECRET', 'APP_SECRET', 'SECRET_KEY'];
  
  for (const alt of possibleAlternatives) {
    if (process.env[alt]) {
      console.log(`Found alternative secret key in ${alt}, using it as JWT_SECRET`);
      process.env.JWT_SECRET = process.env[alt];
      return true;
    }
  }
  
  return false;
}

// Export functions for use in server.js
module.exports = {
  isJwtConfigured,
  attemptJwtFix
};
