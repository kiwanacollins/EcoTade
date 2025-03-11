/**
 * Mobile-specific fixes for form handling and authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Detect if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Mobile device detected, applying mobile-specific fixes');
        
        // Add mobile class to body for CSS targeting
        document.body.classList.add('mobile-device');
        
        // Fix viewport issues on iOS
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Fix iOS focus issues
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                document.body.classList.add('has-focus');
            });
            
            input.addEventListener('blur', () => {
                document.body.classList.remove('has-focus');
            });
        });
        
        // Improve touch handling on buttons
        const allButtons = document.querySelectorAll('button, .btn, .btn-google, .btn-social');
        allButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
        
        // Detect Google Authentication issues specific to mobile
        window.addEventListener('load', () => {
            setTimeout(() => {
                // Check for Google API on mobile
                if (typeof google === 'undefined' || !google.accounts) {
                    console.error('Google API not available on mobile');
                    
                    // Show alternative login message
                    const errorContainers = document.querySelectorAll('.auth-error');
                    errorContainers.forEach(container => {
                        if (!container.textContent.includes('mobile browser')) {
                            container.textContent = 'Google Sign-In may not be available on this mobile browser. Please use email and password to log in.';
                            container.style.display = 'block';
                        }
                    });
                }
            }, 2000);
        });
    }
    
    // Check for iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        console.log('iOS device detected, applying iOS-specific fixes');
        
        // Add iOS class to body
        document.body.classList.add('ios-device');
        
        // Fix iOS zoom on input focus
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'checkbox' && input.type !== 'radio') {
                input.style.fontSize = '16px';
            }
        });
    }
});
