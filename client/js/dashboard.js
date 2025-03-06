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

    // Initialize charts after updating UI data
    initializeCharts(dashboardData);
    
    // Update activity feed
    updateActivityFeed(dashboardData.recentActivities || []);
    
    // Update transactions table
    updateTransactionsTable(dashboardData.transactions || []);
    
    // Update investments list
    updateInvestmentsList(dashboardData.investments || []);
}

// Set up all necessary event listeners
function setupEventListeners() {
    // Menu toggle for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            // Stop event propagation to prevent document click handler from firing
            e.stopPropagation();
            sidebar.classList.toggle('active');
            console.log('Menu toggle clicked, sidebar active:', sidebar.classList.contains('active'));
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

    // Deposit funds button
    const depositBtn = document.getElementById('deposit-btn');
    if (depositBtn) {
        depositBtn.addEventListener('click', function() {
            openDepositModal();
        });
    }
    
    // Quick Deposit button in overview panel
    const quickDepositBtn = document.getElementById('quick-deposit-btn');
    if (quickDepositBtn) {
        quickDepositBtn.addEventListener('click', function() {
            openDepositModal();
        });
    }
    
    // Modal close button
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeDepositModal);
    }
    
    // Cancel deposit button
    const cancelDeposit = document.getElementById('cancel-deposit');
    if (cancelDeposit) {
        cancelDeposit.addEventListener('click', closeDepositModal);
    }
    
    // Confirm deposit button
    const confirmDeposit = document.getElementById('confirm-deposit');
    if (confirmDeposit) {
        confirmDeposit.addEventListener('click', function() {
            processDeposit();
        });
    }
    
    // Payment method change
    const paymentMethod = document.getElementById('payment-method');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', function() {
            updatePaymentMethod(this.value);
        });
    }
}

// Open the deposit modal
function openDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.classList.add('active');
        // Reset input fields
        document.getElementById('modal-deposit-amount').value = '';
        document.getElementById('payment-method').value = 'credit-card';
        updatePaymentMethod('credit-card');
        
        // Add event listener to close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDepositModal();
            }
        });
    }
}

// Close the deposit modal
function closeDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Update the payment method section
function updatePaymentMethod(method) {
    // Hide all payment method details
    document.querySelectorAll('.payment-method-details').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show the selected method
    const selectedMethod = document.getElementById(`${method}-info`);
    if (selectedMethod) {
        selectedMethod.classList.remove('hidden');
    }
}

// Process deposit form
function processDeposit() {
    const amount = document.getElementById('modal-deposit-amount').value;
    const method = document.getElementById('payment-method').value;
    
    if (!amount || parseFloat(amount) < 10) {
        alert('Please enter a valid amount (minimum $10)');
        return;
    }
    
    console.log(`Processing deposit of $${amount} via ${method}`);
    
    // In a real app, this would send the payment details to a payment processor
    // For demonstration purposes, we'll simulate a successful deposit
    
    // Show loading state
    const confirmButton = document.getElementById('confirm-deposit');
    const originalText = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.textContent = 'Processing...';
    
    // Simulate API call with timeout
    setTimeout(() => {
        // Close modal and show success message
        closeDepositModal();
        alert(`Deposit of $${amount} successfully processed!`);
        
        // Reset button
        confirmButton.disabled = false;
        confirmButton.textContent = originalText;
        
        // Update balance in UI (this would normally come from API)
        const balanceAmount = document.querySelector('.balance-amount');
        if (balanceAmount) {
            const currentBalance = parseFloat(balanceAmount.textContent.replace('$', ''));
            const newBalance = currentBalance + parseFloat(amount);
            balanceAmount.textContent = `$${newBalance.toFixed(2)}`;
        }
        
        // Add to activity timeline
        const timeline = document.getElementById('activity-timeline');
        if (timeline) {
            const noActivity = timeline.querySelector('.no-activity');
            if (noActivity) {
                timeline.innerHTML = '';
            }
            
            const li = document.createElement('li');
            const now = new Date();
            li.innerHTML = `
                <span class="activity-time">${formatDateTime(now)}</span>
                <div class="activity-content">
                    <p>Deposited $${parseFloat(amount).toFixed(2)} via ${method.replace('-', ' ')}</p>
                </div>
            `;
            timeline.prepend(li);
        }
    }, 1500);
}

// Initialize all charts
function initializeCharts(data) {
    // Trading performance chart (line chart)
    const tradingCtx = document.getElementById('tradingPerformanceChart');
    if (tradingCtx) {
        const performanceData = data.tradingPerformance || mockPerformanceData();
        
        new Chart(tradingCtx, {
            type: 'line',
            data: {
                labels: performanceData.labels,
                datasets: [{
                    label: 'Account Balance',
                    data: performanceData.values,
                    borderColor: '#08c',
                    backgroundColor: 'rgba(8, 136, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Asset allocation chart (pie chart)
    const allocationCtx = document.getElementById('assetAllocationChart');
    if (allocationCtx) {
        const allocationData = data.assetAllocation || mockAllocationData();
        
        new Chart(allocationCtx, {
            type: 'doughnut',
            data: {
                labels: allocationData.labels,
                datasets: [{
                    data: allocationData.values,
                    backgroundColor: [
                        '#08c', '#f0cd6d', '#4CD964', '#ff9500', '#ff3b30'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    // Investment performance chart
    const investmentCtx = document.getElementById('investmentPerformanceChart');
    if (investmentCtx) {
        const investmentData = data.investmentPerformance || mockInvestmentData();
        
        new Chart(investmentCtx, {
            type: 'bar',
            data: {
                labels: investmentData.labels,
                datasets: [{
                    label: 'Return Rate',
                    data: investmentData.values,
                    backgroundColor: investmentData.values.map(
                        value => value >= 0 ? 'rgba(76, 217, 100, 0.7)' : 'rgba(255, 59, 48, 0.7)'
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Update the activity feed
function updateActivityFeed(activities) {
    const timeline = document.getElementById('activity-timeline');
    if (!timeline) return;
    
    if (!activities || activities.length === 0) {
        timeline.innerHTML = '<li class="no-activity">No recent activity to display</li>';
        return;
    }
    
    timeline.innerHTML = '';
    
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="activity-time">${formatDateTime(activity.timestamp)}</span>
            <div class="activity-content">
                <p>${activity.message}</p>
            </div>
        `;
        timeline.appendChild(li);
    });
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.querySelector('#transactions-history tbody');
    if (!tbody) return;
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data-message">No transactions to display</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    transactions.forEach(transaction => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td><span class="status-badge ${transaction.status.toLowerCase()}">${transaction.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Update investments list
function updateInvestmentsList(investments) {
    const list = document.querySelector('.investments-list');
    if (!list) return;
    
    if (!investments || investments.length === 0) {
        list.innerHTML = '<p class="no-data-message">No active investments yet</p>';
        return;
    }
    
    list.innerHTML = '';
    
    investments.forEach(investment => {
        const item = document.createElement('div');
        item.className = 'investment-item';
        item.innerHTML = `
            <div class="investment-header">
                <h4>${investment.name}</h4>
                <span class="investment-amount">${formatCurrency(investment.amount)}</span>
            </div>
            <div class="investment-details">
                <span>Started: ${formatDate(investment.startDate)}</span>
                <span>Return: ${investment.returnRate}%</span>
            </div>
            <div class="investment-progress">
                <div class="progress-bar" style="width: ${investment.progress}%"></div>
            </div>
        `;
        list.appendChild(item);
    });
}

// Filter transactions based on selection
function filterTransactions() {
    const type = document.getElementById('transaction-type').value;
    const date = document.getElementById('transaction-date').value;
    
    console.log(`Filtering transactions: type=${type}, date=${date}`);
    // Implementation would fetch filtered data from API or filter client-side
    
    // For now just show a message
    const tbody = document.querySelector('#transactions-history tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data-message">Filtering not implemented in this demo</td></tr>';
    }
}

// Initiate deposit process
function initiateDeposit(amount) {
    console.log(`Initiating deposit of $${amount}`);
    // In a real application, this would redirect to a payment gateway
    // For demo purposes, show a confirmation
    alert(`This would redirect to payment gateway for $${amount} deposit`);
}

// Helper function to format currency
function formatCurrency(value) {
    return `$${parseFloat(value).toFixed(2)}`;
}

// Helper function to format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
}

// Helper function to format date and time
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

// Mock data for charts if API doesn't provide it
function mockPerformanceData() {
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [5000, 5200, 5150, 5400, 5600, 6000]
    };
}

function mockAllocationData() {
    return {
        labels: ['Stocks', 'Crypto', 'Forex', 'Commodities', 'Bonds'],
        values: [45, 20, 15, 10, 10]
    };
}

function mockInvestmentData() {
    return {
        labels: ['Trader 1', 'Trader 2', 'Trader 3', 'Trader 4', 'Trader 5'],
        values: [12, -5, 8, 15, -3]
    };
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
