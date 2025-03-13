/**
 * Validates required environment variables for the application
 * @returns {Object} Object containing validation result and missing variables
 */
const validateEnvironmentVars = () => {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_EXPIRE',
    'JWT_COOKIE_EXPIRE',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return {
      valid: false,
      missingVars
    };
  }
  
  return {
    valid: true,
    missingVars: []
  };
};

/**
 * Checks the configuration on server startup and logs warnings
 */
const checkConfigOnStartup = () => {
  const { valid, missingVars } = validateEnvironmentVars();
  
  if (!valid) {
    console.warn('⚠️ WARNING: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.warn(`  - ${varName}`);
    });
    console.warn('Some application features may not work correctly!');
  } else {
    console.log('✅ All required environment variables are configured');
  }
};

module.exports = {
  validateEnvironmentVars,
  checkConfigOnStartup
};
