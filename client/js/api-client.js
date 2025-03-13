// API client for handling requests to the backend now

// HARDCODED SERVER URL - No conditional logic at all
const PRODUCTION_API_URL = 'https://srv749600.hstgr.cloud';

// Debugging function to track URL usage
function trackURLUsage(functionName, url) {
  console.log(`[TRACKING URL] Function: ${functionName}, URL: ${url}`);
}

// Get API base URL - simplified to ALWAYS use production
function getApiBaseUrl() {
  console.log('Using FIXED production API URL:', PRODUCTION_API_URL);
  trackURLUsage('getApiBaseUrl', PRODUCTION_API_URL);
  return PRODUCTION_API_URL;
}

// Environment detection with additional debugging
const ENV = {
  isDev: function() {
    const hostname = window.location.hostname;
    if (hostname === 'forexprox.com' || hostname.includes('forexprox.com')) {
      return false;
    }
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.includes('192.168.');
  },
  domain: 'forexprox.com',
  _cachedIsDev: null,
  get isDevEnvironment() {
    if (this._cachedIsDev === null) {
      this._cachedIsDev = this.isDev();
      console.log(`Environment detected as: ${this._cachedIsDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
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

// Fixed baseUrl - ALWAYS use the production URL
const baseUrl = PRODUCTION_API_URL;
trackURLUsage('global initialization', baseUrl);

// Ensure API_URL is properly defined in global scope
window.API_URL = `${baseUrl}/api`;
const API_URL = window.API_URL;
trackURLUsage('API_URL definition', API_URL);

// Add explicit log of which API URL is being used
console.log(`FIXED API URL: ${API_URL}`);

// Create a global function to output the complete API configuration
window.debugAPIConfig = function() {
  return {
    hostname: window.location.hostname,
    baseUrl: baseUrl,
    apiUrl: API_URL,
    isProduction: true,
    isDev: false
  };
};
console.log('API configuration:', window.debugAPIConfig());

// Main API request function
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_URL}${endpoint}`;
  console.log(`API REQUEST: ${method} ${url}`);
  trackURLUsage('apiRequest', url);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use the more compatible 'same-origin' credentials mode by default,
    // and only use 'include' for cross-origin requests when absolutely necessary
    const credentialsMode = window.location.hostname !== new URL(url).hostname ? 'include' : 'same-origin';
    
    console.log('Using credentials mode:', credentialsMode);
    
    const options = {
      method,
      headers,
      mode: 'cors',
      cache: 'no-cache',
      credentials: credentialsMode,
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    options.signal = controller.signal;
    
    console.log('Making fetch request to:', url, 'with options:', JSON.stringify({
      ...options,
      headers: { ...headers },
      body: data ? '[DATA]' : undefined
    }));
    
    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        
        if (!response.ok) {
          const errorMsg = responseData.message || `Error ${response.status}: ${response.statusText}`;
          console.error(`API Error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        return responseData;
      } else {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return { success: true };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.message === 'Failed to fetch' && url.includes('localhost')) {
        console.error('CRITICAL ERROR: Still trying to connect to localhost instead of VPS!');
        console.error('Current API_URL:', API_URL);
        console.error('This should be fixed by forcing the VPS URL. Please check HTML script loading order.');
        throw new Error('Connection error: Still attempting to use localhost URL. Please contact support.');
      }
      
      console.error('Fetch error details:', {
        message: fetchError.message,
        endpoint: endpoint,
        url: url,
        online: navigator.onLine,
        apiUrl: API_URL,
        baseUrl: baseUrl,
        hostname: window.location.hostname
      });
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      
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
  if (ENV.isProductionEnvironment) {
    console.log('Production environment detected - skipping server status check');
    return true;
  }
  
  try {
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
    document.addEventListener('securitypolicyviolation', (e) => {
      console.log('CSP violation detected:', e.blockedURI, 'directive:', e.violatedDirective);
      
      if (e.blockedURI.includes('accounts.google.com') && 
          (e.violatedDirective.includes('frame-ancestors') || e.violatedDirective.includes('frame-src'))) {
        
        console.warn('Google authentication frame blocked by CSP. Will use alternative auth method.');
        
        localStorage.setItem('use_popup_auth', 'true');
        
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
  register: async (userData) => {
    console.log('Register API call with base URL:', baseUrl);
    console.log('Register API call with API URL:', API_URL);
    return await apiRequest('/auth/register', 'POST', userData);
  },
  
  login: async (credentials) => {
    return await apiRequest('/auth/login', 'POST', credentials);
  },
  
  googleAuth: async (idToken) => {
    try {
      const isProduction = ENV.isProductionEnvironment;
      console.log('Google Auth - production mode?', isProduction);
      
      if (localStorage.getItem('use_popup_auth') === 'true') {
        console.log('Using popup authentication flow due to detected CSP restrictions');
      }
      
      if (isProduction) {
        console.log('Production mode: directly making Google auth API request');
        console.log('Using API endpoint:', API_URL);
        try {
          return await apiRequest('/auth/google', 'POST', { idToken });
        } catch (apiError) {
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
      
      console.log('Development mode: checking server status before Google auth');
      const serverOnline = await checkServerStatus(); 
      if (!serverOnline) {
        throw new Error('Server is not running or not accessible. Please try again later.');
      }
      
      console.log('Token length:', idToken ? idToken.length : 0);
      console.log('Token first few characters:', idToken ? idToken.substring(0, 10) + '...' : 'null');
      
      const result = await apiRequest('/auth/google', 'POST', { idToken });
      console.log('Server response for Google auth:', result);
      return result;
    } catch (error) {
      if (error.message && (
          error.message.includes('Content Security Policy') || 
          error.message.includes('frame-ancestors') ||
          error.message.includes('Refused to frame'))) {
        console.error('CSP error detected:', error.message);
        localStorage.setItem('use_popup_auth', 'true');
        throw new Error('Authentication blocked by browser security policy. Please try again.');
      }
      
      console.error('Google auth API request failed:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
  
  logout: async () => {
    return await apiRequest('/auth/logout');
  },
  
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
