document.addEventListener('DOMContentLoaded', function() {
    // Query deposit buttons
    const usdtDepositBtn = document.querySelector('[data-payment="usdt"]');
    const bitcoinDepositBtn = document.querySelector('[data-payment="bitcoin"]');
    
    // Add event listeners to deposit buttons
    if (usdtDepositBtn) usdtDepositBtn.addEventListener('click', () => openDepositModal('usdt'));
    if (bitcoinDepositBtn) bitcoinDepositBtn.addEventListener('click', () => openDepositModal('bitcoin'));
    
    // Close modal when clicking on overlay or close button
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal-overlay') || 
            event.target.classList.contains('modal-close')) {
            closeModal();
        }
    });
    
    // Exchange rates - will be populated from API
    let exchangeRates = {
        usdt: 1,     // Default fallback (1 USD = 1 USDT)
        bitcoin: 0.000016  // Default fallback
    };
    
    // Track if rates are being updated
    let isUpdatingRates = false;
    let lastUpdateTime = null;
    
    // Track payment screenshot
    let paymentScreenshot = null;
    
    // Fetch real exchange rates from CoinGecko API
    async function fetchExchangeRates() {
        if (isUpdatingRates) {
            console.log("Already fetching rates, skipping duplicate request");
            return false; // Prevent duplicate requests
        }
        
        isUpdatingRates = true;
        
        // Show loading indicator if modal is open
        const rateIndicators = document.querySelectorAll('.rate-loading');
        rateIndicators.forEach(indicator => {
            if (indicator) indicator.style.display = 'inline';
        });
        
        try {
            console.log('Fetching current exchange rates from CoinGecko...');
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd', {
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("CoinGecko API response:", data);
            
            // Calculate rates (inverse of price in USD)
            if (data.bitcoin && data.bitcoin.usd) {
                const btcRate = 1 / data.bitcoin.usd;
                exchangeRates.bitcoin = btcRate;
                console.log(`Updated Bitcoin rate: 1 USD = ${btcRate.toFixed(8)} BTC (from price: ${data.bitcoin.usd} USD)`);
            } else {
                console.warn("Bitcoin price data missing from API response");
            }
            
            if (data.tether && data.tether.usd) {
                const usdtRate = 1 / data.tether.usd;
                exchangeRates.usdt = usdtRate;
                console.log(`Updated USDT rate: 1 USD = ${usdtRate.toFixed(2)} USDT (from price: ${data.tether.usd} USD)`);
            } else {
                console.warn("Tether price data missing from API response");
            }
            
            // Update any open modals with new rates
            updateOpenModalWithCurrentRates();
            
            // Hide loading indicators
            rateIndicators.forEach(indicator => {
                if (indicator) indicator.style.display = 'none';
            });
            
            // Update rate source text with timestamp
            const timestamp = new Date().toLocaleTimeString();
            lastUpdateTime = timestamp;
            const rateSourceElements = document.querySelectorAll('.rate-source');
            rateSourceElements.forEach(el => {
                if (el) el.innerHTML = `(Rate updated at ${timestamp})`;
            });
            
            return true;
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            
            // Hide loading indicators
            rateIndicators.forEach(indicator => {
                if (indicator) indicator.style.display = 'none';
            });
            
            // Update rate source with error message
            const rateSourceElements = document.querySelectorAll('.rate-source');
            rateSourceElements.forEach(el => {
                if (el) el.innerHTML = `(Using default rates - API error)`;
            });
            
            return false;
        } finally {
            isUpdatingRates = false;
        }
    }
    
    // Update open modal with current rates
    function updateOpenModalWithCurrentRates() {
        // Find all open modals
        const openModals = document.querySelectorAll('.deposit-modal');
        
        openModals.forEach(modal => {
            const type = modal.getAttribute('data-type');
            if (!type) return;
            
            const amountInput = document.getElementById(`${type}-amount`);
            const convertedAmount = document.getElementById(`${type}-converted-amount`);
            
            if (amountInput && convertedAmount) {
                const usdAmount = parseFloat(amountInput.value) || 0;
                const cryptoAmount = calculateCryptoAmount(usdAmount, type);
                convertedAmount.textContent = cryptoAmount;
                
                console.log(`Updated conversion: $${usdAmount} = ${cryptoAmount} ${type === 'usdt' ? 'USDT' : 'BTC'}`);
            }
        });
    }
    
    // Calculate crypto amount from USD with proper formatting
    function calculateCryptoAmount(usdAmount, type) {
        if (!usdAmount || isNaN(usdAmount)) return '0';
        
        const rate = exchangeRates[type];
        if (!rate) {
            console.error(`Exchange rate for ${type} not found`);
            return '0';
        }
        
        const cryptoAmount = usdAmount * rate;
        
        // Format with appropriate precision
        if (type === 'usdt') {
            return cryptoAmount.toFixed(2);
        } else {
            return cryptoAmount.toFixed(8);
        }
    }
    
    // Fetch rates when page loads
    fetchExchangeRates();
    
    // Set up a periodic refresh of rates (every 5 minutes)
    setInterval(fetchExchangeRates, 300000);
    
    // QR codes and addresses (placeholder - in real app would come from backend)
    const cryptoAddresses = {
        usdt: {
            address: "TGS2GTjF6Y5JihFfFQ55VgquSjscoKS6rB",
            qrcode: "./images/usdt-qrcode.png"
        },
        bitcoin: {
            address: "1AHWEb9ZWgpsRqzwVTtXBpanoX4bKa7Eef",
            qrcode: "./images/btc-qrcode.png"
        }
    };
    
    // Open deposit modal
    function openDepositModal(type) {
        // Get currency details
        const currency = type === 'usdt' ? 'USDT' : 'Bitcoin';
        const symbol = type === 'usdt' ? 'USDT' : 'BTC';
        const address = cryptoAddresses[type].address;
        const qrImage = cryptoAddresses[type].qrcode;
        
        // Create modal HTML
        const modal = document.createElement('div');
        modal.classList.add('modal-overlay');
        modal.innerHTML = `
            <div class="deposit-modal" data-type="${type}">
                <div class="modal-header">
                    <h3>Deposit with ${currency}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="deposit-form" id="${type}-deposit-form" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="${type}-amount">Amount in USD</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" id="${type}-amount" class="deposit-amount" placeholder="0.00" min="10" required>
                            </div>
                        </div>
                        <div class="conversion-result">
                            <span>You will pay: </span>
                            <strong><span id="${type}-converted-amount">0</span> ${symbol}</strong>
                            <div class="rate-info">
                                <small class="rate-source">${lastUpdateTime ? `(Rate updated at ${lastUpdateTime})` : '(Using default rates)'}</small>
                                <span class="rate-loading" style="display:none;"><i class="fas fa-sync fa-spin"></i></span>
                                <button type="button" class="refresh-rate-btn" data-type="${type}" title="Refresh rates">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="crypto-details">
                            <h4>Send to this ${currency} address</h4>
                            <div class="qr-container">
                                <img src="${qrImage}" alt="${currency} QR Code" class="qr-code" onerror="this.src='./images/qr-placeholder.png'">
                            </div>
                            <div class="address-container">
                                <input type="text" readonly value="${address}" class="crypto-address">
                                <button type="button" class="copy-btn" data-address="${address}">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <div class="payment-notice">
                                <i class="fas fa-info-circle"></i>
                                <p>Please send the exact amount to the address above.</p>
                            </div>
                        </div>
                        
                        <!-- Screenshot Upload Section -->
                        <div class="upload-section" id="${type}-upload-section">
                            <div class="upload-header">
                                <h4>Payment Proof</h4>
                                <span class="required-badge">Required</span>
                            </div>
                            <input type="file" id="${type}-file-input" class="file-input" accept="image/*">
                            <div class="upload-placeholder" id="${type}-upload-placeholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Upload screenshot of your payment</p>
                                <small>Click or drag an image here (JPG, PNG, GIF)</small>
                            </div>
                            <div class="upload-preview" id="${type}-upload-preview">
                                <img src="" alt="Payment screenshot" class="preview-image" id="${type}-preview-image">
                                <div class="preview-actions">
                                    <button type="button" class="remove-btn" id="${type}-remove-file">
                                        <i class="fas fa-trash-alt"></i> Remove
                                    </button>
                                </div>
                            </div>
                            <div class="upload-error" id="${type}-upload-error"></div>
                        </div>
                        
                        <button type="submit" class="btn confirm-btn" id="${type}-confirm-btn" disabled>
                            <span class="btn-text">Confirm Payment</span>
                            <span class="spinner"></span>
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to the page
        document.body.appendChild(modal);
        
        // Add animation class after a small delay for smooth entry
        setTimeout(() => {
            modal.classList.add('active');
            document.querySelector('.deposit-modal').classList.add('active');
        }, 10);
        
        // Setup conversion functionality
        const amountInput = document.getElementById(`${type}-amount`);
        const convertedAmount = document.getElementById(`${type}-converted-amount`);
        
        amountInput.addEventListener('input', function() {
            const usdAmount = parseFloat(this.value) || 0;
            const cryptoAmount = calculateCryptoAmount(usdAmount, type);
            convertedAmount.textContent = cryptoAmount;
        });
        
        // Set initial converted amount if input has a value
        if (amountInput.value) {
            const usdAmount = parseFloat(amountInput.value) || 0;
            const cryptoAmount = calculateCryptoAmount(usdAmount, type);
            convertedAmount.textContent = cryptoAmount;
        }
        
        // Add refresh rates button handler
        const refreshRateBtn = modal.querySelector('.refresh-rate-btn');
        if (refreshRateBtn) {
            refreshRateBtn.addEventListener('click', async function() {
                this.disabled = true;
                this.classList.add('rotating');
                const success = await fetchExchangeRates();
                this.classList.remove('rotating');
                this.disabled = false;
                
                if (success) {
                    // Show a brief success message
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    // Update the conversion immediately with new rates
                    const usdAmount = parseFloat(amountInput.value) || 0;
                    const cryptoAmount = calculateCryptoAmount(usdAmount, type);
                    convertedAmount.textContent = cryptoAmount;
                    
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-sync-alt"></i>';
                    }, 1500);
                } else {
                    // Show error icon
                    this.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-sync-alt"></i>';
                    }, 1500);
                }
            });
        }
        
        // Immediately fetch fresh rates when opening modal
        fetchExchangeRates();
        
        // Setup copy functionality
        const copyBtn = document.querySelector('.copy-btn');
        copyBtn.addEventListener('click', function() {
            const addressToCopy = this.dataset.address;
            navigator.clipboard.writeText(addressToCopy)
                .then(() => {
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy address: ', err);
                });
        });
        
        // Setup dollar sign visibility on focus/blur
        const dollarSign = modal.querySelector('.input-group-text');
        
        // Hide dollar sign on input focus
        amountInput.addEventListener('focus', function() {
            dollarSign.classList.add('hidden');
        });
        
        // Show dollar sign on input blur if input is empty
        amountInput.addEventListener('blur', function() {
            if (!this.value) {
                dollarSign.classList.remove('hidden');
            }
        });
        
        // Setup file upload functionality
        setupFileUpload(type);
        
        // Form submission
        const form = document.getElementById(`${type}-deposit-form`);
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if screenshot is uploaded
            if (!paymentScreenshot) {
                showUploadError(type, 'Please upload a screenshot of your payment');
                return;
            }
            
            // Get the button and show loading state
            const confirmBtn = form.querySelector('.confirm-btn');
            confirmBtn.classList.add('loading');
            confirmBtn.disabled = true;
            
            // Create FormData to handle the file upload
            const formData = new FormData();
            formData.append('paymentType', type);
            formData.append('amount', document.getElementById(`${type}-amount`).value);
            formData.append('screenshot', paymentScreenshot);
            
            // Send to server
            uploadPaymentProof(formData, type);
        });
    }
    
    // Setup file upload functionality
    function setupFileUpload(type) {
        const uploadSection = document.getElementById(`${type}-upload-section`);
        const fileInput = document.getElementById(`${type}-file-input`);
        const uploadPlaceholder = document.getElementById(`${type}-upload-placeholder`);
        const uploadPreview = document.getElementById(`${type}-upload-preview`);
        const previewImage = document.getElementById(`${type}-preview-image`);
        const removeFileBtn = document.getElementById(`${type}-remove-file`);
        const confirmBtn = document.getElementById(`${type}-confirm-btn`);
        const errorDiv = document.getElementById(`${type}-upload-error`);
        
        // Click on placeholder to trigger file input
        uploadPlaceholder.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            handleFileSelection(e.target.files);
        });
        
        // Handle drag and drop
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });
        
        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('dragover');
        });
        
        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                handleFileSelection(e.dataTransfer.files);
            }
        });
        
        // Remove file functionality
        removeFileBtn.addEventListener('click', () => {
            fileInput.value = '';
            uploadPreview.classList.remove('active');
            uploadPlaceholder.style.display = 'flex';
            uploadSection.classList.remove('has-file');
            previewImage.src = '';
            paymentScreenshot = null;
            confirmBtn.disabled = true;
            errorDiv.classList.remove('visible');
        });
        
        // Handle file selection
        function handleFileSelection(files) {
            if (!files.length) return;
            
            const file = files[0];
            
            // Check file type
            if (!file.type.match('image.*')) {
                showUploadError(type, 'Please upload an image file (JPG, PNG, GIF)');
                return;
            }
            
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showUploadError(type, 'File is too large. Please upload an image less than 5MB');
                return;
            }
            
            // Clear previous error
            errorDiv.classList.remove('visible');
            
            // Create file preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                uploadPreview.classList.add('active');
                uploadPlaceholder.style.display = 'none';
                uploadSection.classList.add('has-file');
                paymentScreenshot = file;
                confirmBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Show upload error
    function showUploadError(type, message) {
        const errorDiv = document.getElementById(`${type}-upload-error`);
        errorDiv.textContent = message;
        errorDiv.classList.add('visible');
        
        // Highlight upload section
        const uploadSection = document.getElementById(`${type}-upload-section`);
        uploadSection.style.borderColor = 'var(--danger-color)';
        
        // Reset border after animation
        setTimeout(() => {
            uploadSection.style.borderColor = '';
        }, 2000);
    }
    
    // Upload payment proof to server
    async function uploadPaymentProof(formData, type) {
        try {
            // Define URL based on your API (adjust as needed)
            const apiUrl = '/api/payments/proof-upload';
            
            // Make API call to your server
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - browser will set it with the boundary parameter
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Hide modal
            closeModal();
            
            // Show success message
            showSuccessMessage(type, result.message || 'Your payment proof has been uploaded');
            
        } catch (error) {
            console.error('Error uploading payment proof:', error);
            
            // Find the confirm button and reset loading state
            const confirmBtn = document.querySelector(`#${type}-confirm-btn`);
            if (confirmBtn) {
                confirmBtn.classList.remove('loading');
                confirmBtn.disabled = false;
            }
            
            // Show error in modal
            const errorDiv = document.getElementById(`${type}-upload-error`);
            if (errorDiv) {
                errorDiv.textContent = 'Failed to upload payment proof. Please try again.';
                errorDiv.classList.add('visible');
            }
        }
    }
    
    // Close the modal
    function closeModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300); // Match this with CSS transition time
        }
        
        // Reset payment screenshot
        paymentScreenshot = null;
    }
    
    // Show success message
    function showSuccessMessage(type, customMessage = null) {
        const currency = type === 'usdt' ? 'Tether (USDT)' : 'Bitcoin';
        const message = customMessage || `Your ${currency} deposit will reflect in your account within 30 minutes after confirmation on the blockchain.`;
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.classList.add('toast-notification');
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="toast-message">
                    <h4>Payment Proof Received</h4>
                    <p>${message}</p>
                </div>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Setup close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        // Auto close after 8 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 8000);
    }
});
