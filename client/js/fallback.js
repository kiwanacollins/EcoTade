/**
 * Forexprox Fallback Handler
 * This script provides fallback functionality when external services are unavailable
 */

// Track available authentication methods
const authMethods = {
  email: true,
  google: false,
  facebook: false
};

// Check for Google API availability
function checkGoogleApiAvailability() {
  return typeof google !== 'undefined' && google.accounts;
}

// Update authentication method availability
function updateAuthMethodsAvailability() {
  authMethods.google = checkGoogleApiAvailability();
  
  // Log available methods
  console.log('Available authentication methods:', 
    Object.keys(authMethods).filter(method => authMethods[method]).join(', '));
  
  // Update UI to reflect available methods
  updateAuthUI();
}

// Update authentication UI based on available methods
function updateAuthUI() {
  const googleButtons = document.querySelectorAll('.btn-google');
  
  // Handle Google buttons
  if (!authMethods.google) {
    googleButtons.forEach(btn => {
      btn.style.opacity = '0.5';
      btn.classList.add('disabled');
      btn.title = "Google Sign-In unavailable";
      
      // Replace original click handler
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Mobile-friendly alert
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Show error message in the form instead of alert for better mobile experience
          const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
          if (errorElem) {
            errorElem.textContent = 'Google Sign-In is currently unavailable on this mobile device. Please use email login instead.';
            errorElem.style.display = 'block';
          } else {
            alert('Google Sign-In is currently unavailable. Please use email login instead.');
          }
        } else {
          alert('Google Sign-In is currently unavailable. Please use email registration/login instead.');
        }
      });
    });
    
    // Add notice for users
    const authContainers = document.querySelectorAll('.social-login');
    authContainers.forEach(container => {
      if (!container.querySelector('.auth-notice')) {
        const notice = document.createElement('p');
        notice.className = 'auth-notice';
        notice.textContent = 'Some sign-in methods are currently unavailable.';
        notice.style.color = '#ff6b6b';
        notice.style.fontSize = '0.8rem';
        notice.style.marginTop = '10px';
        container.appendChild(notice);
      }
    });
  } else {
    // Google is available, ensure buttons are enabled
    googleButtons.forEach(btn => {
      btn.style.opacity = '1';
      btn.classList.remove('disabled');
      btn.title = "Sign in with Google";
    });
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check API availability on page load
  updateAuthMethodsAvailability();
  
  // Listen for Google API failures
  document.addEventListener('googleApiFailedToLoad', function() {
    console.log('Fallback handler: Google API failed to load');
    authMethods.google = false;
    updateAuthUI();
    
    // Add specific mobile handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const errorElem = document.getElementById('signup-error') || document.getElementById('login-error');
      if (errorElem) {
        errorElem.textContent = 'Google Sign-In is not available on this mobile browser. Please use email login instead.';
        errorElem.style.display = 'block';
      }
      
      // Make email fields more prominent
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.placeholder = "Enter your email to sign in";
      }
    }
  });
});

// Check again when window is fully loaded
window.addEventListener('load', function() {
  // Give external scripts time to load
  setTimeout(updateAuthMethodsAvailability, 1000);
  
  // Extra time for mobile devices which may be slower to load
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    setTimeout(updateAuthMethodsAvailability, 3000);
  }
});
