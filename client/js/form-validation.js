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
    
    // Toggle password visibility with touch support
    if (passwordToggle && passwordInput) {
        ['click', 'touchend'].forEach(eventType => {
            passwordToggle.addEventListener(eventType, function(e) {
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
        });
    }
    
    // Also fix the confirm password toggle with touch support
    if (confirmPasswordInput) {
        const confirmPasswordToggle = document.createElement('i');
        confirmPasswordToggle.className = 'fas fa-eye password-toggle';
        confirmPasswordToggle.id = 'confirm-password-toggle';
        
        // Only append if it doesn't already exist and the parent exists
        if (!document.getElementById('confirm-password-toggle') && confirmPasswordInput.parentNode) {
            confirmPasswordInput.parentNode.appendChild(confirmPasswordToggle);
            
            ['click', 'touchend'].forEach(eventType => {
                confirmPasswordToggle.addEventListener(eventType, function(e) {
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
            });
        }
    }
    
    // Ensure inputs receive focus properly on touch devices
    document.querySelectorAll('.input-container input').forEach(input => {
        if (input) {
            ['click', 'touchstart'].forEach(eventType => {
                input.addEventListener(eventType, function(e) {
                    // Fix for iOS focus issues
                    setTimeout(() => {
                        this.focus();
                    }, 0);
                    e.stopPropagation();
                });
            });
            
            // Add explicit blur handler for better mobile behavior
            input.addEventListener('blur', function() {
                // Validate on blur for better mobile experience
                if (this.id === 'fullname' && validateFullName) validateFullName();
                if (this.id === 'email' && validateEmail) validateEmail();
                if (this.id === 'password' && validatePassword) validatePassword();
                if (this.id === 'confirm-password' && validateConfirmPassword) validateConfirmPassword();
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
                // alert('Registration successful! Welcome to Forexprox.');
                form.reset();
            }
        });
    }
    
    // Validation functions
    function validateFullName() {
        if (!fullNameInput || !fullNameError) return true;
        
        const fullName = fullNameInput.value.trim();
        const parentElement = fullNameInput.closest('.input-container');
        
        console.log("Validating name:", fullName, "Length:", fullName.length); // Debug log
        
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
    
    // Function to clear error messages - ensure it's properly defined
    function clearError(errorElement) {
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    // Function to show error messages - ensure it's properly defined
    function showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
});

// Form validation functions for Forexprox

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

document.addEventListener('DOMContentLoaded', function() {
    // Setup input fields with validation
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            // Skip checkboxes for inline error messages
            if (input.type === 'checkbox') return;
            
            const container = input.parentElement;
            const errorMsgId = input.id + '-error';
            const errorElement = document.getElementById(errorMsgId);
            
            if (errorElement) {
                // Create an inline error element
                const inlineError = document.createElement('span');
                inlineError.className = 'inline-error error-message';
                inlineError.id = 'inline-' + errorMsgId;
                container.appendChild(inlineError);
                
                // Add validation events
                input.addEventListener('input', function() {
                    validateInput(this, inlineError, container);
                });
                
                input.addEventListener('blur', function() {
                    validateInput(this, inlineError, container);
                });
            }
        });
        
        // Handle form submission
        form.addEventListener('submit', function(event) {
            let isValid = true;
            
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    // Handle checkbox validation separately
                    const errorElement = document.getElementById(input.id + '-error');
                    if (input.required && !input.checked) {
                        errorElement.textContent = 'You must agree to continue';
                        errorElement.style.display = 'block';
                        isValid = false;
                    } else {
                        errorElement.textContent = '';
                        errorElement.style.display = 'none';
                    }
                } else {
                    // Handle text inputs with inline validation
                    const container = input.parentElement;
                    const inlineError = container.querySelector('.inline-error');
                    if (inlineError && !validateInput(input, inlineError, container)) {
                        isValid = false;
                    }
                }
            });
            
            if (!isValid) {
                event.preventDefault();
            }
        });
    });
    
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    // Password strength indicator logic if present
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('strength-indicator');
    const strengthText = document.getElementById('strength-text');
    
    if (passwordInput && strengthIndicator && strengthText) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
    
    // Functions
    function validateInput(input, errorElement, container) {
        let isValid = true;
        let errorMessage = '';
        
        // Basic validation based on input type
        if (input.required && !input.value.trim()) {
            errorMessage = 'Required';
            isValid = false;
        } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
            errorMessage = 'Invalid email';
            isValid = false;
        } else if (input.id === 'password' && input.value && !isValidPassword(input.value)) {
            errorMessage = 'Too weak';
            isValid = false;
        } else if (input.id === 'confirm-password') {
            const passwordInput = document.getElementById('password');
            if (passwordInput && input.value !== passwordInput.value) {
                errorMessage = 'Passwords don\'t match';
                isValid = false;
            }
        }
        
        // Update error display
        if (isValid) {
            container.classList.remove('error');
            errorElement.textContent = '';
            if (input.value) container.classList.add('valid');
        } else {
            container.classList.add('error');
            container.classList.remove('valid');
            errorElement.textContent = errorMessage;
        }
        
        return isValid;
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function isValidPassword(password) {
        // Basic password validation - at least 6 chars
        return password.length >= 6;
    }
    
    function updatePasswordStrength(password) {
        if (!password) {
            strengthIndicator.style.width = '0';
            strengthIndicator.className = 'strength-indicator';
            strengthText.textContent = 'Password strength';
            return;
        }
        
        // Calculate password strength (simplified version)
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Update UI
        if (strength <= 2) {
            strengthIndicator.className = 'strength-indicator strength-weak';
            strengthText.textContent = 'Weak';
        } else if (strength <= 4) {
            strengthIndicator.className = 'strength-indicator strength-medium';
            strengthText.textContent = 'Medium';
        } else {
            strengthIndicator.className = 'strength-indicator strength-strong';
            strengthText.textContent = 'Strong';
        }
        
        strengthIndicator.style.width = ((strength / 5) * 100) + '%';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Setup validation for all forms
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input:not([type="checkbox"])');
        
        // Add inline error elements if they don't exist
        inputs.forEach(input => {
            const container = input.parentElement;
            const errorId = input.id + '-error';
            let errorElement = document.getElementById(errorId);
            
            // Create an inline error element inside the input container
            const inlineError = document.createElement('div');
            inlineError.className = 'error-message inline-error';
            inlineError.id = 'inline-' + errorId;
            container.appendChild(inlineError);
            
            // Add event listeners for validation
            input.addEventListener('input', function() {
                validateInput(this, inlineError, container);
            });
            
            input.addEventListener('blur', function() {
                validateInput(this, inlineError, container);
            });
        });
        
        // Handle checkbox validation separately
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const errorId = this.id + '-error';
                const errorElement = document.getElementById(errorId);
                
                if(this.required && !this.checked) {
                    errorElement.textContent = 'You must agree to continue';
                    errorElement.style.display = 'block';
                } else {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
            });
        });
        
        // Form submission validation
        form.addEventListener('submit', function(event) {
            let isValid = true;
            
            // Validate all text inputs
            inputs.forEach(input => {
                const container = input.parentElement;
                const errorId = 'inline-' + input.id + '-error';
                const inlineError = document.getElementById(errorId);
                
                if (!validateInput(input, inlineError, container)) {
                    isValid = false;
                }
            });
            
            // Validate checkboxes
            checkboxes.forEach(checkbox => {
                if (checkbox.required && !checkbox.checked) {
                    const errorId = checkbox.id + '-error';
                    const errorElement = document.getElementById(errorId);
                    errorElement.textContent = 'You must agree to continue';
                    errorElement.style.display = 'block';
                    isValid = false;
                }
            });
            
            if (!isValid) {
                event.preventDefault();
            }
        });
    });
    
    // Toggle password visibility
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });
    
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('strength-indicator');
    const strengthText = document.getElementById('strength-text');
    
    if (passwordInput && strengthIndicator && strengthText) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
    
    function validateInput(input, errorElement, container) {
        if (!errorElement) return true; // Skip if no error element found
        
        let isValid = true;
        let errorMessage = '';
        
        if (input.required && !input.value.trim()) {
            errorMessage = 'Required';
            isValid = false;
        } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
            errorMessage = 'Invalid email';
            isValid = false;
        } else if (input.id === 'password' && input.value && !isStrongPassword(input.value)) {
            errorMessage = 'Too weak';
            isValid = false;
        } else if (input.id === 'confirm-password') {
            const passwordInput = document.getElementById('password');
            if (passwordInput && input.value !== passwordInput.value) {
                errorMessage = 'Doesn\'t match';
                isValid = false;
            }
        }
        
        if (isValid) {
            container.classList.remove('error');
            errorElement.textContent = '';
            if (input.value.trim()) {
                container.classList.add('valid');
            } else {
                container.classList.remove('valid');
            }
        } else {
            container.classList.add('error');
            container.classList.remove('valid');
            errorElement.textContent = errorMessage;
        }
        
        return isValid;
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function isStrongPassword(password) {
        // Simple validation - at least 6 characters
        return password.length >= 6;
    }
    
    function updatePasswordStrength(password) {
        if (!strengthIndicator || !strengthText) return;
        
        if (!password) {
            strengthIndicator.style.width = '0';
            strengthIndicator.className = 'strength-indicator';
            strengthText.textContent = 'Password strength';
            return;
        }
        
        // Calculate password strength
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Update UI
        strengthIndicator.style.width = ((strength / 5) * 100) + '%';
        
        if (strength <= 2) {
            strengthIndicator.className = 'strength-indicator strength-weak';
            strengthText.textContent = 'Weak';
        } else if (strength <= 4) {
            strengthIndicator.className = 'strength-indicator strength-medium';
            strengthText.textContent = 'Medium';
        } else {
            strengthIndicator.className = 'strength-indicator strength-strong';
            strengthText.textContent = 'Strong';
        }
    }
});
