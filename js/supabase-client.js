// Supabase Client Configuration
const SUPABASE_URL = 'https://fehmojbhdlpkwzabjrgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaG1vamJoZGxwa3d6YWJqcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzYxNjgsImV4cCI6MjA1NjgxMjE2OH0.gzR88Q9Gydf2uZtSjv1eatRGzYW5-N485IKvjz-jBCc';

// Create a Promise to track when Supabase is initialized
window.supabaseReady = new Promise((resolve) => {
    window.supabaseResolve = resolve;
});

// Load the Supabase client library
document.addEventListener('DOMContentLoaded', () => {
    // Load Supabase client dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        console.log('Supabase client loaded');
        // Create client with custom configuration
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        
        // Initialize session handling with improved debugging
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            if (event === 'SIGNED_IN') {
                console.log('User signed in successfully', session?.user);
                if (session?.provider) {
                    console.log('Signed in with provider:', session.provider);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
            } else if (event === 'USER_UPDATED') {
                console.log('User updated');
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('Auth token refreshed');
            } else if (event === 'ERROR') {
                console.error('Auth error occurred');
            }
        });
        
        // Check for OAuth response in URL
        const hasHashParams = window.location.hash && window.location.hash.length > 1;
        const hasErrorParams = window.location.search && window.location.search.includes('error=');
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (hasHashParams) {
            console.log('Detected OAuth response in URL hash');
            // Parse hash for error information
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const error = hashParams.get('error');
            const errorDescription = hashParams.get('error_description');
            
            if (error) {
                console.error('OAuth error detected in hash:', error, errorDescription);
                // Handle invalid_client error specifically
                if (error === 'invalid_client') {
                    alert('OAuth configuration error: The OAuth client was not found. Please contact support or check your Google OAuth configuration in Supabase dashboard.');
                    console.error('This usually means the Google OAuth client is not properly configured in Supabase or Google Cloud Console.');
                }
            }
        } else if (hasErrorParams) {
            console.log('Detected OAuth error in URL query parameters');
            // Parse query params for error information
            const queryParams = new URLSearchParams(window.location.search);
            const error = queryParams.get('error');
            const errorCode = queryParams.get('error_code');
            const errorDescription = queryParams.get('error_description');
            
            if (error) {
                console.error('OAuth error detected in query:', error, errorCode, errorDescription);
                
                // Handle bad_oauth_state error specifically
                if (errorCode === 'bad_oauth_state') {
                    console.error('OAuth state mismatch detected. This may happen if you use multiple browser tabs or cookies are blocked.');
                    
                    // For localhost development, attempt recovery by checking if user is actually logged in
                    if (isLocalhost) {
                        console.log('Localhost environment detected. Attempting auth recovery...');
                        // We'll check session status after initialization completes
                        setTimeout(async () => {
                            try {
                                const user = await checkUser();
                                if (user) {
                                    console.log('User is authenticated despite state error. Redirecting to dashboard...');
                                    window.location.href = window.location.origin + '/pages/dashboard.html';
                                    return;
                                }
                            } catch (e) {
                                console.error('Auth recovery failed:', e);
                            }
                            
                            // Only show alert if recovery failed
                            alert('Authentication error: Session state mismatch. Please try again in a new browser tab.');
                            window.location.href = window.location.origin + '/login.html';
                        }, 1500);
                    } else {
                        // Standard behavior for production
                        alert('Authentication error: Session state mismatch. Please try again in a new browser tab, or clear your cookies and try again.');
                        setTimeout(() => {
                            window.location.href = window.location.origin + '/login.html';
                        }, 2000);
                    }
                }
            }
        }
        
        // Resolve the promise to signal Supabase is ready
        window.supabaseResolve();
    };
    document.head.appendChild(script);
});

// Check if user is already logged in
async function checkUser() {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return null;
        }
        
        const { data, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('Error checking session:', error);
            return null;
        }
        
        if (!data.session) {
            console.log('No active session found');
            return null;
        }
        
        return data.session.user;
    } catch (err) {
        console.error('Error in checkUser:', err);
        return null;
    }
}

// Redirect to dashboard if logged in, or to login page if not logged in
async function redirectBasedOnAuth(requireAuth = true) {
    const user = await checkUser();
    
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('sign-up.html');
    const isDashboardPage = currentPath.includes('dashboard.html');
    
    if (user && isAuthPage) {
        // User is logged in but on auth page, redirect to dashboard
        window.location.href = './pages/dashboard.html';
    } else if (!user && requireAuth && !isAuthPage) {
        // User is not logged in but trying to access protected page
        window.location.href = '../login.html';
    }
}