/**
 * Token Manager
 * Provides reliable token handling functions across the application
 */

const TokenManager = {
    // Get the auth token with fallbacks for different storage mechanisms
    getToken: function() {
        // Try localStorage first (main storage mechanism)
        let token = localStorage.getItem('token');
        
        // If not in localStorage, check sessionStorage as fallback
        if (!token) {
            token = sessionStorage.getItem('token');
            
            // If found in sessionStorage, sync to localStorage for future use
            if (token) {
                console.log('Token found in sessionStorage, syncing to localStorage');
                localStorage.setItem('token', token);
                localStorage.setItem('isAuthenticated', 'true');
            }
        }
        
        // Check for token in cookies as last resort
        if (!token) {
            token = this.getTokenFromCookie();
            
            // If found in cookie, sync to localStorage
            if (token) {
                console.log('Token found in cookies, syncing to localStorage');
                localStorage.setItem('token', token);
                localStorage.setItem('isAuthenticated', 'true');
            }
        }
        
        return token;
    },
    
    // Store token in multiple places for redundancy
    storeToken: function(token) {
        if (!token) return false;
        
        try {
            // Store in localStorage (primary)
            localStorage.setItem('token', token);
            localStorage.setItem('isAuthenticated', 'true');
            
            // Backup in sessionStorage
            sessionStorage.setItem('token', token);
            
            // Set as cookie with path=/ for cross-page availability
            this.setTokenCookie(token);
            
            return true;
        } catch (error) {
            console.error('Error storing token:', error);
            return false;
        }
    },
    
    // Set token as cookie
    setTokenCookie: function(token) {
        const expiryDays = 30;
        const date = new Date();
        date.setTime(date.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = `token=${token}; ${expires}; path=/; SameSite=Lax`;
    },
    
    // Get token from cookie
    getTokenFromCookie: function() {
        const cookieValue = document.cookie
            .split('; ')
            .find(cookie => cookie.startsWith('token='));
            
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
        return null;
    },
    
    // Clear token from all storage
    clearToken: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('token');
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    },
    
    // Verify if token exists and is (likely) valid
    isAuthenticated: function() {
        const token = this.getToken();
        return !!token;
    },
    
    // Refresh or extend token validity (for future implementation)
    refreshToken: function() {
        // To be implemented with refresh token logic
        return false;
    }
};

// Auto-initialize: try to restore token if it exists in any storage
document.addEventListener('DOMContentLoaded', function() {
    const token = TokenManager.getToken();
    if (token) {
        console.log('Token found in storage, syncing across storage mechanisms');
        TokenManager.storeToken(token);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TokenManager;
}
