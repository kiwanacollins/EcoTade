// API client for handling requests to the backend

// Environment detection
const ENV = {
  isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  get isProd() { return !this.isDev; }
};

// Configure logging based on environment
const logger = {
  log: (...args) => ENV.isDev && console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

// API configuration
const API_CONFIG = {
  baseUrl: ENV.isDev ? 'http://localhost:5000/api' : 'https://forexprox.com/api',
  timeout: 10000, // 10 seconds timeout
  retries: 2,     // Number of retry attempts
  retryDelay: 1000 // Initial retry delay in ms (doubles with each retry)
};

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date();
  }
}

// Main API request function with retry capability
async function apiRequest(endpoint, method = 'GET', data = null, customConfig = {}) {
  const config = { ...API_CONFIG, ...customConfig };
  let retries = config.retries;
  let delay = config.retryDelay;

  while (true) {
    try {
      return await executeRequest(endpoint, method, data, config);
    } catch (error) {
      // Don't retry on certain error types
      if (
        retries <= 0 || 
        error.status === 401 || // Unauthorized
        error.status === 403 || // Forbidden
        error.status === 400 || // Bad request
        error.name === 'AbortError'
      ) {
        throw error;
      }

      logger.warn(`Request failed, retrying (${retries} attempts left): ${error.message}`);
      retries--;
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Execute a single API request
async function executeRequest(endpoint, method, data, config) {
  const url = `${config.baseUrl}${endpoint}`;
  ENV.isDev && logger.log(`Making ${method} request to ${url}`);
  
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
    credentials: 'same-origin' // Include credentials for same-origin requests
  };
  
  // Add request body if data exists
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  // Setup timeout and abort controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  options.signal = controller.signal;
  
  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      logger.warn(`Rate limited. Retrying after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      throw new ApiError('Rate limited, please retry', 429);
    }
    
    // Handle API response
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      
      if (!response.ok) {
        // Format error message
        const errorMsg = responseData.message || `Error ${response.status}: ${response.statusText}`;
        logger.error(`API Error: ${errorMsg}`);
        throw new ApiError(errorMsg, response.status, responseData);
      }
      
      return responseData;
    } else {
      // Handle non-JSON responses
      if (!response.ok) {
        throw new ApiError(`Error ${response.status}: ${response.statusText}`, response.status);
      }
      return { success: true };
    }
  } catch (fetchError) {
    clearTimeout(timeoutId);
    
    // Convert regular errors to ApiError
    if (fetchError.name !== 'ApiError') {
      // Handle network errors with mobile-friendly messages
      if (fetchError.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your internet connection and try again.', 0);
      }
      
      // Provide mobile-friendly error messages
      if (!navigator.onLine) {
        throw new ApiError('You appear to be offline. Please check your internet connection and try again.', 0);
      } else if (fetchError.message.includes('Failed to fetch')) {
        throw new ApiError('Network error. Please check your connection and try again.', 0);
      }
      
      throw new ApiError(fetchError.message, 0);
    }
    
    throw fetchError;
  }
}

// Check if server is online with proper error handling
async function checkServerStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for status check
    
    // Use a dedicated health endpoint
    const healthEndpoint = ENV.isDev ? 'http://localhost:5000/health' : 'https://forexprox.com/health';
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      logger.log('Server is online');
      return true;
    } else {
      logger.warn('Server returned error:', response.status);
      return false;
    }
  } catch (error) {
    logger.error('Server connection error:', error);
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
    const response = await apiRequest('/auth/login', 'POST', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
  
  // Google Authentication
  googleAuth: async (idToken) => {
    try {
      ENV.isDev && logger.log('Making Google auth API request');
      
      // Check if server is online first
      const serverOnline = await checkServerStatus();
      if (!serverOnline) {
        throw new ApiError('Server is not running or not accessible. Please try again later.', 0);
      }
      
      if (!idToken) {
        throw new ApiError('Invalid or missing Google ID token', 400);
      }
      
      const result = await apiRequest('/auth/google', 'POST', { idToken });
      
      // Store token if returned
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      
      return result;
    } catch (error) {
      logger.error('Google auth API request failed:', error);
      
      if (!(error instanceof ApiError)) {
        throw new ApiError(error.message, 0);
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
    try {
      await apiRequest('/auth/logout');
    } finally {
      // Always clear token on logout
      localStorage.removeItem('token');
    }
    return { success: true };
  },
  
  // Get dashboard data
  getDashboard: async () => {
    return await apiRequest('/auth/dashboard');
  }
};

// Check if user is logged in
async function isLoggedIn() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    await auth.getCurrentUser();
    return true;
  } catch (error) {
    // Clear token if it's invalid or expired
    if (error.status === 401) {
      localStorage.removeItem('token');
    }
    return false;
  }
}

// Protect routes - redirect to login if not authenticated
async function requireAuth() {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      window.location.href = './login.html';
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Auth check failed:', error);
    window.location.href = './login.html?error=authcheck';
    return false;
  }
}

// Export API client
const apiClient = {
  request: apiRequest,
  auth,
  isLoggedIn,
  requireAuth,
  checkServerStatus
};

// Make it available globally
window.apiClient = apiClient;
