module.exports = {
  apps: [{
    name: "forexprox",
    script: "server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      // Update to use localhost instead of 'mongodb' container name
      MONGODB_URI: "mongodb://admin:password@localhost:27017/forexproxdb?authSource=admin",
      PORT: "5000"
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
