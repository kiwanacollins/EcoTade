module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecotrade',
  jwtSecret: process.env.JWT_SECRET || 'ecotrade_jwt_secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h'
};
