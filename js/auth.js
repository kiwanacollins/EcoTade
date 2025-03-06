// Authentication functions for EcoTrade

// Register a new user
async function signUp(email, password, fullName) {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return { error: 'Supabase client not initialized' };
        }

        // First, sign up the user with Supabase Auth
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (authError) {
            console.error('Error signing up:', authError);
            return { error: authError };
        }

        // Redirect to dashboard after successful signup
        window.location.href = './pages/dashboard.html';
        
        return { data: authData, error: null };
    } catch (err) {
        console.error('Unexpected error during signup:', err);
        return { error: err };
    }
}

// Log in an existing user
async function signIn(email, password) {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return { error: 'Supabase client not initialized' };
        }

        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Error signing in:', error);
            return { error };
        }

        // Redirect to dashboard after successful login
        window.location.href = './pages/dashboard.html';
        
        return { data, error: null };
    } catch (err) {
        console.error('Unexpected error during signin:', err);
        return { error: err };
    }
}

// Sign out the current user
async function signOut() {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return { error: 'Supabase client not initialized' };
        }

        const { error } = await window.supabase.auth.signOut();
        
        if (error) {
            console.error('Error signing out:', error);
            return { error };
        }

        // Redirect to login page after sign out
        window.location.href = '../login.html';
        
        return { error: null };
    } catch (err) {
        console.error('Unexpected error during signout:', err);
        return { error: err };
    }
}

// Sign in with social providers (Google)
async function signInWithGoogle() {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return { error: 'Supabase client not initialized' };
        }

        // Get the current URL to help with redirection
        const origin = window.location.origin;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Use different redirect strategy for localhost vs production
        let redirectTo;
        
        if (isLocalhost) {
            // For localhost, use relative paths which are more reliable
            redirectTo = '/pages/dashboard.html';
            console.log('Localhost environment detected. Using relative redirect path:', redirectTo);
        } else {
            // For production, use absolute URL
            redirectTo = `${origin}/pages/dashboard.html`;
        }
        
        console.log('Starting Google OAuth flow with redirect to:', redirectTo);
        
        try {
            const { data, error } = await window.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    skipBrowserRedirect: false,
                    queryParams: {
                        // Request offline access - important for Google OAuth
                        access_type: 'offline',
                        // Force consent screen to ensure refresh token
                        prompt: 'consent'
                        // Remove custom state parameter - let Supabase handle it
                    }
                }
            });

            if (error) {
                console.error('Error signing in with Google:', error);
                return { error };
            }

            return { data, error: null };
        } catch (oauthError) {
            console.error('OAuth error:', oauthError);
            
            // Check for specific configuration errors
            if (oauthError.message && oauthError.message.includes('invalid_client')) {
                alert('Google OAuth Configuration Error: Please make sure you have correctly set up Google OAuth in both Supabase and Google Cloud Console.');
                console.error('Google OAuth Configuration Instructions:',
                    '\n1. In Google Cloud Console:',
                    '\n   - For "Authorized JavaScript origins": https://fehmojbhdlpkwzabjrgq.supabase.co',
                    '\n   - For "Authorized redirect URIs": https://fehmojbhdlpkwzabjrgq.supabase.co/auth/v1/callback');
                
                if (isLocalhost) {
                    console.error('For localhost development, also add these URLs to Google Console:',
                        '\n   - Authorized JavaScript origins: http://localhost:3000',
                        '\n   - Authorized redirect URIs: http://localhost:3000/auth/callback');
                }
            }
            
            return { error: oauthError };
        }
    } catch (err) {
        console.error('Unexpected error during Google signin:', err);
        return { error: err };
    }
}

// Sign in with social providers (Facebook)
async function signInWithFacebook() {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return { error: 'Supabase client not initialized' };
        }

        // Get the current URL to help with redirection
        const origin = window.location.origin;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Use different redirect strategy for localhost vs production
        let redirectTo;
        
        if (isLocalhost) {
            // For localhost, use relative paths which are more reliable
            redirectTo = '/pages/dashboard.html';
        } else {
            // For production, use absolute URL
            redirectTo = `${origin}/pages/dashboard.html`;
        }
        
        try {
            const { data, error } = await window.supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo,
                    skipBrowserRedirect: false
                    // Remove custom state parameter - let Supabase handle it
                }
            });

            if (error) {
                console.error('Error signing in with Facebook:', error);
                return { error };
            }

            return { data, error: null };
        } catch (oauthError) {
            console.error('Facebook OAuth error:', oauthError);
            return { error: oauthError };
        }
    } catch (err) {
        console.error('Unexpected error during Facebook signin:', err);
        return { error: err };
    }
}

// Helper function to generate a unique state parameter
function generateStateParam() {
    // Create a random string for state
    const randomId = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().getTime().toString();
    const stateParam = `${randomId}_${timestamp}`;
    
    // Store the state in localStorage as a backup mechanism
    try {
        localStorage.setItem('oauth_state', stateParam);
    } catch (e) {
        console.warn('Could not store OAuth state in localStorage:', e);
    }
    
    return stateParam;
}

// Reset password
async function resetPassword(email) {
    try {
        // Wait for Supabase to be initialized
        await window.supabaseReady;
        
        if (!window.supabase) {
            console.error('Supabase client not loaded yet');
            return { error: 'Supabase client not initialized' };
        }

        const { data, error } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });

        if (error) {
            console.error('Error resetting password:', error);
            return { error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('Unexpected error during password reset:', err);
        return { error: err };
    }
}