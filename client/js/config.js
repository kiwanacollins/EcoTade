/**
 * Application configuration
 * Automatically detects environment and sets appropriate variables
 */

const Config = {
  // Environment detection
  environment: (function() {
    // Check if we're on the production domain
    const hostname = window.location.hostname;
    if (hostname === 'forexprox.com' || hostname.includes('.forexprox.com')) {
      return 'production';
    } else if (hostname === 'staging.forexprox.com') {
      return 'staging';
    } else {
      return 'development';
    }
  })(),
  
  // API endpoints
  api: {
    baseUrl: (function() {
      const hostname = window.location.hostname;
      if (hostname === 'forexprox.com' || hostname.includes('.forexprox.com')) {
        return 'https://api.forexprox.com'; // Production API endpoint
      } else if (hostname === 'staging.forexprox.com') {
        return 'https://api-staging.forexprox.com'; // Staging API endpoint
      } else {
        return 'http://localhost:5000'; // Development API endpoint
      }
    })(),
    
    // Helper to generate full API URLs
    getUrl(path) {
      return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    }
  },
  
  // Feature flags
  features: {
    debug: (function() {
      // Enable debug in non-production environments
      const hostname = window.location.hostname;
      return hostname !== 'forexprox.com' && !hostname.includes('.forexprox.com');
    })()
  }
};

// Log configuration in non-production environments
if (Config.environment !== 'production') {
  console.log('Config initialized:', Config);
}

// Prevent modification of config
Object.freeze(Config);

// Export for use in other files
window.AppConfig = Config;
