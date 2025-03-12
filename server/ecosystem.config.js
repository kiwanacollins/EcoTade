module.exports = {
  apps: [{
    name: "forexprox",
    script: "server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      // Provide a fallback MongoDB URI directly in the ecosystem file
      // NOTE: Replace this with your actual MongoDB connection string!
      MONGODB_URI: "mongodb+srv://kiwanacollinskiwana:Snillock256kiwana$@forexproxdb.sy2lk.mongodb.net/?retryWrites=true&w=majority&appName=forexproxDB",
      // Other environment variables can be added here
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
