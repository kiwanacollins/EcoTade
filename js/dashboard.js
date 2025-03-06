// Dashboard functionality

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase client to load
    setTimeout(async () => {
        try {
            // Check if user is authenticated
            await redirectBasedOnAuth(true); // This will redirect to login if not authenticated
            
            // Get the current user
            const user = await checkUser();
            
            if (user) {
                // Update welcome message with user's name
                const welcomeHeader = document.querySelector('.dashboard-container h1');
                
                if (welcomeHeader) {
                    // If user has a full name in metadata, use it; otherwise use email
                    const fullName = user.user_metadata?.full_name || 'there';
                    welcomeHeader.textContent = `Welcome, ${fullName}!`;
                }
                
                // Set up the sign-out button if it exists
                const signOutBtn = document.getElementById('sign-out-btn');
                if (signOutBtn) {
                    signOutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await signOut();
                    });
                }
                
                // Load user profile data from database if needed
                loadUserProfile(user.id);
            }
        } catch (err) {
            console.error('Dashboard initialization error:', err);
        }
    }, 1000); // Give time for Supabase client to load
});

// Load additional user data from database
async function loadUserProfile(userId) {
    if (!window.supabase) {
        console.error('Supabase client not loaded yet');
        return null;
    }
    
    try {
        // Fetch additional user data from profiles table
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" error, which we can handle by creating a profile
            console.error('Error fetching user profile:', error);
            return null;
        }
        
        if (!data) {
            // User profile doesn't exist yet, you can create one
            console.log('Creating user profile');
            // Create profile logic goes here
        } else {
            // User profile exists, you can use the data to populate the dashboard
            console.log('User profile loaded:', data);
            // Update UI with user data
        }
        
        return data;
    } catch (err) {
        console.error('Error in loadUserProfile:', err);
        return null;
    }
}