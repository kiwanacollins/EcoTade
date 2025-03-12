// API client for handling requests to the backend

// Import getApiBaseUrl from auth.js or redefine it here
function getApiBaseUrl() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000'; // Development
  } else if (hostname === 'forexprox.com' || hostname.includes('forexprox.com')) {
    return 'https://forexprox.com'; // Production
  } else {
    // Fallback to current origin
    return window.location.origin;
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
  }
};

// Use getApiBaseUrl for determining the base API URL
const baseUrl = getApiBaseUrl();
// Configure API URL by appending '/api' to the base URL
const API_URL = `${baseUrl}/api`;

// Add explicit log of which API URL is being used
console.log(`Using API URL: ${API_URL}`);

// Main API request function
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_URL}${endpoint}`;
    
    // Only log in development
    if (ENV.isDevEnvironment) {
      console.log(`Making ${method} request to ${url}`);
    }
    
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
    console.error('API request failed:', error);
    throw error;
  }
}

// Check if server is online - completely skip in production
async function checkServerStatus() {
  // Triple-check we're not in production to prevent localhost calls
  const hostname = window.location.hostname;
  if (hostname === 'forexprox.com' || hostname.includes('forexprox.com') || !ENV.isDevEnvironment) {
    console.log('Production environment detected - skipping server status check');
    return true;
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

// Auth functions
const auth = {
  // Register a new user
  register: async (userData) => {
    return await apiRequest('/auth/register', 'POST', userData);
  },
  
  // Login user
  login: async (credentials) => {
    return await apiRequest('/auth/login', 'POST', credentials);
  },
  
  // Google Authentication
  googleAuth: async (idToken) => {
    try {
      // Triple-check environment to ensure correct behavior
      const hostname = window.location.hostname;
      const isProduction = hostname === 'forexprox.com' || hostname.includes('forexprox.com');
      
      console.log(`Running in ${ENV.isDevEnvironment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
      console.log(`Hostname: ${hostname}, Direct production check: ${isProduction}`);
      
      // In production, COMPLETELY bypass server checks and debug logs
      if (isProduction || !ENV.isDevEnvironment) {
        console.log('Production mode: directly making Google auth API request');
        try {
          return await apiRequest('/auth/google', 'POST', { idToken });
        } catch (apiError) {
          console.error('Google auth API request failed in production:', apiError.message);
          throw apiError;
        }
      }
      
      // Everything below this point only runs in development
      console.log('Development mode: checking server status before Google auth');
      const serverOnline = await checkServerStatus();
      if (!serverOnline) {
        throw new Error('Server is not running or not accessible. Please try again later.');
      }
      
      // Log token details for debugging (only in development)
      console.log('Token length:', idToken ? idToken.length : 0);
      console.log('Token first few characters:', idToken ? idToken.substring(0, 10) + '...' : 'null');
      
      // Detect mobile device for specific handling
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('Mobile device detected for Google auth');
      }
      
      const result = await apiRequest('/auth/google', 'POST', { idToken });
      console.log('Server response for Google auth:', result);
      return result;
    } catch (error) {
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
