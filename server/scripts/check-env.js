/**
 * Script to check required environment variables
 * Run this before starting the application
 */

const requiredEnvVars = ['MONGODB_URI'];
const missingVars = [];

console.log('Checking environment variables...');

// Check if we're in a PM2 environment
const isPM2 = 'PM2_HOME' in process.env || process.env.NODE_APP_INSTANCE !== undefined;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    // Check alternative names
    if (varName === 'MONGODB_URI' && process.env.MONGO_URI) {
      console.log(`✓ Found alternative for ${varName}: MONGO_URI`);
    } else {
      missingVars.push(varName);
      console.log(`✗ Missing required environment variable: ${varName}`);
    }
  } else {
    console.log(`✓ Found ${varName}`);
  }
});

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables. Please check your .env file or server environment.');
  console.error('Missing variables:', missingVars.join(', '));
  
  if (missingVars.includes('MONGODB_URI')) {
    console.error('\nFor MongoDB connection, ensure you have one of these set:');
    console.error('1. MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/dbname');
    console.error('2. MONGO_URI=mongodb+srv://username:password@your-cluster.mongodb.net/dbname');
    
    if (isPM2) {
      console.error('\nSince you are using PM2, make sure to configure environment variables using one of these methods:');
      console.error('1. Create/update .env file in your project root directory');
      console.error('2. Use the ecosystem.config.js file with env_file option');
      console.error('3. Set the variable directly with: pm2 set MONGODB_URI mongodb+srv://...');
      console.error('4. Set in ecosystem file: pm2 restart ecosystem.config.js --update-env');
    }
  }
  
  // In production or PM2 environment, we'll let the application continue to allow for retry logic
  if (process.env.NODE_ENV !== 'production' && !isPM2) {
    process.exit(1);
  } else {
    console.warn('WARNING: Starting in production mode despite missing variables. Connection retries will be attempted.');
  }
} else {
  console.log('All required environment variables are set!');
}
