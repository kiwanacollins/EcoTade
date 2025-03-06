document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is authenticated
    try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            window.location.href = './login.html';
            return;
        }
        
        // Try to fetch user data
        console.log('Fetching dashboard data...');
        const userData = await fetchDashboardData();
        if (!userData) {
            console.error('Failed to fetch dashboard data');
            window.location.href = './login.html';
            return;
        }
        
        console.log('Dashboard data loaded successfully');
        // Load data into dashboard
        updateDashboardUI(userData);
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        // Redirect to login if unauthorized
        window.location.href = './login.html';
    }
});

// Fetch dashboard data from API
async function fetchDashboardData() {
    try {
        console.log('Making API request to /auth/dashboard');
        const response = await auth.getDashboard();
        console.log('Dashboard API response:', response);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Check if token might be invalid/expired
        if (error.message && (
            error.message.includes('unauthorized') || 
            error.message.includes('not authorized') ||
            error.message.includes('invalid token')
        )) {
            // Clear invalid token
            localStorage.removeItem('token');
        }
        return null;
    }
}

// Update the dashboard UI with user data
function updateDashboardUI(dashboardData) {
    // Update user name and role
    const userName = document.querySelector('.user-name');
    const userFullName = document.querySelector('.user-fullname');
    const userRole = document.querySelector('.user-role');
    
    if (userName) userName.textContent = dashboardData.user.name;
    if (userFullName) userFullName.textContent = dashboardData.user.name;
    if (userRole) userRole.textContent = dashboardData.user.role;
    
    // Update account summary
    const balanceAmount = document.querySelector('.balance-amount');
    const profitAmount = document.querySelector('.profit-amount');
    const activeTrades = document.querySelector('.active-trades');
    
    if (balanceAmount) balanceAmount.textContent = `$${dashboardData.accountSummary.totalBalance.toFixed(2)}`;
    if (profitAmount) profitAmount.textContent = `$${dashboardData.accountSummary.profit.toFixed(2)}`;
    if (activeTrades) activeTrades.textContent = dashboardData.accountSummary.activeTrades;
    
    // Populate settings form if on settings panel
    const settingsFullname = document.getElementById('settings-fullname');
    const settingsEmail = document.getElementById('settings-email');
    
    if (settingsFullname) settingsFullname.value = dashboardData.user.name;
    if (settingsEmail) settingsEmail.value = dashboardData.user.email;
}

// Set up all necessary event listeners
function setupEventListeners() {
    // Menu toggle for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation between panels
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get panel to show
            const panelId = this.getAttribute('data-panel');
            switchPanel(panelId);
        });
    });
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await logout();
        });
    }
    
    // Account settings form
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Implementation for updating account settings would go here
            alert('Account settings updated!');
        });
    }
    
    // Password change form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Implementation for changing password would go here
            alert('Password updated successfully!');
            passwordForm.reset();
        });
    }
}

// Switch between different panels
function switchPanel(panelId) {
    // Hide all panels
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    // Show the selected panel
    const selectedPanel = document.getElementById(`${panelId}-panel`);
    if (selectedPanel) {
        selectedPanel.classList.add('active');
        
        // Update the header title
        const headerTitle = document.querySelector('.header-left h2');
        if (headerTitle) {
            headerTitle.textContent = panelId.charAt(0).toUpperCase() + panelId.slice(1);
        }
    }
}

// Handle outside clicks to close sidebar on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && sidebar.classList.contains('active')) {
        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
            sidebar.classList.remove('active');
        }
    }
});
