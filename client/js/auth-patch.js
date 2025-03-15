/**
 * Authentication Patch Script
 * Provides fixes for common authentication issues
 */

// Fix broken tokens or authentication states
function fixAuthenticationState() {
    // Check if a token exists but isAuthenticated flag is missing
    const token = localStorage.getItem('token');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (token && !isAuthenticated) {
        console.log('Token exists but authenticated flag missing - fixing');
        localStorage.setItem('isAuthenticated', 'true');
    }
    
    // Check if a token exists in sessionStorage but not in localStorage
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken && !token) {
        console.log('Token exists in sessionStorage but not localStorage - fixing');
        localStorage.setItem('token', sessionToken);
        localStorage.setItem('isAuthenticated', 'true');
    }
    
    // Check for token in cookies
    const tokenCookie = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('token='));
        
    if (tokenCookie) {
        const cookieToken = tokenCookie.split('=')[1];
        if (cookieToken && !token) {
            console.log('Token exists in cookies but not localStorage - fixing');
            localStorage.setItem('token', cookieToken);
            localStorage.setItem('isAuthenticated', 'true');
        }
    }
}

// Fix authorization headers in fetch requests
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // If options don't include headers, add them
    if (!options.headers) {
        options.headers = {};
    }
    
    // If Authorization header is missing but we have a token, add it
    if (!options.headers.Authorization && !options.headers.authorization) {
        const token = localStorage.getItem('token');
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    // Always include credentials unless specifically set otherwise
    if (options.credentials === undefined) {
        options.credentials = 'include';
    }
    
    // Log request details in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`Fetch request to ${url}`, { headers: options.headers, credentials: options.credentials });
    }
    
    return originalFetch(url, options);
};

// Run fixes immediately
fixAuthenticationState();

// Also run fixes when page becomes fully interactive
document.addEventListener('DOMContentLoaded', fixAuthenticationState);
