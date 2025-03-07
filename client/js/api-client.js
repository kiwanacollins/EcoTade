// API client for handling requests to the backend

const API_URL = 'http://localhost:5000/api';

// Main API request function
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_URL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Important for cookies
    };
    
    // Add authorization token from localStorage if it exists
    const token = localStorage.getItem('token');
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }
    
    return result;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Check if server is online
async function checkServerStatus() {
  try {
    // Use the server's root endpoint instead of /api
    const response = await fetch('http://localhost:5000/', {
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
      console.log('Making Google auth API request');
      
      // Check if server is online first
      const serverOnline = await checkServerStatus();
      if (!serverOnline) {
        throw new Error('Server is not running or not accessible. Please start the server before continuing.');
      }
      
      console.log('Token length:', idToken ? idToken.length : 0);
      console.log('Token first few characters:', idToken ? idToken.substring(0, 10) + '...' : 'null');
      
      const result = await apiRequest('/auth/google', 'POST', { idToken });
      console.log('Server response for Google auth:', result);
      return result;
    } catch (error) {
      console.error('Google auth API request failed:', error);
      // Try to provide more detailed error info
      if (error.response) {
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
