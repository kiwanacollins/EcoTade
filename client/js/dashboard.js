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
    
    // Select Trader button in overview panel
    const selectTraderBtn = document.getElementById('select-trader-btn');
    if (selectTraderBtn) {
        selectTraderBtn.addEventListener('click', function() {
            switchPanel('traders');
            
            // Update navigation item active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-panel') === 'traders') {
                    item.classList.add('active');
                }
            });
        });
    }
    
    // Add event listeners for trader selection buttons
    document.querySelectorAll('.btn-select-trader').forEach(button => {
        button.addEventListener('click', function() {
            const traderId = this.getAttribute('data-trader-id');
            selectTrader(traderId);
        });
    });
}

// Open the deposit modal
function openDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.classList.add('active');
        
        // Reset input fields
        document.getElementById('modal-deposit-amount').value = '';
        const paymentMethodSelect = document.getElementById('payment-method');
        paymentMethodSelect.value = 'bitcoin'; // Default to bitcoin
        updatePaymentMethod('bitcoin');
        
        // Set focus on the amount input
        setTimeout(() => {
            document.getElementById('modal-deposit-amount').focus();
        }, 300);
        
        // Set up event listeners
        setupDepositModalListeners();
        
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

// Enhanced payment method handling
function updatePaymentMethod(method) {
    // Hide all payment method details
    document.querySelectorAll('.payment-method-details').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show the selected cryptocurrency method
    const selectedMethod = document.getElementById(`${method}-info`);
    if (selectedMethod) {
        selectedMethod.classList.remove('hidden');
        
        // Apply subtle entrance animation
        selectedMethod.style.opacity = '0';
        selectedMethod.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            selectedMethod.style.opacity = '1';
            selectedMethod.style.transform = 'translateY(0)';
        }, 50);
    }
    
    // Update the deposit amount input placeholder with the selected crypto
    const amountInput = document.getElementById('modal-deposit-amount');
    if (amountInput) {
        const cryptoName = document.querySelector(`option[value="${method}"]`).textContent.split('(')[0].trim();
        amountInput.placeholder = `Enter amount in USD (min $10) to convert to ${cryptoName}`;
    }
    
    // If amount is already entered, calculate and show approximate crypto amount
    if (amountInput && amountInput.value) {
        showCryptoEquivalent(amountInput.value, method);
    }
}

// Show crypto equivalent for entered USD amount
function showCryptoEquivalent(usdAmount, cryptoType) {
    // This would normally make an API call to get current exchange rates
    // For demo purposes, we'll use static conversion rates
    const rates = {
        bitcoin: 0.000034,  // 1 USD = 0.000034 BTC
        ethereum: 0.00058,  // 1 USD = 0.00058 ETH
        usdt: 1,            // 1 USD = 1 USDT
        sol: 0.16,          // 1 USD = 0.16 SOL
        bnb: 0.0033         // 1 USD = 0.0033 BNB
    };
    
    const symbols = {
        bitcoin: 'BTC',
        ethereum: 'ETH',
        usdt: 'USDT',
        sol: 'SOL',
        bnb: 'BNB'
    };
    
    if (!usdAmount || isNaN(parseFloat(usdAmount)) || parseFloat(usdAmount) <= 0) {
        return;
    }
    
    const cryptoAmount = parseFloat(usdAmount) * rates[cryptoType];
    const cryptoSymbol = symbols[cryptoType];
    
    // Find or create the crypto equivalent element
    let cryptoEquivalentEl = document.querySelector('.crypto-equivalent');
    if (!cryptoEquivalentEl) {
        cryptoEquivalentEl = document.createElement('p');
        cryptoEquivalentEl.className = 'form-hint crypto-equivalent';
        document.querySelector('.amount-input').appendChild(cryptoEquivalentEl);
    }
    
    cryptoEquivalentEl.innerHTML = `Approximately <strong>${cryptoAmount.toFixed(8)} ${cryptoSymbol}</strong> (based on current exchange rate)`;
}

// Add listeners for deposit amount field
document.addEventListener('DOMContentLoaded', function() {
    // Existing code...
    
    // Add input event listener for deposit amount
    const depositAmount = document.getElementById('modal-deposit-amount');
    if (depositAmount) {
        depositAmount.addEventListener('input', function() {
            const cryptoType = document.getElementById('payment-method').value;
            showCryptoEquivalent(this.value, cryptoType);
        });
    }
});

// Process deposit form with enhanced feedback
function processDeposit() {
    const amount = document.getElementById('modal-deposit-amount').value;
    const cryptoMethod = document.getElementById('payment-method').value;
    
    if (!amount || parseFloat(amount) < 10) {
        showNotification('error', 'Please enter a valid amount (minimum $10)');
        return;
    }
    
    console.log(`Processing deposit of $${amount} via ${cryptoMethod}`);
    
    // Show loading state
    const confirmButton = document.getElementById('confirm-deposit');
    const originalText = confirmButton.innerHTML;
    confirmButton.disabled = true;
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Simulate API call with timeout
    setTimeout(() => {
        // Instead of closing modal, show success state within modal
        const modalBody = document.querySelector('.modal-body');
        const modalFooter = document.querySelector('.modal-footer');
        
        // Store original content for later
        const originalBody = modalBody.innerHTML;
        const originalFooter = modalFooter.innerHTML;
        
        // Update modal with confirmation
        modalBody.innerHTML = `
            <div class="deposit-confirmation">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success-color); margin-bottom: 15px;"></i>
                <h5>Your deposit request has been received</h5>
                <p>Please send <strong>$${parseFloat(amount).toFixed(2)}</strong> worth of <strong>${cryptoMethod.toUpperCase()}</strong> to the provided wallet address.</p>
                <p>Your account will be credited after blockchain confirmation.</p>
                <a href="#" class="finish-later" id="finish-deposit">I'll finish this later</a>
            </div>
        `;
        
        modalFooter.innerHTML = `
            <button class="btn btn-primary" id="new-deposit">
                <i class="fas fa-plus"></i> New Deposit
            </button>
            <button class="btn btn-highlight" id="view-transactions">
                <i class="fas fa-list"></i> View Transactions
            </button>
        `;
        
        // Add event listeners for new buttons
        document.getElementById('finish-deposit').addEventListener('click', function(e) {
            e.preventDefault();
            closeDepositModal();
        });
        
        document.getElementById('new-deposit').addEventListener('click', function() {
            // Restore original form
            modalBody.innerHTML = originalBody;
            modalFooter.innerHTML = originalFooter;
            
            // Re-initialize event listeners
            setupDepositModalListeners();
            
            // Reset form state
            document.getElementById('modal-deposit-amount').value = '';
            document.getElementById('payment-method').value = 'bitcoin';
            updatePaymentMethod('bitcoin');
        });
        
        document.getElementById('view-transactions').addEventListener('click', function() {
            closeDepositModal();
            switchPanel('transactions');
            
            // Update navigation item active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-panel') === 'transactions') {
                    item.classList.add('active');
                }
            });
        });
        
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
                    <p>Initiated deposit of $${parseFloat(amount).toFixed(2)} via ${cryptoMethod.toUpperCase()}</p>
                </div>
            `;
            timeline.prepend(li);
        }
    }, 1500);
}

// Setup all event listeners for the deposit modal
function setupDepositModalListeners() {
    // Payment method change
    const paymentMethod = document.getElementById('payment-method');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', function() {
            updatePaymentMethod(this.value);
        });
    }
    
    // Confirm deposit button
    const confirmDeposit = document.getElementById('confirm-deposit');
    if (confirmDeposit) {
        confirmDeposit.addEventListener('click', function() {
            processDeposit();
        });
    }
    
    // Cancel deposit button
    const cancelDeposit = document.getElementById('cancel-deposit');
    if (cancelDeposit) {
        cancelDeposit.addEventListener('click', closeDepositModal);
    }
    
    // Deposit amount input
    const depositAmount = document.getElementById('modal-deposit-amount');
    if (depositAmount) {
        depositAmount.addEventListener('input', function() {
            const cryptoType = document.getElementById('payment-method').value;
            showCryptoEquivalent(this.value, cryptoType);
        });
    }
    
    // Copy address buttons
    document.querySelectorAll('.copy-address').forEach(button => {
        button.addEventListener('click', function() {
            const address = this.dataset.address;
            navigator.clipboard.writeText(address).then(() => {
                // Show a brief "Copied" message
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.classList.add('copied');
                
                // Create a tooltip-style message
                const tooltip = document.createElement('div');
                tooltip.className = 'copy-tooltip';
                tooltip.textContent = 'Copied!';
                this.appendChild(tooltip);
                
                setTimeout(() => {
                    if (tooltip.parentNode === this) {
                        this.removeChild(tooltip);
                    }
                    this.innerHTML = originalHTML;
                    this.classList.remove('copied');
                }, 2000);
            });
        });
    });
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

// Handle trader selection
function selectTrader(traderId) {
    console.log(`Selected trader with ID: ${traderId}`);
    
    // Find the trader card based on the trader ID
    const traderCard = document.querySelector(`.trader-card button[data-trader-id="${traderId}"]`).closest('.trader-card');
    const traderName = traderCard.querySelector('h4').textContent;
    
    // Show confirmation modal or notification
    showNotification('success', `You have selected ${traderName} as your trader. They will now manage your investments.`);
    
    // You would typically make an API call here to associate this trader with the user's account
    
    // After a short delay, navigate back to overview
    setTimeout(() => {
        switchPanel('overview');
        
        // Update navigation item active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-panel') === 'overview') {
                item.classList.add('active');
            }
        });
        
        // Update the top traders section in the overview
        updateTopTraders(traderId, traderName);
    }, 2000);
}

// Update the top traders section in overview
function updateTopTraders(traderId, traderName) {
    const topTradersContainer = document.querySelector('.top-traders');
    if (topTradersContainer) {
        // Clear the "no traders selected" message if present
        topTradersContainer.innerHTML = '';
        
        // Create the trader element
        const traderElement = document.createElement('div');
        traderElement.className = 'top-trader-item';
        
        // Set different styles based on trader ID
        let performanceColor = '#4CD964';
        let performance = '+0%';
        
        // Extended performance mapping for all trader IDs (1-20)
        if (traderId === '1') {
            performance = '+24.6%';
        } else if (traderId === '2') {
            performance = '+18.3%';
        } else if (traderId === '3') {
            performance = '+21.7%';
        } else if (traderId === '4') {
            performance = '+19.2%';
        } else if (traderId === '5') {
            performance = '+16.8%';
        } else if (traderId === '6') {
            performance = '+22.4%';
        } else if (traderId === '7') {
            performance = '+17.9%';
        } else if (traderId === '8') {
            performance = '+14.5%';
        } else if (traderId === '9') {
            performance = '+23.8%';
        } else if (traderId === '10') {
            performance = '+15.2%';
        } else if (traderId === '11') {
            performance = '+25.7%';
        } else if (traderId === '12') {
            performance = '+16.9%';
        } else if (traderId === '13') {
            performance = '+13.1%';
        } else if (traderId === '14') {
            performance = '+14.8%';
        } else if (traderId === '15') {
            performance = '+21.2%';
        } else if (traderId === '16') {
            performance = '+18.5%';
        } else if (traderId === '17') {
            performance = '+20.4%';
        } else if (traderId === '18') {
            performance = '+27.1%';
        } else if (traderId === '19') {
            performance = '+19.8%';
        } else if (traderId === '20') {
            performance = '+22.5%';
        }
        
        traderElement.innerHTML = `
            <div class="trader-item-info">
                <div class="trader-item-name">${traderName}</div>
                <div class="trader-item-performance" style="color: ${performanceColor}">${performance}</div>
            </div>
            <div class="trader-item-actions">
                <button class="btn-small btn-success">Active</button>
            </div>
        `;
        
        topTradersContainer.appendChild(traderElement);
        
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
                    <p>Selected ${traderName} as your trader</p>
                </div>
            `;
            timeline.prepend(li);
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
