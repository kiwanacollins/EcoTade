/**
 * Enhanced JWT secret configuration checker
 * Fixes common issues with JWT_SECRET loading
 */

// Simple function to check if a string is empty or just whitespace
const isEmptyOrWhitespace = (str) => {
  return !str || /^\s*$/.test(str);
};

function isJwtConfigured() {
  const secret = process.env.JWT_SECRET;
  
  if (isEmptyOrWhitespace(secret)) {
    console.error('❌ JWT_SECRET is not set or empty! Authentication will fail.');
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
  // Try to fix the secret if it's quoted incorrectly (a common issue)
  const secret = process.env.JWT_SECRET;
  if (secret && (secret.startsWith('"') || secret.startsWith("'"))) {
    // Remove quotes that might have been incorrectly included in .env file
    const cleanSecret = secret.replace(/^['"](.*)['"]$/, '$1');
    console.log('⚠️ Fixed quoted JWT_SECRET. Updated value set.');
    process.env.JWT_SECRET = cleanSecret;
    return true;
  }

  // Check if JWT_SECRET exists in another common environment variable name
  const possibleAlternatives = ['JWT_TOKEN', 'API_SECRET', 'APP_SECRET', 'SECRET_KEY'];
  
  for (const alt of possibleAlternatives) {
    if (!isEmptyOrWhitespace(process.env[alt])) {
      console.log(`Found alternative secret key in ${alt}, using it as JWT_SECRET`);
      process.env.JWT_SECRET = process.env[alt];
      return true;
    }
  }
  
  return false;
}

// Force set a development fallback if needed
function forceSetJwtSecret() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('🔒 Forcing development JWT_SECRET fallback');
    process.env.JWT_SECRET = 'ecotradesecurekey2024';
    return true;
  }
  return false;
}

// Export functions for use in server.js
module.exports = {
  isJwtConfigured,
  attemptJwtFix,
  forceSetJwtSecret
};
