// API client for handling requests to the backend now

// Get API base URL based on environment - improved detection
function getApiBaseUrl() {
  // HARDCODED PRODUCTION API URL - Using the actual VPS domain
  const PRODUCTION_API_URL = 'https://srv749600.hstgr.cloud'; // Updated to actual VPS domain
  
  const hostname = window.location.hostname;
  
  console.log('Hostname detection for API URL:', hostname);
  
  // Force production API for these domains
  if (hostname === 'forexprox.com' || 
      hostname.includes('forexprox.com') || 
      hostname.includes('www.forexprox.com')) {
    console.log('Production domain detected - FORCING production API URL:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }
  // Local development
  else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
    console.log('Local development detected - using localhost:5000');
    return 'http://localhost:5000';
  }
  // Default to production for any other domains
  else {
    console.log('Unknown domain - defaulting to PRODUCTION API:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }
}

// Environment detection with additional debugging
const ENV = {
  isDev: function() {
    // Check if running on localhost or development environment
    const hostname = window.location.hostname;
    // Explicitly check for production domain first
    if (hostname === 'forexprox.com' || hostname.includes('forexprox.com')) {
      return false; // Always return false for production domain
    }
    // Only these specific hostnames are considered development
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.includes('192.168.');
  },
  domain: 'forexprox.com',
  // Cache the result to avoid repeated checks
  _cachedIsDev: null,
  get isDevEnvironment() {
    if (this._cachedIsDev === null) {
      this._cachedIsDev = this.isDev();
      console.log(`Environment detected as: ${this._cachedIsDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
      // Log the hostname for debugging
      console.log(`Current hostname: ${window.location.hostname}`);
    }
    return this._cachedIsDev;
  },
  
  isProduction: function() {
    const hostname = window.location.hostname;
    return hostname === 'forexprox.com' || hostname.includes('forexprox.com');
  },
  
  _cachedIsProduction: null,
  get isProductionEnvironment() {
    if (this._cachedIsProduction === null) {
      this._cachedIsProduction = this.isProduction();
      console.log(`Production environment check: ${this._cachedIsProduction ? 'YES' : 'NO'}`);
    }
    return this._cachedIsProduction;
  }
};

// Updated baseUrl: use the current hostname to choose the proper backend URL
const baseUrl = getApiBaseUrl();

// Ensure API_URL is properly defined in global scope
window.API_URL = `${baseUrl}/api`;
const API_URL = window.API_URL;

// Add explicit log of which API URL is being used
console.log(`Using API URL: ${API_URL}`);

// Create a global function to output the complete API configuration
window.debugAPIConfig = function() {
  return {
    hostname: window.location.hostname,
    baseUrl: baseUrl,
    apiUrl: API_URL,
    isProduction: ENV.isProductionEnvironment,
    isDev: ENV.isDevEnvironment
  };
};
console.log('API configuration:', window.debugAPIConfig());

// Main API request function
async function apiRequest(endpoint, method = 'GET', data = null) {
  // Print the full URL we're requesting to make debugging easier
  const url = `${API_URL}${endpoint}`;
  console.log(`API REQUEST: ${method} ${url}`);
  
  try {
    // Additional safeguard: check hostname again at request time
    if (window.location.hostname === 'forexprox.com' || window.location.hostname.includes('forexprox.com')) {
      if (!API_URL.includes('forexprox.com')) {
        console.error('Critical error: Production API URL mismatch!');
        throw new Error('Server configuration error. Please contact support.');
      }
    }
    
    console.log(`Making ${method} request to ${url}`);
    
    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Prepare request options
    const options = {
      method,
      headers,
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin' // Better for handling cookies
    };
    
    // Add request body if data exists
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    // Make the request with timeout for mobile networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    options.signal = controller.signal;
    
    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      // Handle API response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        
        if (!response.ok) {
          // Format error message
          const errorMsg = responseData.message || `Error ${response.status}: ${response.statusText}`;
          console.error(`API Error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        return responseData;
      } else {
        // Handle non-JSON responses
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return { success: true };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Enhanced error logging
      console.error('Fetch error details:', {
        message: fetchError.message,
        endpoint: endpoint,
        url: url,
        online: navigator.onLine,
        apiUrl: API_URL,
        baseUrl: baseUrl,
        hostname: window.location.hostname
      });
      
      // Handle network errors with mobile-friendly messages
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out');
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      
      // Provide mobile-friendly error messages
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      } else if (fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('API request failed:', error, 'to endpoint:', endpoint);
    throw error;
  }
}

// Check if server is online - completely skip in production
async function checkServerStatus() {
  // Triple-check we're not in production to prevent localhost calls
  if (ENV.isProductionEnvironment) {
    console.log('Production environment detected - skipping server status check');
    return true; // Just return success in production
  }
  
  try {
    // Only run this code in development - use the proper base URL
    const healthEndpoint = `${baseUrl}/health`;
    
    console.log('Checking server status in DEVELOPMENT mode...');
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
    });
    
    if (response.ok) {
      console.log('Server is online');
      return true;
    } else {
      console.error('Server returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Server connection error:', error);
    return false;
  }
}

// Add CSP error detection and handling
function setupCSPErrorHandling() {
  if (typeof window !== 'undefined') {
    // Listen for CSP violation reports
    document.addEventListener('securitypolicyviolation', (e) => {
      console.log('CSP violation detected:', e.blockedURI, 'directive:', e.violatedDirective);
      
      // Check specifically for Google authentication issues
      if (e.blockedURI.includes('accounts.google.com') && 
          (e.violatedDirective.includes('frame-ancestors') || e.violatedDirective.includes('frame-src'))) {
        
        console.warn('Google authentication frame blocked by CSP. Will use alternative auth method.');
        
        // Set a flag to use alternative auth method
        localStorage.setItem('use_popup_auth', 'true');
        
        // Dispatch custom event that can be handled by auth.js
        const event = new CustomEvent('googleFrameBlocked', { 
          detail: { message: 'Google authentication frame blocked by CSP' } 
        });
        document.dispatchEvent(event);
      }
    });
  }
}

// Call setup function immediately
setupCSPErrorHandling();

// Auth functions
const auth = {
  // Register a new user
  register: async (userData) => {
    console.log('Register API call with base URL:', baseUrl);
    console.log('Register API call with API URL:', API_URL);
    return await apiRequest('/auth/register', 'POST', userData);
  },
  
  // Login user
  login: async (credentials) => {
    return await apiRequest('/auth/login', 'POST', credentials);
  },
  
  // Google Authentication with CSP handling
  googleAuth: async (idToken) => {
    try {
      // Better production detection using the ENV object
      const isProduction = ENV.isProductionEnvironment;
      console.log('Google Auth - production mode?', isProduction);
      
      // If we've detected CSP issues, log this information
      if (localStorage.getItem('use_popup_auth') === 'true') {
        console.log('Using popup authentication flow due to detected CSP restrictions');
        // This flag is just informational - the actual popup implementation should be in auth.js
      }
      
      // In production, COMPLETELY bypass server checks
      if (isProduction) {
        console.log('Production mode: directly making Google auth API request');
        console.log('Using API endpoint:', API_URL);
        try {
          return await apiRequest('/auth/google', 'POST', { idToken });
        } catch (apiError) {
          // Look for CSP-related errors
          if (apiError.message && (
              apiError.message.includes('Content Security Policy') || 
              apiError.message.includes('frame-ancestors') ||
              apiError.message.includes('Refused to frame'))) {
            console.error('CSP error detected during Google authentication:', apiError.message);
            throw new Error('Google authentication blocked by browser security policy. Please try using a different browser or contact support.');
          }
          console.error('Google auth API request failed in production:', apiError.message);
          throw apiError;
        }
      }
      
      // Development environment code - SKIP SERVER CHECK IN PRODUCTION
      console.log('Development mode: checking server status before Google auth');
      const serverOnline = await checkServerStatus(); 
      if (!serverOnline) {
        throw new Error('Server is not running or not accessible. Please try again later.');
      }
      
      // Log token details for debugging (only in development)
      console.log('Token length:', idToken ? idToken.length : 0);
      console.log('Token first few characters:', idToken ? idToken.substring(0, 10) + '...' : 'null');
      
      const result = await apiRequest('/auth/google', 'POST', { idToken });
      console.log('Server response for Google auth:', result);
      return result;
    } catch (error) {
      // Additional CSP error handling
      if (error.message && (
          error.message.includes('Content Security Policy') || 
          error.message.includes('frame-ancestors') ||
          error.message.includes('Refused to frame'))) {
        console.error('CSP error detected:', error.message);
        localStorage.setItem('use_popup_auth', 'true');
        throw new Error('Authentication blocked by browser security policy. Please try again.');
      }
      
      console.error('Google auth API request failed:', error);
      
      // Provide more helpful error messages for mobile users
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
  
  // Logout user
  logout: async () => {
    return await apiRequest('/auth/logout');
  },
  
  // Get dashboard data
  getDashboard: async () => {
    return await apiRequest('/auth/dashboard');
  }
};

// Check if user is logged in
async function isLoggedIn() {
  try {
    await auth.getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

// Protect routes - redirect to login if not authenticated
async function requireAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}
