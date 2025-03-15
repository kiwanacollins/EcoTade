document.addEventListener('DOMContentLoaded', async function() {
    // Add viewport adjustment function
    adjustViewport();
    
    console.log('Dashboard initialization started');
    
    try {
        // Get auth token from storage
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        if (!token) {
            console.error('No token found, redirecting to login');
            window.location.href = './login.html';
            return;
        }
        
        // CRITICAL FIX: Set isAuthenticated flag if token exists but flag doesn't
        if (!localStorage.getItem('isAuthenticated')) {
            console.log('Setting isAuthenticated flag from existing token');
            localStorage.setItem('isAuthenticated', 'true');
        }
        
        // NEW: First quickly verify token without triggering redirects
        const isTokenValid = await verifyTokenSilently();
        console.log('Token validation result:', isTokenValid);
        
        if (!isTokenValid) {
            // Only redirect if we're certain the token is invalid
            console.error('Token validation failed, redirecting to login');
            window.location.href = './login.html?reason=invalid_token';
            return;
        }
        
        // Setup UI immediately without waiting for API response
        console.log('Setting up UI components');
        setupEventListeners();
        initTraderDetailButtons();
        
        // Load any stored data while we fetch from API
        loadDataFromLocalStorage();
        
        // Try to fetch fresh data in background
        console.log('Fetching fresh data from API in background');
        fetchDashboardData()
            .then(userData => {
                if (userData) {
                    console.log('Successfully loaded dashboard data');
                    updateDashboardUI(userData);
                    
                    // Save data for offline use
                    localStorage.setItem('dashboardData', JSON.stringify(userData));
                }
            })
            .catch(error => {
                console.warn('Error fetching dashboard data:', error);
                showNotification('warning', 'Could not fetch the latest data. Using cached data instead.');
                
                // No redirect on error - just show warning
            });
        
        setupDataSyncMechanism(); // Add this line before trying to fetch data
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        
        // IMPROVED ERROR HANDLING: Only redirect for specific auth errors
        // AND check if the error message explicitly mentions authentication
        if (error.message && (error.message.includes('auth') || error.message.includes('token') || error.message.includes('unauthorized'))) {
            window.location.href = './login.html?reason=auth_error';
        } else {
            // For other errors, just show a warning and continue
            showNotification('error', 'There was a problem loading the dashboard. Please refresh to try again.');
        }
    }
});

// IMPROVED: Enhanced token verification function that's more resilient but still does basic checks
async function verifyTokenSilently() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        // Try a simple check that won't cause redirects - using a specialized endpoint
        try {
            const response = await fetch('/api/health/auth-check', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                // Important: Don't follow redirects
                redirect: 'manual',
                // Timeout after 3 seconds
                signal: AbortSignal.timeout(3000)
            });
            
            // If we got any successful response, the token is valid
            if (response.ok || response.status === 304) {
                return true;
            }
        } catch (e) {
            console.warn('Auth check API error:', e);
            // Ignore the error and continue with fallback
        }
        
        // If API check fails, but we have the authenticated flag, trust it
        if (localStorage.getItem('isAuthenticated') === 'true') {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Silent token verification error:', error);
        // If verification process itself fails, use isAuthenticated flag as fallback
        return localStorage.getItem('isAuthenticated') === 'true';
    }
}

// Load saved data from localStorage to show something immediately
function loadDataFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('dashboardData');
        if (savedData) {
            const data = JSON.parse(savedData);
            console.log('Loaded saved data from localStorage');
            updateDashboardUI(data);
            return true;
        }
    } catch (e) {
        console.error('Error loading saved dashboard data:', e);
    }
    return false;
}

// Improved fetchDashboardData function to ensure user data is properly retrieved
async function fetchDashboardData(skipCache = false) {
    console.log('Fetching dashboard data...', skipCache ? '(Skip Cache)' : '');
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found, cannot fetch dashboard data');
            window.location.href = '/login.html';
            return;
        }

        // Add anti-cache query parameter if skipCache is true
        const cacheParam = skipCache ? `?nocache=${Date.now()}` : '';

        // First try the dedicated user profile endpoint
        try {
            const userResponse = await fetch(`/api/users/profile${cacheParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': skipCache ? 'no-cache, no-store' : 'default'
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('User profile data fetched:', userData);
                
                if (userData && userData.success && userData.data) {
                    // Store username in localStorage as backup
                    localStorage.setItem('username', userData.data.name);
                    
                    // Now fetch financial data with anti-cache parameter if needed
                    const financialResponse = await fetch(`/api/financial/dashboard${cacheParam}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Cache-Control': skipCache ? 'no-cache, no-store' : 'default'
                        }
                    });
                    
                    if (financialResponse.ok) {
                        const financialData = await financialResponse.json();
                        console.log('Financial data fetched:', financialData);
                        
                        // Combine user and financial data
                        const dashboardData = {
                            user: userData.data,
                            accountSummary: {
                                totalBalance: 
                                    financialData?.data?.totalBalance || 0,
                                profit: 
                                    financialData?.data?.profit || 0,
                                activeTrades: 
                                    financialData?.data?.activeTrades || 0,
                                activeTraders: 
                                    financialData?.data?.activeTraders || 0
                            },
                            selectedTrader: 
                                financialData?.data?.selectedTrader || null,
                            transactions: 
                                financialData?.data?.transactions || [],
                            investments: 
                                financialData?.data?.investments || []
                        };
                        
                        // Add a sync timestamp to the data
                        dashboardData.syncTimestamp = new Date().toISOString();
                        dashboardData.syncSource = 'server';
                        
                        // Cache the dashboard data
                        localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
                        localStorage.setItem('lastDataSync', new Date().toISOString());
                        
                        return dashboardData;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            showConnectionErrorNotification();
        }
        
        // Fallback to legacy endpoint if the first attempt fails
        const response = await fetch(`/api/auth/dashboard${cacheParam}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': skipCache ? 'no-cache, no-store' : 'default'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Dashboard data from legacy endpoint:', data);
            
            if (data && data.data) {
                // Cache the response
                localStorage.setItem('dashboardData', JSON.stringify(data.data));
                return data.data;
            }
        }
        
        // If we get here, try another endpoint as a last resort
        const fallbackResponse = await fetch(`/api/user/financial-data${cacheParam}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': skipCache ? 'no-cache, no-store' : 'default'
            }
        });
        
        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            const username = localStorage.getItem('username');
            
            const dashboardData = {
                user: { name: username || 'User' },
                accountSummary: {
                    totalBalance: data.totalBalance || 0,
                    profit: data.profit || 0,
                    activeTrades: data.activeTrades || 0,
                    activeTraders: data.activeTraders || 0
                },
                selectedTrader: data.selectedTrader || null,
                transactions: data.transactions || [],
                investments: data.investments || []
            };
            
            return dashboardData;
        }
        
        // Add diagnostic information to error message
        throw new Error('Failed to fetch dashboard data. Network Status: ' + 
                        (navigator.onLine ? 'Online' : 'Offline') + 
                        ', Last Sync: ' + (localStorage.getItem('lastDataSync') || 'Never'));
    } catch (error) {
        console.error('Error in fetchDashboardData:', error);
        
        // Show more detailed error notification with recovery info
        showNotification('error', 'Could not fetch the latest data. Using cached data instead. Try refreshing the page or checking your internet connection.');
        
        // Attempt to use cached data with clear marking that it's cached
        const cachedData = localStorage.getItem('dashboardData');
        if (cachedData) {
            console.log('Using cached dashboard data from localStorage');
            const data = JSON.parse(cachedData);
            
            // Mark data as coming from cache for UI display
            data.syncSource = 'cache';
            data.usingCachedData = true;
            
            return data;
        }
        
        // Last resort fallback
        return {
            user: { name: localStorage.getItem('username') || 'User' },
            accountSummary: {
                totalBalance: 0,
                profit: 0,
                activeTrades: 0,
                activeTraders: 0
            },
            selectedTrader: null,
            transactions: [],
            investments: []
        };
    }
}

// Function to adjust viewport scaling for better mobile viewing
function adjustViewport() {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const screenWidth = window.innerWidth;
    
    // For smaller screens, set an appropriate initial scale to fit all content
    if (screenWidth <= 768) {
        // Use a slightly smaller initial scale for mobile devices
        const initialScale = Math.min(screenWidth / 400, 0.9);
        viewportMeta.setAttribute('content', `width=device-width, initial-scale=${initialScale}, maximum-scale=1.0, user-scalable=yes`);
        console.log(`Viewport adjusted for mobile: scale=${initialScale}`);
        
        // Add additional body class for mobile optimization
        document.body.classList.add('mobile-optimized');
    } else {
        // Ensure desktop view is properly set
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
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
    
    // Initialize payment methods dropdown
    const paymentMethodSelect = document.getElementById('payment-method-select');
    if (paymentMethodSelect) {
        // Add change event listener if it doesn't exist
        if (!paymentMethodSelect.dataset.initialized) {
            paymentMethodSelect.addEventListener('change', function() {
                updatePaymentDetails(this.value);
            });
            paymentMethodSelect.dataset.initialized = 'true';
        }
    }

    // Initialize charts after updating UI data
    initializeCharts(dashboardData);
    
    // Update activity feed
    updateActivityFeed(dashboardData.recentActivities || []);
    
    // Update transactions table
    updateTransactionsTable(dashboardData.transactions || []);
    
    // Update investments list
    updateInvestmentsList(dashboardData.investments || []);
    
    // Add sync status indicator if applicable
    const syncStatusElem = document.querySelector('.sync-status');
    if (syncStatusElem) {
        if (dashboardData.usingCachedData) {
            syncStatusElem.textContent = 'Using cached data';
            syncStatusElem.className = 'sync-status cached';
        } else {
            syncStatusElem.textContent = 'Data synced';
            syncStatusElem.className = 'sync-status synced';
            
            // Hide after a few seconds
            setTimeout(() => {
                syncStatusElem.classList.add('hiding');
            }, 3000);
        }
    }
}

// Function to handle payment method dropdown change
function updatePaymentDetails(method) {
    // Hide all payment details first
    document.querySelectorAll('.payment-details-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected payment method details
    const selectedSection = document.getElementById(`${method}-details-section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // If it's crypto, make sure we initialize the cryptocurrency dropdown
        if (method === 'crypto') {
            // Default to bitcoin
            if (document.getElementById('payment-method')) {
                updateCryptoMethod('bitcoin');
            }
        }
        
        // For animation effect
        selectedSection.style.opacity = '0';
        setTimeout(() => {
            selectedSection.style.opacity = '1';
        }, 50);
    }
    
    // Update the deposit button state
    const confirmButton = document.getElementById('confirm-deposit');
    if (confirmButton) {
        confirmButton.disabled = false;
    }
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
    
    // Notification icon click event - show motivational widget
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMotivationalWidget();
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
    
    // Payment method changer
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
}

// Trader details data
const traderDetails = {
    "1": {
        name: "John Smith",
        specialty: "Crypto Specialist",
        background: "A seasoned trader focused on digital assets, John has developed deep insights into the crypto market over several years.",
        strategy: "Leverages technical analysis, blockchain sentiment, and emerging token trends to identify opportunities in both major and altcoins.",
        performance: {
            monthly: "+24.6%",
            allTime: "+142%"
        },
        riskManagement: "Uses diversified holdings and strict stop-loss orders to navigate crypto volatility.",
        additionalInfo: "Actively involved in crypto communities and early-adopter projects, always on the lookout for breakthrough blockchain innovations.",
        experience: "8+ years",
        riskLevel: "Moderate-High",
        minInvestment: "$500",
        activeClients: "384"
    },
    "2": {
        name: "Emma Johnson",
        specialty: "Forex Expert",
        background: "With a decade of experience in currency markets, Emma is well-versed in the dynamics of forex trading.",
        strategy: "Combines technical chart patterns with fundamental economic indicators to time entries and exits accurately.",
        performance: {
            monthly: "+18.3%",
            allTime: "+95%"
        },
        riskManagement: "Employs careful leverage management and dynamic stop-loss strategies to protect capital.",
        additionalInfo: "Known for her precision and ability to read volatile market conditions, ensuring steady returns.",
        experience: "10+ years",
        riskLevel: "Moderate",
        minInvestment: "$1,000",
        activeClients: "256"
    },
    "3": {
        name: "Michael Chen",
        specialty: "Stock Market Analyst",
        background: "Michael brings robust equity research and market insight to the table, focusing on stock performance analysis.",
        strategy: "Uses a blend of fundamental analysis and technical indicators to identify undervalued stocks and growth opportunities.",
        performance: {
            monthly: "+21.7%",
            allTime: "+118%"
        },
        riskManagement: "Diversifies across sectors and utilizes hedging techniques with options to minimize downside risk.",
        additionalInfo: "Relies on comprehensive market research and real-time data to fine-tune his stock selection process.",
        experience: "12+ years",
        riskLevel: "Moderate",
        minInvestment: "$1,000",
        activeClients: "312"
    },
    "4": {
        name: "Sarah Johnson",
        specialty: "Algorithmic Trading Expert",
        background: "With a strong background in both coding and finance, Sarah excels at designing automated trading systems.",
        strategy: "Implements and continuously refines quantitative models that automate trade execution based on historical data and real-time signals.",
        performance: {
            monthly: "+19.2%",
            allTime: "+127%"
        },
        riskManagement: "Uses backtesting and rigorous parameter optimization to ensure algorithms perform reliably under varied market conditions.",
        additionalInfo: "Constantly monitors system performance and market trends to adjust strategies on the fly.",
        experience: "7+ years",
        riskLevel: "Moderate",
        minInvestment: "$2,000",
        activeClients: "195"
    },
    "5": {
        name: "David Rodriguez",
        specialty: "Commodities Specialist",
        background: "David has extensive experience in commodities, with a focus on metals, energy, and agriculture.",
        strategy: "Analyzes supply and demand fundamentals combined with technical chart patterns to identify commodity price movements.",
        performance: {
            monthly: "+16.8%",
            allTime: "+105%"
        },
        riskManagement: "Implements hedging strategies and diversifies across multiple commodity types to mitigate sector-specific risks.",
        additionalInfo: "Monitors global economic indicators and geopolitical events to stay ahead in the commodity markets.",
        experience: "15+ years",
        riskLevel: "Moderate-High",
        minInvestment: "$1,500",
        activeClients: "178"
    },
    "6": {
        name: "Jessica Kim",
        specialty: "Options Trading Strategist",
        background: "Jessica is a specialist in derivatives with an in-depth understanding of options markets and pricing models.",
        strategy: "Uses advanced options strategies (spreads, straddles, iron condors) to capitalize on market volatility and directional moves.",
        performance: {
            monthly: "+22.4%",
            allTime: "+136%"
        },
        riskManagement: "Conducts detailed risk/reward analysis and closely monitors options greeks to adjust positions swiftly.",
        additionalInfo: "Recognized for her ability to design flexible strategies that adapt to changing market conditions.",
        experience: "9+ years",
        riskLevel: "High",
        minInvestment: "$2,500",
        activeClients: "142"
    },
    "7": {
        name: "Robert Taylor",
        specialty: "Technical Analyst",
        background: "Robert's expertise lies in interpreting market charts and identifying technical patterns that forecast price movements.",
        strategy: "Utilizes candlestick analysis, moving averages, and oscillators to pinpoint high-probability trade signals.",
        performance: {
            monthly: "+17.9%",
            allTime: "+92%"
        },
        riskManagement: "Relies on systematic stop-loss and take-profit levels based on technical indicators to safeguard investments.",
        additionalInfo: "Known for his disciplined, methodical approach, ensuring consistency in his trading performance.",
        experience: "11+ years",
        riskLevel: "Moderate",
        minInvestment: "$1,000",
        activeClients: "263"
    },
    "8": {
        name: "Linda Martinez",
        specialty: "Value Investing Expert",
        background: "Linda is dedicated to finding undervalued opportunities through rigorous fundamental analysis.",
        strategy: "Focuses on companies with strong balance sheets and sustainable competitive advantages, emphasizing long-term growth.",
        performance: {
            monthly: "+14.5%",
            allTime: "+88%"
        },
        riskManagement: "Regularly rebalances portfolios and maintains a long-term perspective to minimize volatility.",
        additionalInfo: "Known for her patient, disciplined investment approach that favors long-term wealth accumulation.",
        experience: "14+ years",
        riskLevel: "Low-Moderate",
        minInvestment: "$1,000",
        activeClients: "410"
    },
    "9": {
        name: "James Wilson",
        specialty: "Day Trading Specialist",
        background: "James is an expert in high-frequency, intraday trading, thriving on the fast pace of the market.",
        strategy: "Executes rapid trades based on real-time technical analysis and momentum indicators, capitalizing on small price movements.",
        performance: {
            monthly: "+23.8%",
            allTime: "+153%"
        },
        riskManagement: "Applies robust quantitative risk controls and diversification methods to maintain portfolio resilience.",
        additionalInfo: "Renowned for his quick decision-making and ability to consistently capture short-term market opportunities.",
        experience: "10+ years",
        riskLevel: "Moderate-High",
        minInvestment: "$3,000",
        activeClients: "156"
    },
    "10": {
        name: "Jennifer Lee",
        specialty: "Global Markets Analyst",
        background: "Jennifer possesses a deep understanding of international markets and global economic trends.",
        strategy: "Combines macroeconomic analysis with geopolitical insights to navigate diverse global markets.",
        performance: {
            monthly: "+15.2%",
            allTime: "+87%"
        },
        riskManagement: "Relies on in-depth research and a margin-of-safety approach to limit downside risk.",
        additionalInfo: "Provides valuable market commentary and forecasts that help shape strategic investment decisions.",
        experience: "16+ years",
        riskLevel: "Low-Moderate",
        minInvestment: "$2,000",
        activeClients: "285"
    },
    "11": {
        name: "Thomas Brown",
        specialty: "Fixed Income Specialist",
        background: "Thomas has extensive experience in the bond and treasury markets, specializing in income-generating assets.",
        strategy: "Analyzes interest rate trends, credit ratings, and macroeconomic indicators to optimize fixed income portfolios.",
        performance: {
            monthly: "+13.1%",
            allTime: "+71%"
        },
        riskManagement: "Emphasizes conservative positions and duration management to reduce exposure to rate fluctuations.",
        additionalInfo: "Known for his disciplined approach in creating stable, income-focused portfolios.",
        experience: "18+ years",
        riskLevel: "Low",
        minInvestment: "$2,500",
        activeClients: "356"
    },
    "12": {
        name: "Sophia Williams",
        specialty: "Dividend Growth Strategist",
        background: "Sophia focuses on building portfolios around companies with a strong history of dividend growth.",
        strategy: "Selects stocks with consistent dividend increases and robust fundamentals to drive long-term returns.",
        performance: {
            monthly: "+14.8%",
            allTime: "+90%"
        },
        riskManagement: "Uses dividend reinvestment and sector diversification to stabilize portfolio performance.",
        additionalInfo: "Combines income with growth, offering a balanced approach that appeals to long-term investors.",
        experience: "12+ years",
        riskLevel: "Low-Moderate",
        minInvestment: "$2,000",
        activeClients: "275"
    },
    "13": {
        name: "Alexander White",
        specialty: "Futures Trader",
        background: "Alexander specializes in trading futures contracts across commodities and financial instruments.",
        strategy: "Utilizes technical indicators and market sentiment analysis to identify optimal entry and exit points in the futures markets.",
        performance: {
            monthly: "+21.2%",
            allTime: "+132%"
        },
        riskManagement: "Applies disciplined leverage and strict margin controls to manage exposure in volatile futures markets.",
        additionalInfo: "Known for his agility in seizing opportunities in fast-moving markets and adjusting positions as needed.",
        experience: "9+ years",
        riskLevel: "High",
        minInvestment: "$3,000",
        activeClients: "164"
    },
    "14": {
        name: "Olivia Harris",
        specialty: "Swing Trading Expert",
        background: "Olivia is adept at identifying and capitalizing on mid-term market movements.",
        strategy: "Combines technical analysis with trend evaluation to pinpoint lucrative swing trading opportunities.",
        performance: {
            monthly: "+18.5%",
            allTime: "+110%"
        },
        riskManagement: "Uses moving averages and signal-based exits to optimize timing and minimize risk.",
        additionalInfo: "Balances market trends with tactical entries, ensuring a favorable risk-reward balance in each trade.",
        experience: "7+ years",
        riskLevel: "Moderate",
        minInvestment: "$1,500",
        activeClients: "238"
    },
    "15": {
        name: "William Martin",
        specialty: "Growth Investing Strategist",
        background: "William focuses on high-growth sectors and emerging companies poised for rapid expansion.",
        strategy: "Analyzes innovation, market position, and earnings potential to select growth stocks with strong future prospects.",
        performance: {
            monthly: "+20.4%",
            allTime: "+129%"
        },
        riskManagement: "Diversifies across high-potential sectors and continually monitors earnings reports to adjust positions.",
        additionalInfo: "Known for his forward-thinking approach and ability to identify emerging market leaders.",
        experience: "11+ years",
        riskLevel: "Moderate-High",
        minInvestment: "$2,000",
        activeClients: "201"
    },
    "16": {
        name: "Natalie Lewis",
        specialty: "DeFi & Web3 Specialist",
        background: "Natalie is immersed in the decentralized finance and Web3 ecosystem, with a keen eye on blockchain innovations.",
        strategy: "Evaluates tokenomics, smart contract viability, and market sentiment to identify disruptive projects and profitable opportunities.",
        performance: {
            monthly: "+27.1%",
            allTime: "+156%"
        },
        riskManagement: "Implements dynamic portfolio adjustments and stringent risk controls to manage the inherent volatility of digital assets.",
        additionalInfo: "Passionate about emerging tech, Natalie stays ahead of trends in the DeFi and Web3 space to maximize returns.",
        experience: "6+ years",
        riskLevel: "Very High",
        minInvestment: "$2,000",
        activeClients: "132"
    },
    "17": {
        name: "Christopher Clark",
        specialty: "Energy Markets Expert",
        background: "Christopher brings deep expertise in energy commodities, including oil, gas, and renewable sectors.",
        strategy: "Combines fundamental supply-demand analysis with technical indicators to navigate shifts in energy prices.",
        performance: {
            monthly: "+19.8%",
            allTime: "+125%"
        },
        riskManagement: "Diversifies his exposure within the energy sector and employs hedging strategies to reduce risk.",
        additionalInfo: "Monitors geopolitical and regulatory developments closely, ensuring timely adjustments to his trading positions.",
        experience: "14+ years",
        riskLevel: "Moderate-High",
        minInvestment: "$2,500",
        activeClients: "179"
    },
    "18": {
        name: "Rachel Green",
        specialty: "Biotech Sector Analyst",
        background: "Rachel specializes in the biotech arena, analyzing clinical trials, regulatory updates, and market trends to inform her decisions.",
        strategy: "Focuses on companies at the forefront of innovation in healthcare, balancing potential breakthroughs with inherent risks.",
        performance: {
            monthly: "+22.5%",
            allTime: "+138%"
        },
        riskManagement: "Uses thorough research and sector diversification to navigate the volatility of biotech investments.",
        additionalInfo: "Known for her forward-thinking approach, Rachel provides insightful commentary on emerging biotech trends and market opportunities.",
        experience: "9+ years",
        riskLevel: "High",
        minInvestment: "$2,000",
        activeClients: "153"
    }
};

// Function to show trader details modal
function showTraderDetails(traderId) {
    console.log(`Showing details for trader ID: ${traderId}`);
    
    // Get trader details from our data
    const trader = traderDetails[traderId];
    if (!trader) {
        console.error(`No details found for trader ID: ${traderId}`);
        return;
    }
    
    try {
        // Find trader card to get the images visible in the DOM
        const traderCard = document.querySelector(`.trader-card button[data-trader-id="${traderId}"]`).closest('.trader-card');
        const traderImg = traderCard.querySelector('.trader-avatar img').src;
        
        // Populate modal with trader details
        document.getElementById('trader-profile-img').src = traderImg;
        document.getElementById('trader-profile-name').textContent = trader.name;
        document.getElementById('trader-profile-spec').textContent = trader.specialty;
        document.getElementById('trader-profile-monthly').textContent = trader.performance.monthly;
        document.getElementById('trader-profile-alltime').textContent = trader.performance.allTime;
        
        // About section combines background and additional info
        document.getElementById('trader-profile-about').textContent = `${trader.background} ${trader.additionalInfo}`;
        
        // Expertise section combines strategy and risk management
        document.getElementById('trader-profile-expertise').textContent = 
            `Trading Strategy: ${trader.strategy}\n\nRisk Management: ${trader.riskManagement}`;
        
        // Stats section
        document.getElementById('trader-profile-experience').textContent = trader.experience;
        document.getElementById('trader-profile-min-investment').textContent = trader.minInvestment;
        document.getElementById('trader-profile-clients').textContent = trader.activeClients;
        
        // Add trader ID to the select button for use when clicked
        document.getElementById('trader-profile-select').setAttribute('data-trader-id', traderId);
        
        // Initialize trader performance chart
        initTraderPerformanceChart(traderId);
        
        // Show the modal with explicit logging
        const modal = document.getElementById('trader-details-modal');
        if (modal) {
            console.log('Displaying trader details modal');
            modal.style.display = 'flex'; // Force display style first
            modal.classList.add('active');
            
            // Make sure modal is visible in the DOM
            setTimeout(() => {
                if (!modal.classList.contains('active')) {
                    console.log('Modal class was not applied properly, forcing display');
                    modal.classList.add('active');
                    modal.style.display = 'flex';
                }
            }, 100);
            
            // Add event listener to close when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeTraderDetailsModal();
                }
            });
        } else {
            console.error('Trader details modal element not found');
        }
    } catch (error) {
        console.error('Error showing trader details:', error);
    }
}

// Close trader details modal
function closeTraderDetailsModal() {
    console.log('Closing trader details modal');
    const modal = document.getElementById('trader-details-modal');
    if (modal) {
        modal.classList.remove('active');
        
        // Make sure it's hidden
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match this to your CSS transition time
    }
}

// Initialize trader performance chart
function initTraderPerformanceChart(traderId) {
    const ctx = document.getElementById('trader-performance-chart');
    if (!ctx) return;
    
    // Destroy existing chart instance if it exists
    if (window.traderChart) {
        window.traderChart.destroy();
    }
    
    // Generate some mock performance data based on trader's performance numbers
    const trader = traderDetails[traderId];
    if (!trader) return;
    
    // Parse monthly performance percentage
    const monthlyPerf = parseFloat(trader.performance.monthly) / 100;
    
    // Generate last 12 months performance data with some variations
    const labels = [];
    const data = [];
    let baseValue = 10000; // Starting with $10,000 investment
    
    // Create month labels (last 12 months)
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleString('default', { month: 'short' }));
        
        // Calculate performance with some random variation around the monthly average
        const variation = (Math.random() * 0.04) - 0.02; // Random variation between -2% and +2%
        const monthlyReturn = monthlyPerf / 12 + variation;
        
        // Compound the returns
        baseValue = baseValue * (1 + monthlyReturn);
        data.push(baseValue.toFixed(2));
    }
    
    // Create the chart
    window.traderChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value ($)',
                data: data,
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
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Value: $${Number(context.raw).toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
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

// Open the deposit modal with improved multi-step process
function openDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.classList.add('active');
        
        // Reset the modal to first step
        resetDepositModal();
        
        // Add event listener to close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDepositModal();
            }
        });
        
        // Set default payment method
        const paymentMethodSelect = document.getElementById('payment-method-select');
        if (paymentMethodSelect) {
            // Default to bank
            paymentMethodSelect.value = 'bank';
            updatePaymentDetails('bank');
        }
    }
}

// Reset deposit modal to initial state
function resetDepositModal() {
    // Reset input fields
    document.getElementById('modal-deposit-amount').value = '';
    
    // Show first step, hide others
    document.getElementById('step-amount').classList.remove('hidden');
    document.getElementById('step-method').classList.add('hidden');
    document.getElementById('step-payment').classList.add('hidden');
    
    // Update steps indicators
    const steps = document.querySelectorAll('.deposit-steps .step');
    steps[0].classList.add('active');
    steps[1].classList.remove('active');
    steps[2].classList.remove('active');
    
    // Reset payment method selection
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('step2-next').disabled = true;
    
    // Hide all payment method details
    document.querySelectorAll('.payment-details').forEach(el => {
        el.style.display = 'none';
    });
    
    // Reset crypto method to default
    if (document.getElementById('payment-method')) {
        document.getElementById('payment-method').value = 'bitcoin';
        updateCryptoMethod('bitcoin');
    }
    
    // Set focus on the amount input
    setTimeout(() => {
        document.getElementById('modal-deposit-amount').focus();
    }, 300);
    
    // Generate unique reference numbers for payment methods
    generateUniqueReferences();
    
    // Set up event listeners for multi-step navigation
    setupDepositModalListeners();
}

// Setup all event listeners for the deposit modal
function setupDepositModalListeners() {
    // Step 1: Amount input and next button
    const depositAmount = document.getElementById('modal-deposit-amount');
    if (depositAmount) {
        depositAmount.addEventListener('input', function() {
            // Enable/disable next button based on valid amount
            const nextButton = document.getElementById('step1-next');
            const isValid = parseFloat(this.value) >= 10;
            nextButton.disabled = !isValid;
        });
    }
    
    const step1Next = document.getElementById('step1-next');
    if (step1Next) {
        step1Next.addEventListener('click', function() {
            const amount = document.getElementById('modal-deposit-amount').value;
            if (!amount || parseFloat(amount) < 10) {
                showNotification('error', 'Please enter a valid amount (minimum $10)');
                return;
            }
            
            // Move to step 2
            goToStep(2);
        });
    }
    
    // Step 2: Payment method selection
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected from all cards
            document.querySelectorAll('.payment-method-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Select this card
            this.classList.add('selected');
            
            // Enable next button
            document.getElementById('step2-next').disabled = false;
        });
    });
    
    const step2Back = document.getElementById('step2-back');
    if (step2Back) {
        step2Back.addEventListener('click', function() {
            goToStep(1);
        });
    }
    
    const step2Next = document.getElementById('step2-next');
    if (step2Next) {
        step2Next.addEventListener('click', function() {
            const selectedMethod = document.querySelector('.payment-method-card.selected');
            if (!selectedMethod) {
                showNotification('error', 'Please select a payment method');
                return;
            }
            
            // Move to step 3
            goToStep(3);
            
            // Show the appropriate payment details
            const method = selectedMethod.getAttribute('data-method');
            showPaymentDetails(method);
        });
    }
    
    // Step 3: Back button
    const step3Back = document.getElementById('step3-back');
    if (step3Back) {
        step3Back.addEventListener('click', function() {
            goToStep(2);
        });
    }
    
    // Crypto payment method selection
    const cryptoPaymentMethod = document.getElementById('payment-method');
    if (cryptoPaymentMethod) {
        cryptoPaymentMethod.addEventListener('change', function() {
            updateCryptoMethod(this.value);
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
    
    // Copy address buttons for crypto
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

// Go to specific step in deposit flow
function goToStep(stepNumber) {
    // Hide all steps
    document.getElementById('step-amount').classList.add('hidden');
    document.getElementById('step-method').classList.add('hidden');
    document.getElementById('step-payment').classList.add('hidden');
    
    // Update step indicators
    const steps = document.querySelectorAll('.deposit-steps .step');
    steps.forEach((step, index) => {
        if (index < stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Show the current step
    if (stepNumber === 1) {
        document.getElementById('step-amount').classList.remove('hidden');
    } else if (stepNumber === 2) {
        document.getElementById('step-method').classList.remove('hidden');
    } else if (stepNumber === 3) {
        document.getElementById('step-payment').classList.remove('hidden');
    }
}

// Show the appropriate payment details based on selected method
function showPaymentDetails(method) {
    // Hide all payment details
    document.querySelectorAll('.payment-details').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show the selected payment details
    switch (method) {
        case 'bank':
            document.getElementById('bank-details').style.display = 'block';
            break;
        case 'airtel':
            document.getElementById('airtel-details').style.display = 'block';
            break;
        case 'mtn':
            document.getElementById('mtn-details').style.display = 'block';
            break;
        case 'crypto':
            document.getElementById('crypto-details').style.display = 'block';
            updateCryptoMethod('bitcoin'); // Default to Bitcoin
            break;
    }
}

// Enhanced payment method handling specifically for crypto options
function updateCryptoMethod(method) {
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

// Process deposit with selected payment method
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
        
        // Add to transactions table
        updateTransactionsWithNewDeposit(amount, cryptoMethod);
    }, 1500);
}

// Helper function to update transactions table with new deposit
function updateTransactionsWithNewDeposit(amount, paymentMethod) {
    const tbody = document.querySelector('#transactions-history tbody');
    if (tbody) {
        // Remove "no data" message if it exists
        const noDataRow = tbody.querySelector('.no-data-message');
        if (noDataRow) {
            tbody.innerHTML = '';
        }
        
        // Create new transaction row
        const tr = document.createElement('tr');
        const now = new Date();
        
        tr.innerHTML = `
            <td>${formatDate(now)}</td>
            <td>Deposit</td>
            <td>Deposit via ${paymentMethod}</td>
            <td>$${parseFloat(amount).toFixed(2)}</td>
            <td><span class="status-badge pending">Pending</span></td>
        `;
        
        // Add to top of table
        if (tbody.firstChild) {
            tbody.insertBefore(tr, tbody.firstChild);
        } else {
            tbody.appendChild(tr);
        }
    }
}

// Generate unique transaction references for payment methods
function generateUniqueReferences() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const reference = `ECOT-${timestamp}-${randomDigits}`;
    
    // Update reference fields
    const bankRef = document.getElementById('bank-reference');
    const airtelRef = document.getElementById('airtel-reference');
    const mtnRef = document.getElementById('mtn-reference');
    
    if (bankRef) {
        bankRef.textContent = reference;
        const copyBtn = bankRef.nextElementSibling;
        if (copyBtn && copyBtn.classList.contains('copy-btn')) {
            copyBtn.dataset.copy = reference;
        }
    }
    
    if (airtelRef) {
        airtelRef.textContent = reference;
        const copyBtn = airtelRef.nextElementSibling;
        if (copyBtn && copyBtn.classList.contains('copy-btn')) {
            copyBtn.dataset.copy = reference;
        }
    }
    
    if (mtnRef) {
        mtnRef.textContent = reference;
        const copyBtn = mtnRef.nextElementSibling;
        if (copyBtn && copyBtn.classList.contains('copy-btn')) {
            copyBtn.dataset.copy = reference;
        }
    }
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .catch(err => {
                console.error('Failed to copy text: ', err);
                // Fallback for older browsers
                fallbackCopyTextToClipboard(text);
            });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback copy function for browsers without clipboard API
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Copy command error', err);
    }
    
    document.body.removeChild(textArea);
}

// Show visual feedback when copying
function showCopiedFeedback(element) {
    // Create tooltip or use existing one
    let tooltip = element.querySelector('.copy-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = 'Copied!';
        element.appendChild(tooltip);
    } else {
        tooltip.style.display = 'block';
    }
    
    // Add copied class for styling
    element.classList.add('copied');
    
    // Remove tooltip after delay
    setTimeout(() => {
        if (tooltip.parentNode === element) {
            element.removeChild(tooltip);
        }
        element.classList.remove('copied');
    }, 2000);
}

// Close the deposit modal
function closeDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
        modal.classList.remove('active');
        
        // Remove widget after animation completes
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
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
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Value: $${Number(context.raw).toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
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
async function initiateDeposit(amount) {
    if (!amount || isNaN(amount) || amount <= 0) {
        showNotification('error', 'Please enter a valid deposit amount');
        return;
    }
    
    try {
        showNotification('info', `Processing your deposit of ${formatCurrency(amount)}...`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get current balance from DOM
        const balanceElement = document.querySelector('.balance-amount');
        const currentBalance = parseFloat(balanceElement.textContent.replace('$', '').replace(',', '')) || 0;
        
        // Calculate new balance
        const newBalance = currentBalance + parseFloat(amount);
        
        // Create transaction record
        const transaction = {
            date: new Date(),
            type: 'Deposit',
            description: 'Account deposit',
            amount: parseFloat(amount),
            status: 'Completed'
        };
        
        // Update UI
        balanceElement.textContent = formatCurrency(newBalance);
        
        // Save updated data to server
        const token = localStorage.getItem('token');
        if (!token) return;
        
        await fetch('/api/user/financial-data', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                totalBalance: newBalance,
                transactions: [transaction] // Note: In a real implementation, you'd fetch current transactions first and append
            })
        });
        
        // Update transactions table with new transaction
        const transactions = document.querySelector('#transactions-history tbody');
        if (transactions) {
            const existingTransactions = Array.from(transactions.querySelectorAll('tr'))
                .filter(tr => !tr.querySelector('.no-data-message'));
                
            if (existingTransactions.length > 0) {
                // If there are existing transactions, add the new one
                updateTransactionsTable([transaction]);
            } else {
                // If no transactions exist, replace with the new one
                transactions.innerHTML = '';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td>${transaction.type}</td>
                    <td>${transaction.description}</td>
                    <td>${formatCurrency(transaction.amount)}</td>
                    <td><span class="status-badge ${transaction.status.toLowerCase()}">${transaction.status}</span></td>
                `;
                transactions.appendChild(tr);
            }
        }
        
        showNotification('success', `Successfully deposited ${formatCurrency(amount)}`);
        
        // Close deposit modal
        const depositModal = document.getElementById('deposit-modal');
        if (depositModal) {
            depositModal.classList.remove('active');
            setTimeout(() => {
                depositModal.style.display = 'none';
            }, 300);
        }
    } catch (error) {
        console.error('Error processing deposit:', error);
        showNotification('error', 'Failed to process your deposit. Please try again.');
    }
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

// Improved trader selection function with better error handling
async function saveSelectedTrader(trader) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found, cannot save trader selection');
            showNotification('error', 'Authentication error. Please log in again.');
            return false;
        }
        
        console.log('Saving selected trader:', trader);
        
        // Try both endpoints simultaneously to maximize chances of success
        const promises = [
            fetch('/api/financial/dashboard', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Device-ID': getDeviceIdentifier() // Add device ID for better tracking
                },
                body: JSON.stringify({
                    selectedTrader: trader
                })
            }),
            fetch('/api/user/financial-data', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Device-ID': getDeviceIdentifier() // Add device ID for better tracking
                },
                body: JSON.stringify({
                    selectedTrader: trader
                })
            })
        ];
        
        // Wait for both requests to complete - even if one fails
        const results = await Promise.allSettled(promises);
        
        // Check if at least one succeeded
        const anySuccess = results.some(result => 
            result.status === 'fulfilled' && result.value.ok);
        
        if (!anySuccess) {
            const errors = results
                .filter(r => r.status === 'rejected')
                .map(r => r.reason.message)
                .join(', ');
                
            console.error('All endpoints failed to save trader selection:', errors);
            
            // Save timestamp of failed sync attempt
            localStorage.setItem('lastFailedSync', new Date().toISOString());
            
            throw new Error(`Server update failed: ${errors}`);
        }
        
        console.log('Trader selection saved successfully to server');
        
        // Update the sync timestamp
        localStorage.setItem('lastDataSync', new Date().toISOString());
        
        // Update in-memory cache with the selected trader
        try {
            const cachedDataStr = localStorage.getItem('dashboardData');
            if (cachedDataStr) {
                const cachedData = JSON.parse(cachedDataStr);
                cachedData.selectedTrader = trader;
                cachedData.syncTimestamp = new Date().toISOString();
                cachedData.syncSource = 'server';
                localStorage.setItem('dashboardData', JSON.stringify(cachedData));
            }
        } catch (e) {
            console.warn('Failed to update cached data with new trader selection:', e);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving selected trader:', error);
        
        // Show warning notification with explanation about cross-device sync
        showNotification('warning', 
            'Your trader selection was saved locally, but might not sync to other devices. Check your internet connection.',
            5000);
            
        return false;
    }
}

// Generate a persistent device identifier
function getDeviceIdentifier() {
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
        // Generate a new device ID
        deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
}

// Update the UI based on data sync status
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
    
    // Initialize payment methods dropdown
    const paymentMethodSelect = document.getElementById('payment-method-select');
    if (paymentMethodSelect) {
        // Add change event listener if it doesn't exist
        if (!paymentMethodSelect.dataset.initialized) {
            paymentMethodSelect.addEventListener('change', function() {
                updatePaymentDetails(this.value);
            });
            paymentMethodSelect.dataset.initialized = 'true';
        }
    }

    // Initialize charts after updating UI data
    initializeCharts(dashboardData);
    
    // Update activity feed
    updateActivityFeed(dashboardData.recentActivities || []);
    
    // Update transactions table
    updateTransactionsTable(dashboardData.transactions || []);
    
    // Update investments list
    updateInvestmentsList(dashboardData.investments || []);
    
    // Add sync status indicator if applicable
    const syncStatusElem = document.querySelector('.sync-status');
    if (syncStatusElem) {
        if (dashboardData.usingCachedData) {
            syncStatusElem.textContent = 'Using cached data';
            syncStatusElem.className = 'sync-status cached';
        } else {
            syncStatusElem.textContent = 'Data synced';
            syncStatusElem.className = 'sync-status synced';
            
            // Hide after a few seconds
            setTimeout(() => {
                syncStatusElem.classList.add('hiding');
            }, 3000);
        }
    }
    
    // ...rest of existing code...
}

// Modified selectTrader function to improve cross-device sync
function selectTrader(traderId) {
    console.log(`Selected trader with ID: ${traderId}`);
    
    // Find the trader card based on the trader ID
    const traderCard = document.querySelector(`.trader-card button[data-trader-id="${traderId}"]`).closest('.trader-card');
    if (!traderCard) {
        console.error('Trader card not found for ID:', traderId);
        showNotification('error', 'Error selecting trader. Please try again.');
        return;
    }
    
    const traderName = traderCard.querySelector('h4').textContent;
    const traderSpec = traderCard.querySelector('.trader-spec').textContent;
    const traderImg = traderCard.querySelector('.trader-avatar img').src;
    
    // Show a more informative notification that mentions syncing across devices
    showNotification('success', 
        `You have selected ${traderName} as your trader. This selection will sync to your other devices when they're online.`);
    
    // Prepare selected trader data
    const selectedTrader = {
        id: traderId,
        name: traderName,
        spec: traderSpec,
        img: traderImg,
        performance: getTraderPerformance(traderId),
        selected: new Date().toISOString()  // Add timestamp for tracking
    };
    
    // Save selection to localStorage as backup
    localStorage.setItem('selectedTrader', JSON.stringify(selectedTrader));
    
    // Use Promise.allSettled instead of Promise.all to better handle partial success
    Promise.allSettled([
        saveSelectedTrader(selectedTrader),
        updateActiveTraderCount(1)
    ])
    .then(results => {
        const selectionSaved = results[0].status === 'fulfilled' && results[0].value;
        const countUpdated = results[1].status === 'fulfilled' && results[1].value;
        
        if (selectionSaved && countUpdated) {
            console.log('Trader selection and count saved successfully');
        } else {
            console.warn('Some operations failed when selecting trader:', 
                         selectionSaved ? '' : 'Failed to save selection',
                         countUpdated ? '' : 'Failed to update count');
                         
            // Show warning only if server update failed
            if (!selectionSaved) {
                showNotification('warning', 
                    'Trader selected locally, but changes may not appear on other devices until your connection improves.');
            }
        }
        
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
            updateTopTraders(selectedTrader);
            
            // Force refresh dashboard data to ensure changes are reflected, but don't use cache
            fetchDashboardData(true).then(updateDashboardUI)
                .catch(err => console.warn('Failed to refresh data after trader selection:', err));
        }, 1500);
    })
    .catch(error => {
        console.error('Error in trader selection process:', error);
        
        // More specific error message
        showNotification('warning', 
            'Trader selected locally, but there was an issue saving your preference to the server. Your selection may not sync across devices.');
    });
}

// Update the top traders section in overview with enhanced styling
function updateTopTraders(trader) {
    const topTradersContainer = document.querySelector('.top-traders');
    if (!topTradersContainer) return;
    
    // Clear the "no traders selected" message
    topTradersContainer.innerHTML = '';
    
    // Create the trader element with enhanced styling
    const traderElement = document.createElement('div');
    traderElement.className = 'top-trader-item';
    
    traderElement.innerHTML = `
        <div class="trader-item-header">
            <div class="trader-item-avatar">
                <img src="${trader.img}" alt="${trader.name}">
                <span class="trader-status online"></span>
            </div>
            <div class="trader-item-info">
                <div class="trader-item-name">${trader.name}</div>
                <div class="trader-item-spec">${trader.spec}</div>
                <div class="trader-item-performance" style="color: #4CD964">${trader.performance}</div>
            </div>
        </div>
        <div class="trader-item-actions">
            <button class="btn-small btn-success">Active</button>
            <button class="btn-small btn-outline view-profile">View Profile</button>
        </div>
    `;
    
    topTradersContainer.appendChild(traderElement);
    
    // Add event listener to view profile button
    const viewProfileBtn = traderElement.querySelector('.view-profile');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function() {
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
                <p>Selected ${trader.name} as your trader</p>
            </div>
        `;
        timeline.prepend(li);
    }
}

// Check for previously selected trader on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add this to the existing DOMContentLoaded function or call it from there
    const storedTrader = localStorage.getItem('selectedTrader');
    if (storedTrader) {
        try {
            const trader = JSON.parse(storedTrader);
            // Update UI with stored trader after a short delay to ensure DOM is ready
            setTimeout(() => {
                updateTopTraders(trader);
                updateActiveTraderCount(1);
            }, 500);
        } catch (e) {
            console.error('Error parsing stored trader:', e);
        }
    }
});

// Function to show notifications
function showNotification(type, message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = `notification ${type}`;
        document.body.appendChild(notification);
    } else {
        notification.className = `notification ${type}`;
    }
    
    // Set notification content
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Add close button event listener
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
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

// Array of motivational investment messages
const motivationalMessages = [{
        title: "Compound Interest Magic",
        message: "The earlier you invest, the more time your money has to grow. Small investments today can lead to significant returns tomorrow.",
        icon: "chart-line"
    },
    {
        title: "Diversify Your Portfolio",
        message:"Spread your investments across different assets to minimize risk and maximize potential returns.",
        icon: "chart-pie"
    },
    {
        title: "Market Opportunity",
        message: "The best time to invest was yesterday. The second best time is today. Don't miss out on potential growth.",
        icon: "arrow-trend-up"
    },
    {
        title: "Long-term Perspective",
        message: "The stock market has historically provided around 7% annual returns. Patience is key to successful investing.",
        icon: "clock"
    },
    {
        title: "Dollar-Cost Averaging",
        message: "Consistent regular investments can help reduce the impact of market volatility on your portfolio.",
        icon: "calendar-check"
    },
    {
        title: "Take Action Today",
        message: "Don't wait for the 'perfect time' to invest. Time in the market beats timing the market.",
        icon: "rocket"
    }, 
    {
        title: "Professional Management",
        message: "Our expert traders have consistently outperformed market averages. Let them work for you.",
        icon: "user-tie"
    },
    {
        title: "Financial Freedom",
        message: "Every investment you make today is a step toward your future financial independence.",
        icon: "hand-holding-dollar"
    },
    {
        title: "Wealth Building",
        message: "Wealth is built gradually through consistent investing and compounding returns over time.",
        icon: "building"
    },
    {
        title: "Risk Management",
        message: "Our professional traders use sophisticated strategies to protect your capital while seeking growth.",
        icon: "shield"
    }
];

let currentMessageIndex = 0;
let messageRotationInterval;

// Function to toggle motivational widget
function toggleMotivationalWidget() {
    // Check if widget already exists
    let widget = document.querySelector('.motivational-widget');
    
    // If widget exists, close it
    if (widget) {
        closeMotivationalWidget();
        return;
    }
    
    // Create the widget
    widget = document.createElement('div');
    widget.className = 'motivational-widget';
    widget.innerHTML = `
        <div class="widget-header">
            <h4>Investment Insights</h4>
            <button class="widget-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="widget-content">
            <div class="message-container"></div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(widget);
    
    // Display first message
    displayCurrentMessage();
    
    // Add close button event listener
    widget.querySelector('.widget-close').addEventListener('click', closeMotivationalWidget);
    
    // Start rotating messages every 5 seconds
    messageRotationInterval = setInterval(rotateMessage, 5000);
    
    // Add event listener to close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 10);
    
    // Add animation class
    setTimeout(() => {
        widget.classList.add('active');
    }, 10);
    
    // Reset notification badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = '0';
    }
}

// Function to close motivational widget
function closeMotivationalWidget() {
    const widget = document.querySelector('.motivational-widget');
    if (widget) {
        widget.classList.remove('active');
        
        // Remove widget after animation completes
        setTimeout(() => {
            if (widget.parentNode) {
                widget.parentNode.removeChild(widget);
            }
        }, 300);
        
        // Clear the message rotation interval
        if (messageRotationInterval) {
            clearInterval(messageRotationInterval);
        }
        
        // Remove document click event listener
        document.removeEventListener('click', handleOutsideClick);
    }
}

// Handle clicks outside the widget to close it
function handleOutsideClick(event) {
    const widget = document.querySelector('.motivational-widget');
    const notificationIcon = document.querySelector('.notification-icon');
    
    if (widget && !widget.contains(event.target) && !notificationIcon.contains(event.target)) {
        closeMotivationalWidget();
    }
}

// Display current motivational message
function displayCurrentMessage() {
    const messageContainer = document.querySelector('.message-container');
    if (!messageContainer) return;
    
    const message = motivationalMessages[currentMessageIndex];
    
    // Create message element with animation
    const messageElement = document.createElement('div');
    messageElement.className = 'motivational-message';
    messageElement.innerHTML = `
        <div class="message-icon">
            <i class="fas fa-${message.icon}"></i>
        </div>
        <div class="message-text">
            <h5>${message.title}</h5>
            <p>${message.message}</p>
        </div>
    `;
    
    // Clear previous messages
    messageContainer.innerHTML = '';
    messageContainer.appendChild(messageElement);
    
    // Add animation
    setTimeout(() => {
        messageElement.classList.add('active');
    }, 10);
}

// Rotate through messages
function rotateMessage() {
    const messageElement = document.querySelector('.motivational-message');
    if (!messageElement) return;
    
    // Remove current message with animation
    messageElement.classList.add('fade-out');
    
    setTimeout(() => {
        // Update index to next message
        currentMessageIndex = (currentMessageIndex + 1) % motivationalMessages.length;
        
        // Display next message
        displayCurrentMessage();
    }, 300);
}

// New function to specifically initialize trader detail buttons
function initTraderDetailButtons() {
    console.log('Initializing trader detail buttons');
    
    // Add event listeners for trader "More Info" buttons
    document.querySelectorAll('.btn-more-info').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default button behavior
            const traderId = this.getAttribute('data-trader-id');
            console.log(`More Info button clicked for trader ID: ${traderId}`);
            showTraderDetails(traderId);
        });
    });
    
    // Add event listeners for trader selection buttons
    document.querySelectorAll('.btn-select-trader').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default button behavior
            const traderId = this.getAttribute('data-trader-id');
            selectTrader(traderId);
        });
    });
    
    // Add event listeners to close trader details modal
    document.querySelectorAll('.close-trader-details').forEach(button => {
        button.addEventListener('click', closeTraderDetailsModal);
    });
    
    // Add event listener for Select Trader button in the trader details modal
    const traderProfileSelect = document.getElementById('trader-profile-select');
    if (traderProfileSelect) {
        traderProfileSelect.addEventListener('click', function() {
            const traderId = this.getAttribute('data-trader-id');
            closeTraderDetailsModal();
            selectTrader(traderId);
        });
    }
    
    console.log('Trader detail buttons initialized');
}

// Add this function near the top of the file, after DOMContentLoaded
// This will periodically check for updates from the server
function setupDataSyncMechanism() {
    console.log('Setting up data synchronization mechanism');
    
    // Check for updates every 30 seconds
    const syncInterval = setInterval(async () => {
        try {
            // Only perform sync if we're on the dashboard
            if (document.visibilityState === 'visible') {
                console.log('Running background data sync');
                
                // Fetch latest data without using cache
                const latestData = await fetchDashboardData(true);
                if (latestData) {
                    // Update UI with fresh data
                    updateDashboardUI(latestData);
                    
                    // Update localStorage with the freshest data
                    localStorage.setItem('dashboardData', JSON.stringify(latestData));
                    
                    // Update last sync timestamp
                    localStorage.setItem('lastDataSync', new Date().toISOString());
                    
                    console.log('Background sync completed successfully');
                }
            }
        } catch (error) {
            console.warn('Background sync failed:', error);
            // Don't show notification for background sync failure
        }
    }, 30000);
    
    // Clear interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        clearInterval(syncInterval);
    });
    
    // Force sync when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Tab became visible, forcing sync');
            fetchDashboardData(true)
                .then(data => {
                    if (data) {
                        updateDashboardUI(data);
                        localStorage.setItem('dashboardData', JSON.stringify(data));
                        localStorage.setItem('lastDataSync', new Date().toISOString());
                    }
                })
                .catch(err => console.warn('Visibility change sync failed:', err));
        }
    });
}

// Show a connection error notification with more diagnostic info
function showConnectionErrorNotification() {
    const connectionInfo = navigator.connection ? 
        `Type: ${navigator.connection.effectiveType}, Downlink: ${navigator.connection.downlink} Mbps` :
        'Connection info not available';
    
    console.warn(`Connection issue detected. ${connectionInfo}`);
    showNotification('warning', 
        'Having trouble connecting to the server. Your changes may not be saved across devices.', 
        8000); // Show for longer time
}

// Improved function to update active trader count
async function updateActiveTraderCount(count) {
    // Update UI immediately
    const activeTradersStat = document.querySelector('.stat-card:nth-child(4) .stat-info p');
    if (activeTradersStat) {
        activeTradersStat.textContent = count.toString();
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found, cannot update active trader count');
            return false;
        }
        
        console.log('Updating active trader count to:', count);
        
        // Try both endpoints to ensure the data is updated
        const promises = [
            fetch('/api/financial/dashboard', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    activeTraders: count
                })
            }),
            fetch('/api/user/financial-data', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    activeTraders: count
                })
            })
        ];
        
        // Wait for both to complete - even if one fails
        const results = await Promise.allSettled(promises);
        
        // Check if at least one succeeded
        const anySuccess = results.some(result => result.status === 'fulfilled' && result.value.ok);
        
        if (!anySuccess) {
            console.error('Failed to update active trader count on server');
            return false;
        }
        
        console.log('Active trader count updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating active traders count:', error);
        return false;
    }
}

// Helper function to get trader performance
function getTraderPerformance(traderId) {
    const trader = traderDetails[traderId];
    if (!trader || !trader.performance) {
        return 'N/A';
    }
    // Return monthly performance as it's the most prominently displayed metric
    return trader.performance.monthly;
}