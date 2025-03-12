/**
 * PM2 Ecosystem Configuration
 * This file defines how PM2 should run your application
 */
module.exports = {
  apps: [{
    name: 'forexprox',
    script: './server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
       MONGO_HOST: 'localhost',
      MONGO_PORT: '27018',  // Changed to match new port
      MONGO_INITDB_ROOT_USERNAME: 'admin',
      MONGO_INITDB_ROOT_PASSWORD: 'password',
      MONGO_DB: 'forexproxdb',
      MONGODB_URI: 'mongodb://admin:password@localhost:27017/forexproxdb?authSource=admin',
      ALLOWED_ORIGINS: 'https://srv749600.hstgr.cloud,http://srv749600.hstgr.cloud'
    },
    error_file: './server/logs/pm2-error.log',
    out_file: './server/logs/pm2-out.log',
    log_file: './server/logs/pm2-combined.log',
    time: true,
    // Ensure the application doesn't restart too frequently when crashing
    min_uptime: 10000,
    max_restarts: 10,
    restart_delay: 5000,
    // Give the application time to start up before checking if it's ready
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
