/**
 * Script to verify JWT configuration
 * Run this to ensure authentication will work properly
 */

console.log('Checking JWT configuration...');

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set! User authentication will fail.');
  console.error('Please set JWT_SECRET in your environment or .env file');
  
  // Set a fallback for development only
  if (process.env.NODE_ENV !== 'production') {
    process.env.JWT_SECRET = 'ecotradesecurekey2024';
    console.log('✅ Set a default development JWT_SECRET');
  }
} else {
  console.log('✅ JWT_SECRET is properly configured');
  
  // Don't log the actual secret in production
  if (process.env.NODE_ENV === 'production') {
    console.log('  Secret is hidden for security');
  } else {
    console.log('  Using secret: ', process.env.JWT_SECRET.substring(0, 3) + '...');
  }
}

// Check JWT expiration settings
if (!process.env.JWT_EXPIRE) {
  console.log('❌ JWT_EXPIRE not set, using default of 30d');
  process.env.JWT_EXPIRE = '30d';
} else {
  console.log('✅ JWT_EXPIRE set to:', process.env.JWT_EXPIRE);
}

// Check cookie expiration
if (!process.env.JWT_COOKIE_EXPIRE) {
  console.log('❌ JWT_COOKIE_EXPIRE not set, using default of 30 days');
  process.env.JWT_COOKIE_EXPIRE = '30';
} else {
  console.log('✅ JWT_COOKIE_EXPIRE set to:', process.env.JWT_COOKIE_EXPIRE, 'days');
}

module.exports = {
  isJwtConfigured: !!process.env.JWT_SECRET
};
