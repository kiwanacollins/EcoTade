module.exports = {
  apps: [{
    name: "forexprox",
    script: "server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      // You can add default values here, but for security reasons
      // it's better to load these from a .env file or PM2 environment
    },
    env_production: {
      NODE_ENV: "production",
    },
    // Load .env file automatically
    env_file: ".env"
  }]
};
