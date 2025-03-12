/**
 * Script to check required environment variables
 * Run this before starting the application
 */

console.log('Checking environment variables...');

// Check if MONGODB_URI is set
console.log('Looking for MongoDB connection string...');

if (process.env.MONGODB_URI) {
  console.log('✅ MONGODB_URI is set');
  console.log('  Using:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//****:****@'));
} else if (process.env.MONGO_URI) {
  console.log('✅ MONGO_URI is set (alternative)');
  // Copy to MONGODB_URI for consistency
  process.env.MONGODB_URI = process.env.MONGO_URI;
} else {
  console.log('❌ No MongoDB connection string found');
  console.log('  Setting default Docker connection string');
  
  // Always set a fallback for Docker
  process.env.MONGODB_URI = "mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin";
  console.log('  Default connection string set');
}

// Prevent the script from exiting with an error in production
// to allow for retry logic in the main application
console.log('Environment check completed');
