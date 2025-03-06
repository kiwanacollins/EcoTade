// Authentication functions for EcoTrade

// Register a new user
async function register(event) {
  event.preventDefault();
  
  const fullName = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const termsAccepted = document.getElementById('terms').checked;
  
  // Reset previous errors
  document.getElementById('signup-error').textContent = '';
  
  // Form validation
  if (!fullName || !email || !password) {
    document.getElementById('signup-error').textContent = 'All fields are required';
    return;
  }
  
  if (password !== confirmPassword) {
    document.getElementById('signup-error').textContent = 'Passwords do not match';
    return;
  }
  
  if (!termsAccepted) {
    document.getElementById('signup-error').textContent = 'You must accept the terms and conditions';
    return;
  }
  
  // Get submit button and save original text before changing it
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  
  try {
    // Show loading state
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    
    // Call API
    const response = await auth.register({
      name: fullName,
      email,
      password
    });
    
    console.log('Registration successful:', response);
    
    // Store token if returned
    if (response.token) {
      console.log('Storing auth token');
      localStorage.setItem('token', response.token);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 500);
    } else {
      console.error('No token received after registration');
      document.getElementById('signup-error').textContent = 'Authentication error';
    }
  } catch (error) {
    document.getElementById('signup-error').textContent = error.message || 'Registration failed';
    console.error('Registration error:', error);
    
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

// Login user
async function login(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Reset previous errors
  document.getElementById('login-error').textContent = '';
  
  // Form validation
  if (!email || !password) {
    document.getElementById('login-error').textContent = 'Email and password are required';
    return;
  }
  
  // Get submit button and save original text before changing it
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  
  try {
    // Show loading state
    submitButton.textContent = 'Logging In...';
    submitButton.disabled = true;
    
    // Call API
    const response = await auth.login({
      email,
      password
    });
    
    console.log('Login successful:', response);
    
    // Store token if returned
    if (response.token) {
      console.log('Storing auth token');
      localStorage.setItem('token', response.token);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 500);
    } else {
      console.error('No token received after login');
      document.getElementById('login-error').textContent = 'Authentication error';
    }
  } catch (error) {
    document.getElementById('login-error').textContent = error.message || 'Login failed';
    console.error('Login error:', error);
    
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

// Logout user
async function logout() {
  try {
    await auth.logout();
    localStorage.removeItem('token');
    window.location.href = './login.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if API call fails
    localStorage.removeItem('token');
    window.location.href = './login.html';
  }
}

// Add event listeners after page loads
document.addEventListener('DOMContentLoaded', () => {
  // Registration form
  const registrationForm = document.getElementById('registration-form');
  if (registrationForm) {
    registrationForm.addEventListener('submit', register);
  }
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', login);
  }
  
  // Logout buttons
  const logoutButtons = document.querySelectorAll('.logout-btn');
  logoutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });

  // Check if we are on dashboard page and user is authenticated
  if (window.location.pathname.includes('dashboard.html')) {
    // This will be handled by dashboard.js, but as a fallback
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = './login.html';
    }
  }
});