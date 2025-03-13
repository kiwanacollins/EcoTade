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
      // Add more origins to support various mobile domains
      ALLOWED_ORIGINS: "https://forexprox.com,https://www.forexprox.com,https://m.forexprox.com,http://localhost:3000,http://127.0.0.1:3000,capacitor://localhost,http://localhost",
      JWT_SECRET: process.env.JWT_SECRET || "ecotradesecurekey2024",  // Default for dev only
      JWT_EXPIRE: "30d",                   // JWT token expiration
      JWT_COOKIE_EXPIRE: "30",              // Cookie expiration in days
      // Enable mobile-friendly CORS settings
      ENABLE_MOBILE_SUPPORT: "true"
    },
    env_production: {
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "https://forexprox.com,https://www.forexprox.com,https://m.forexprox.com"
    },
    // Load .env file automatically (this will override the values above if present)
    env_file: ".env",
    // PM2 specific settings for better stability
    max_memory_restart: "300M",
    restart_delay: 4000,
    max_restarts: 10
  }]
};
