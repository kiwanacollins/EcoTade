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
  process.exit(1);
} else {
  console.log('All required environment variables are set!');
}
