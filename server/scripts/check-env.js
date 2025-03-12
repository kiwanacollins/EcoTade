/**
 * Script to check required environment variables
 * Run this before starting the application
 */

const requiredEnvVars = ['MONGODB_URI'];
const missingVars = [];

console.log('Checking environment variables...');

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
    console.error('\nIf running with PM2, make sure to:');
    console.error('- Use the ecosystem.config.js file: pm2 start ecosystem.config.js');
    console.error('- Or set the variable directly: pm2 set MONGODB_URI mongodb+srv://...');
  }
  
  // In production, we'll let the application continue to allow for retry logic
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
} else {
  console.log('All required environment variables are set!');
}
