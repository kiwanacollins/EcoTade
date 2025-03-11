// API client for handling requests to the backend

// Environment detection with proper domain support
const ENV = {
  isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  domain: 'forexprox.com'
};

// Configure API URL based on environment
const API_URL = ENV.isDev ? 
  'http://localhost:5000/api' : 
  `https://${ENV.domain}/api`;

// Main API request function
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_URL}${endpoint}`;
    
    // Only log in development
    if (ENV.isDev) {
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

// Check if server is online with proper domain
async function checkServerStatus() {
  try {
    // Use the correct server URL based on environment
    const healthEndpoint = ENV.isDev ? 
      'http://localhost:5000/health' : 
      `https://${ENV.domain}/health`;
    
    if (!ENV.isDev) {
      // Skip health check in production for better performance
      // We assume the server is online in production
      return true;
    }
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
    });
    
    if (response.ok) {
      if (ENV.isDev) {
        console.log('Server is online');
      }
      return true;
    } else {
      console.error('Server returned error:', response.status);
      return false;
    }
  } catch (error) {
    if (ENV.isDev) {
      console.error('Server connection error:', error);
      return false;
    } else {
      // In production, assume server is online even if health check fails
      console.warn('Health check failed but continuing in production');
      return true;
    }
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
      console.log('Making Google auth API request');
      
      // In production, we'll skip the server check to improve performance
      if (!ENV.isDev) {
        // Directly make the API request in production
        const result = await apiRequest('/auth/google', 'POST', { idToken });
        return result;
      }
      
      // Only check server status in development
      const serverOnline = await checkServerStatus();
      if (!serverOnline) {
        throw new Error('Server is not running or not accessible. Please try again later.');
      }
      
      // Log token details for debugging (only in development)
      if (ENV.isDev) {
        console.log('Token length:', idToken ? idToken.length : 0);
        console.log('Token first few characters:', idToken ? idToken.substring(0, 10) + '...' : 'null');
      }
      
      // Detect mobile device for specific handling
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && ENV.isDev) {
        console.log('Mobile device detected for Google auth');
      }
      
      const result = await apiRequest('/auth/google', 'POST', { idToken });
      
      if (ENV.isDev) {
        console.log('Server response for Google auth:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Google auth API request failed:', error);
      
      // Provide more helpful error messages for mobile users
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection issue. Please check your mobile data or WiFi connection.');
      }
      
      // More detailed error info only in development
      if (error.response && ENV.isDev) {
        console.error('Error response:', error.response);
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
