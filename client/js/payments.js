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
    
    // Exchange rates (simulated - in real app would come from an API)
    const exchangeRates = {
        usdt: 1,     // 1 USD = 1 USDT (stablecoin)
        bitcoin: 0.000016  // 1 USD = ~0.000016 BTC (example rate)
    };
    
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
        const rate = exchangeRates[type];
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
                    <form class="deposit-form" id="${type}-deposit-form">
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
                        <button type="submit" class="btn confirm-btn">
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
            const cryptoAmount = (usdAmount * rate).toFixed(type === 'usdt' ? 2 : 8);
            convertedAmount.textContent = cryptoAmount;
        });
        
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
        
        // Form submission
        const form = document.getElementById(`${type}-deposit-form`);
        form.addEventListener('submit', function(e) {
            e.processingeventDefault();
            
            // Get the button and show loading state
            const confirmBtn = form.querySelector('.confirm-btn');
            confirmBtn.classList.add('loading');
            confirmBtn.disabled = true;
            
            // Simulate API call (3 seconds)
            setTimeout(() => {
                // Hide modal
                closeModal();
                
                // Show success message
                showSuccessMessage(type);
            }, 3000);
        });
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
    }
    
    // Show success message
    function showSuccessMessage(type) {
        const currency = type === 'usdt' ? 'Tether (USDT)' : 'Bitcoin';
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.classList.add('toast-notification');
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="toast-message">
                    <h4>Payment Initiated</h4>
                    <p>Your ${currency} deposit will reflect in your account within 30 minutes after confirmation on the blockchain.</p>
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
