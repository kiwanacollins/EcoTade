module.exports = {
  apps: [{
    name: "forexprox",
    script: "server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      // Update port to 27018 which is the actual port being used
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27018/forexproxdb",
      PORT: process.env.PORT || "5000",
      ALLOWED_ORIGINS: "https://forexprox.com,https://www.forexprox.com",
      JWT_SECRET: process.env.JWT_SECRET,  // Should be set in .env file
      JWT_EXPIRE: "30d",                   // JWT token expiration
      JWT_COOKIE_EXPIRE: "30"              // Cookie expiration in days
    },
    env_production: {
      NODE_ENV: "production"
    },
    // Load .env file automatically (this will override the values above if present)
    env_file: ".env",
    // PM2 specific settings for better stability
    max_memory_restart: "300M",
    restart_delay: 4000,
    max_restarts: 10
  }]
};
