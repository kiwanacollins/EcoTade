document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registration-form');
    const fullNameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    const passwordToggle = document.getElementById('password-toggle');
    const strengthIndicator = document.getElementById('strength-indicator');
    const strengthText = document.getElementById('strength-text');
    
    // Error message elements
    const fullNameError = document.getElementById('fullname-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');
    const termsError = document.getElementById('terms-error');
    
    // Toggle password visibility - improved implementation with null check
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
            e.stopPropagation(); // Stop event from propagating
            
            // Toggle between password and text type
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            if (type === 'password') {
                passwordToggle.classList.remove('fa-eye-slash');
                passwordToggle.classList.add('fa-eye');
            } else {
                passwordToggle.classList.remove('fa-eye');
                passwordToggle.classList.add('fa-eye-slash');
            }
        });
    }
    
    // Also fix the confirm password toggle if needed
    // Only add confirm password toggle if the confirm password input exists
    if (confirmPasswordInput) {
        const confirmPasswordToggle = document.createElement('i');
        confirmPasswordToggle.className = 'fas fa-eye password-toggle';
        confirmPasswordToggle.id = 'confirm-password-toggle';
        
        // Only append if it doesn't already exist and the parent exists
        if (!document.getElementById('confirm-password-toggle') && confirmPasswordInput.parentNode) {
            confirmPasswordInput.parentNode.appendChild(confirmPasswordToggle);
            
            confirmPasswordToggle.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent any default behavior
                e.stopPropagation(); // Stop event from propagating
                
                const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPasswordInput.setAttribute('type', type);
                
                // Toggle eye icon
                if (type === 'password') {
                    confirmPasswordToggle.classList.remove('fa-eye-slash');
                    confirmPasswordToggle.classList.add('fa-eye');
                } else {
                    confirmPasswordToggle.classList.remove('fa-eye');
                    confirmPasswordToggle.classList.add('fa-eye-slash');
                }
            });
        }
    }
    
    // Ensure inputs receive focus properly
    document.querySelectorAll('.input-container input').forEach(input => {
        if (input) {
            input.addEventListener('click', function(e) {
                // Explicitly focus the input when clicked
                this.focus();
                e.stopPropagation();
            });
        }
    });
    
    // Real-time validation as user types - add null checks
    if (fullNameInput) {
        fullNameInput.addEventListener('input', validateFullName);
    }
    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    }
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', validateTerms);
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate all fields
            const isFullNameValid = fullNameInput ? validateFullName() : true;
            const isEmailValid = emailInput ? validateEmail() : true;
            const isPasswordValid = passwordInput ? validatePassword() : true;
            const isConfirmPasswordValid = confirmPasswordInput ? validateConfirmPassword() : true;
            const isTermsAccepted = termsCheckbox ? validateTerms() : true;
            
            // If all validations pass, submit the form
            if (isFullNameValid && isEmailValid && isPasswordValid && 
                isConfirmPasswordValid && isTermsAccepted) {
                
                // Here you would typically send the form data to your server
                alert('Registration successful! Welcome to EcoTrade.');
                form.reset();
            }
        });
    }
    
    // Validation functions
    function validateFullName() {
        if (!fullNameInput || !fullNameError) return true;
        
        const fullName = fullNameInput.value.trim();
        const parentElement = fullNameInput.closest('.input-container');
        
        if (fullName === '') {
            showError(fullNameError, 'Please enter your full name');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            return false;
        } else if (fullName.length < 3) {
            showError(fullNameError, 'Name should be at least 3 characters long');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            return false;
        } else {
            clearError(fullNameError);
            if (parentElement) {
                parentElement.classList.remove('invalid');
                parentElement.classList.add('valid');
            }
            return true;
        }
    }
    
    function validateEmail() {
        if (!emailInput || !emailError) return true;
        
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const parentElement = emailInput.closest('.input-container');
        
        if (email === '') {
            showError(emailError, 'Please enter your email address');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            return false;
        } else if (!emailRegex.test(email)) {
            showError(emailError, 'Please enter a valid email address');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            return false;
        } else {
            clearError(emailError);
            if (parentElement) {
                parentElement.classList.remove('invalid');
                parentElement.classList.add('valid');
            }
            return true;
        }
    }
    
    function validatePassword() {
        if (!passwordInput || !passwordError) return true;
        
        const password = passwordInput.value;
        const parentElement = passwordInput.closest('.input-container');
        
        if (password === '') {
            showError(passwordError, 'Please enter a password');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            updatePasswordStrength(0);
            return false;
        } else {
            clearError(passwordError);
            
            // Password strength calculation
            let strength = 0;
            
            // Length check
            if (password.length >= 8) strength += 25;
            
            // Character checks
            if (/[A-Z]/.test(password)) strength += 25; // Uppercase
            if (/[0-9]/.test(password)) strength += 25; // Numbers
            if (/[^A-Za-z0-9]/.test(password)) strength += 25; // Special characters
            
            updatePasswordStrength(strength);
            
            if (strength < 50) {
                showError(passwordError, 'Password is too weak');
                if (parentElement) {
                    parentElement.classList.add('invalid');
                    parentElement.classList.remove('valid');
                }
                return false;
            } else {
                if (parentElement) {
                    parentElement.classList.remove('invalid');
                    parentElement.classList.add('valid');
                }
                return true;
            }
        }
    }
    
    function updatePasswordStrength(strength) {
        const strengthIndicator = document.getElementById('strength-indicator');
        const strengthText = document.getElementById('strength-text');
        
        if (!strengthIndicator || !strengthText) return;
        
        // Update strength indicator
        strengthIndicator.style.width = strength + '%';
        
        if (strength === 0) {
            strengthIndicator.className = 'strength-indicator';
            strengthText.textContent = 'Password strength';
        } else if (strength <= 50) {
            strengthIndicator.className = 'strength-indicator strength-weak';
            strengthText.textContent = 'Weak';
        } else if (strength <= 75) {
            strengthIndicator.className = 'strength-indicator strength-medium';
            strengthText.textContent = 'Medium';
        } else {
            strengthIndicator.className = 'strength-indicator strength-strong';
            strengthText.textContent = 'Strong';
        }
    }
    
    function validateConfirmPassword() {
        if (!confirmPasswordInput || !passwordInput || !confirmPasswordError) return true;
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const parentElement = confirmPasswordInput.closest('.input-container');
        
        if (confirmPassword === '') {
            showError(confirmPasswordError, 'Please confirm your password');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            return false;
        } else if (confirmPassword !== password) {
            showError(confirmPasswordError, 'Passwords do not match');
            if (parentElement) {
                parentElement.classList.add('invalid');
                parentElement.classList.remove('valid');
            }
            return false;
        } else {
            clearError(confirmPasswordError);
            if (parentElement) {
                parentElement.classList.remove('invalid');
                parentElement.classList.add('valid');
            }
            return true;
        }
    }
    
    function validateTerms() {
        if (!termsCheckbox || !termsError) return true;
        
        if (!termsCheckbox.checked) {
            showError(termsError, 'You must accept the terms & conditions');
            return false;
        } else {
            clearError(termsError);
            return true;
        }
    }
});

// Form validation functions for EcoTrade

document.addEventListener('DOMContentLoaded', () => {
    // Initialize form validation
    initializeFormValidation();
});

// Initialize form validation for all forms
function initializeFormValidation() {
    // Add validation to login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        setupLoginFormValidation(loginForm);
    }

    // Add validation to signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        setupSignupFormValidation(signupForm);
    }

    // Add validation to other forms as needed
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        setupContactFormValidation(contactForm);
    }

    // Setup password reset form
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        setupPasswordResetValidation(resetForm);
    }
}

// Add error message to form input
function showError(input, message) {
    // Safety check - ensure input is not null
    if (!input) {
        console.error('Cannot show error: Input element is null');
        return;
    }

    // Find the form-group container
    const formGroup = input.parentNode;
    if (!formGroup) {
        console.error('Cannot show error: Parent node of input is null');
        return;
    }

    // Remove any existing error message first
    removeError(input);

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add error class to form group
    formGroup.classList.add('has-error');
    
    // Add error message after the input
    formGroup.appendChild(errorDiv);
}

// Remove error message
function removeError(input) {
    // Safety check - ensure input is not null
    if (!input) {
        console.error('Cannot remove error: Input element is null');
        return;
    }

    // Find the form-group container
    const formGroup = input.parentNode;
    if (!formGroup) {
        console.error('Cannot remove error: Parent node of input is null');
        return;
    }

    // Remove error class
    formGroup.classList.remove('has-error');
    
    // Find and remove any existing error message
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        formGroup.removeChild(errorMessage);
    }
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Validate password strength
function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

// Setup login form validation
function setupLoginFormValidation(form) {
    if (!form) return;
    
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    
    form.addEventListener('submit', function(event) {
        let isValid = true;
        
        // Reset previous errors
        if (emailInput) removeError(emailInput);
        if (passwordInput) removeError(passwordInput);
        
        // Validate email
        if (emailInput && !emailInput.value.trim()) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (emailInput && !validateEmail(emailInput.value.trim())) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        }
        
        // Validate password
        if (passwordInput && !passwordInput.value.trim()) {
            showError(passwordInput, 'Password is required');
            isValid = false;
        }
        
        if (!isValid) {
            event.preventDefault();
        }
    });
}

// Setup signup form validation
function setupSignupFormValidation(form) {
    if (!form) return;
    
    const nameInput = form.querySelector('input[name="fullName"]');
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
    
    form.addEventListener('submit', function(event) {
        let isValid = true;
        
        // Reset previous errors
        if (nameInput) removeError(nameInput);
        if (emailInput) removeError(emailInput);
        if (passwordInput) removeError(passwordInput);
        if (confirmPasswordInput) removeError(confirmPasswordInput);
        
        // Validate name
        if (nameInput && !nameInput.value.trim()) {
            showError(nameInput, 'Full name is required');
            isValid = false;
        }
        
        // Validate email
        if (emailInput && !emailInput.value.trim()) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (emailInput && !validateEmail(emailInput.value.trim())) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        }
        
        // Validate password
        if (passwordInput && !passwordInput.value.trim()) {
            showError(passwordInput, 'Password is required');
            isValid = false;
        } else if (passwordInput && !validatePassword(passwordInput.value)) {
            showError(passwordInput, 'Password must be at least 8 characters with uppercase, lowercase, and numbers');
            isValid = false;
        }
        
        // Validate confirm password
        if (confirmPasswordInput && !confirmPasswordInput.value.trim()) {
            showError(confirmPasswordInput, 'Please confirm your password');
            isValid = false;
        } else if (confirmPasswordInput && passwordInput && confirmPasswordInput.value !== passwordInput.value) {
            showError(confirmPasswordInput, 'Passwords do not match');
            isValid = false;
        }
        
        if (!isValid) {
            event.preventDefault();
        }
    });
}

// Setup contact form validation
function setupContactFormValidation(form) {
    // Similar pattern to other form validations
    // Implementation depends on form fields
}

// Setup password reset validation
function setupPasswordResetValidation(form) {
    // Similar pattern to other form validations
    // Implementation depends on form fields
}
