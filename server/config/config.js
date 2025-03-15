// Use environment variable or fallback with warning
const jwtSecret = process.env.JWT_SECRET || 'ecotrade_jwt_secret';

// Warn if using fallback in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: Using fallback JWT_SECRET in production environment!');
  console.warn('This is insecure. Please set JWT_SECRET as an environment variable.');
}

module.exports = {
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecotrade',
  jwtSecret,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h'
};
