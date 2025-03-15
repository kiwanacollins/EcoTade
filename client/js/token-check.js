/**
 * Immediate Token Validation
 * Runs synchronously before any other scripts to ensure authentication
 */

(function() {
    // Check if we have a token in any storage mechanism
    function checkAuthentication() {
        // Try localStorage first
        const localToken = localStorage.getItem('token');
        
        // Then sessionStorage
        const sessionToken = sessionStorage.getItem('token');
        
        // Check cookie
        const cookieToken = getTokenFromCookie();
        
        // If token exists in any storage, consider user authenticated
        const isAuthenticated = !!(localToken || sessionToken || cookieToken);
        
        // Validate token and storage state
        if (isAuthenticated) {
            console.log('Authentication token found, user is authenticated');
            
            // Ensure token is stored in localStorage which is our main storage
            if (!localToken && (sessionToken || cookieToken)) {
                localStorage.setItem('token', sessionToken || cookieToken);
            }
            
            // Set the authentication flag
            localStorage.setItem('isAuthenticated', 'true');
            
            // If on login page, redirect to dashboard
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.endsWith('login') || 
                window.location.pathname.includes('sign-up.html')) {
                window.location.href = './dashboard.html';
            }
        } else {
            // No valid token found
            if (isProtectedPage()) {
                // If on a protected page, redirect to login
                window.location.href = './login.html';
            }
        }
    }
    
    // Helper function to get token from cookie
    function getTokenFromCookie() {
        const cookieValue = document.cookie
            .split('; ')
            .find(cookie => cookie.startsWith('token='));
            
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
        return null;
    }
    
    // Determine if current page is a protected page that requires authentication
    function isProtectedPage() {
        const protectedPages = [
            'dashboard.html', 
            'dashboard', 
            'account.html', 
            'settings.html'
        ];
        
        const path = window.location.pathname;
        return protectedPages.some(page => path.includes(page));
    }
    
    // Run immediately
    checkAuthentication();
})();
