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
