/**
 * Cryptocurrency Exchange API Integration
 * This file handles fetching crypto exchange rates and conversions
 * Limited to Bitcoin and Ethereum only
 */

const cryptoExchange = {
    // Base URL for the exchange rate API
    baseUrl: 'https://api.coingecko.com/api/v3',
    
    // Get the current price of a cryptocurrency in USD
    async getPrice(cryptoId) {
        try {
            const response = await fetch(`${this.baseUrl}/simple/price?ids=${cryptoId}&vs_currencies=usd`);
            const data = await response.json();
            return data[cryptoId]?.usd;
        } catch (error) {
            console.error('Error fetching crypto price:', error);
            return null;
        }
    },
    
    // Convert USD to cryptocurrency amount
    async convertUsdToCrypto(usdAmount, cryptoId) {
        const price = await this.getPrice(cryptoId);
        if (!price) return null;
        
        return usdAmount / price;
    },   
    // Convert cryptocurrency to USD amount
    async convertCryptoToUsd(cryptoAmount, cryptoId) {
        const price = await this.getPrice(cryptoId);
        if (!price) return null;
        
        return cryptoAmount * price;
    },
    
    // Get cryptocurrency symbols and icons
    getCryptoInfo() {
        return {
            bitcoin: {
                name: 'Bitcoin',
                symbol: 'BTC',
                icon: '₿',
                apiId: 'bitcoin',
                confirmations: 1,
                averageTime: '~10 minutes',
                network: 'Bitcoin Network'
            },
            ethereum: {
                name: 'Ethereum',
                symbol: 'ETH',
                icon: 'Ξ',
                apiId: 'ethereum',
                confirmations: 10,
                averageTime: '~5 minutes',
                network: 'Ethereum Network'
            }
        };
    },
    
    // Generate a unique payment reference ID
    generatePaymentId() {
        return 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    },
    
    // Format crypto amount with appropriate precision
    formatCryptoAmount(amount, symbol) {
        if (symbol === 'BTC') {
            return amount.toFixed(8);
        } else if (symbol === 'ETH') {
            return amount.toFixed(6);
        } else {
            return amount.toFixed(2);
        }
    },
    
    // Get supported cryptocurrencies
    getSupportedCryptocurrencies() {
        return ['bitcoin', 'ethereum'];
    },
    
    // Check if a cryptocurrency is supported
    isCryptoSupported(cryptoId) {
        return this.getSupportedCryptocurrencies().includes(cryptoId);
    }
};

// Add to global scope
window.cryptoExchange = cryptoExchange;
