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

// Google authentication - SINGLE consolidated implementation
async function handleGoogleAuth(response) {
  try {
    console.log('Google sign-in response received:', response);
    
    // Check if we have a credential in the response
    if (!response || !response.credential) {
      console.error('Invalid Google response - missing credential');
      throw new Error('No valid credential received from Google');
    }
    
    const credential = response.credential;
    console.log('Got Google credential:', credential.substring(0, 10) + '...');
    
    showGoogleLoadingState();
    
    try {
      // Call our API with the Google token
      console.log('Sending token to backend...');
      console.log('Credential being sent:', credential); // Log the credential
      const authResponse = await auth.googleAuth(credential);
      
      console.log('Google authentication successful:', authResponse);
      
      // Store token if returned
      if (authResponse.token) {
        console.log('Storing auth token');
        localStorage.setItem('token', authResponse.token);
        
        // Store user info if available
        if (authResponse.user) {
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 500);
      } else {
        console.error('No token received after Google authentication');
        const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
        if (errorElem) {
          errorElem.textContent = 'Authentication error: No token received';
          errorElem.style.display = 'block';
        }
        hideGoogleLoadingState();
      }
    } catch (apiError) {
      console.error('API error during Google auth:', apiError);
      const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
      if (errorElem) {
        // Provide more helpful message for connection errors
        if (apiError.message && apiError.message.includes('Server is not running')) {
          errorElem.textContent = 'Cannot connect to authentication server. Please try again later or contact support.';
        } else {
          errorElem.textContent = apiError.message || 'Server error during Google authentication';
        }
        errorElem.style.display = 'block';
      }
      hideGoogleLoadingState();
    }
  } catch (error) {
    console.error('Google auth error:', error);
    const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
    if (errorElem) {
      errorElem.textContent = error.message || 'Google authentication failed';
      errorElem.style.display = 'block';
    }
    hideGoogleLoadingState();
  }
}

// Show loading state for Google button
function showGoogleLoadingState() {
  const googleBtns = document.querySelectorAll('.btn-google');
  googleBtns.forEach(btn => {
    btn.disabled = true;
    const originalText = btn.querySelector('span').textContent;
    btn.setAttribute('data-original-text', originalText);
    btn.querySelector('span').textContent = 'Authenticating...';
  });
}

// Hide loading state for Google button
function hideGoogleLoadingState() {
  const googleBtns = document.querySelectorAll('.btn-google');
  googleBtns.forEach(btn => {
    btn.disabled = false;
    const originalText = btn.getAttribute('data-original-text');
    if (originalText) {
      btn.querySelector('span').textContent = originalText;
    }
  });
}

// Enhanced origin debugging function
function detectOrigin() {
  const origin = window.location.origin;
  const fullUrl = window.location.href;
  console.log('Current origin:', origin);
  console.log('Full URL:', fullUrl);
  console.log('Pathname:', window.location.pathname);
  
  // Display the origin in the UI for easy verification
  const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
  if (errorElem) {
    errorElem.textContent = `Using origin: ${origin} - Authorize this in Google Cloud Console`;
  }
  
  return origin;
}

// Initialize Google Sign In - SINGLE consolidated implementation
function initializeGoogleSignIn() {
  try {
    console.log('Initializing Google Sign-In');
    
    // First check if Google API is actually loaded
    if (typeof google === 'undefined' || !google.accounts) {
      console.error('Google accounts API not available');
      disableGoogleButtons('Google Sign-In API not available');
      return;
    }
    
    const clientId = '1031648174548-ufj6a2fmumi5s6bpcvgiuvni77olcvrd.apps.googleusercontent.com';
    console.log('Using client ID:', clientId);
    
    // Initialize Google Identity Services with relaxed settings
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleAuth,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup', // Try popup mode instead of redirect
      itp_support: true // Enable Intelligent Tracking Prevention support
    });

    // Attempt to render a button as fallback
    try {
      // Try to render a Google button as a fallback
      const googleButtonContainers = document.querySelectorAll('.social-buttons');
      if (googleButtonContainers.length > 0) {
        googleButtonContainers.forEach(container => {
          // Create a container for the Google button
          const buttonContainer = document.createElement('div');
          buttonContainer.id = 'g_id_onload';
          buttonContainer.style.marginTop = '10px';
          container.appendChild(buttonContainer);
          
          // Render the button
          google.accounts.id.renderButton(
            buttonContainer,
            { 
              theme: 'outline', 
              size: 'large',
              type: 'standard',
              text: 'sign_in_with',
              shape: 'rectangular',
              logo_alignment: 'center'
            }
          );
        });
      }
    } catch (renderError) {
      console.error('Error rendering Google button:', renderError);
    }
    
    // Set up click handlers for Google buttons
    const googleButtons = document.querySelectorAll('.btn-google');
    googleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Google button clicked, showing prompt');
        
        try {
          // Show the Google sign-in prompt with improved error handling
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              const reason = notification.getNotDisplayedReason() || 
                             notification.getSkippedReason() || 
                             'unknown_reason';
              console.log('Google sign-in prompt not displayed:', reason);
              
              const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
              if (errorElem) {
                // Show user-friendly error message based on reason
                let errorMessage = 'Google sign-in prompt could not be displayed. ';
                
                switch (reason) {
                  case 'browser_not_supported':
                    errorMessage += 'Your browser might not support this feature.';
                    break;
                  case 'third_party_cookies_blocked':
                    errorMessage += 'Please enable third-party cookies in your browser settings.';
                    break;
                  case 'missing_client_id':
                    errorMessage += 'Application configuration error.';
                    break;
                  default:
                    errorMessage += 'Try disabling ad blockers or using incognito mode.';
                }
                
                errorElem.textContent = errorMessage;
                errorElem.style.display = 'block';
                
                // Create a direct link for manual Google sign-in as last resort
                const signInLink = document.createElement('a');
                signInLink.href = `https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin + '/callback.html')}&scope=email%20profile`;
                signInLink.className = 'btn btn-google-alt';
                signInLink.textContent = "Try Alternative Google Sign-In";
                signInLink.target = "_blank";
                errorElem.parentNode.appendChild(signInLink);
              }
            }
          });
        } catch (promptError) {
          console.error('Error displaying Google sign-in prompt:', promptError);
          const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
          if (errorElem) {
            errorElem.textContent = 'Google sign-in is currently unavailable. Please try using email registration or try again later.';
            errorElem.style.display = 'block';
          }
        }
      });
    });
    
    console.log('Google Sign-In initialized successfully');
  } catch (error) {
    console.error('Error initializing Google Sign-In:', error);
    disableGoogleButtons('Error initializing Google Sign-In');
  }
}

// Add a helper function to disable Google buttons with a message
function disableGoogleButtons(message) {
  const googleBtns = document.querySelectorAll('.btn-google');
  googleBtns.forEach(btn => {
    btn.style.opacity = '0.5';
    btn.title = message;
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Google Sign-In is currently unavailable. Please use email registration/login instead.');
    });
  });
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
  
  // Listen for Google API failures
  document.addEventListener('googleApiFailedToLoad', function() {
    console.log('Handling Google API load failure event');
    disableGoogleButtons('Google API failed to load');
  });
  
  // Try to initialize Google Sign-In
  if (typeof google !== 'undefined' && google.accounts) {
    console.log('Google API detected on page load');
    initializeGoogleSignIn();
  } else {
    console.log('Google API not detected, will try again when fully loaded');
    
    // Try again when window is fully loaded
    window.addEventListener('load', () => {
      console.log('Window loaded, checking for Google API');
      setTimeout(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          console.log('Google API available after window load');
          initializeGoogleSignIn();
        } else {
          console.error('Google API still not available');
          disableGoogleButtons('Google API not available');
        }
      }, 1500);
    });
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