const express = require('express');
const router = express.Router();
const { User } = require('../models'); // Import from models index
const auth = require('../middleware/auth');

/**
 * @route   GET /api/financial/dashboard
 * @desc    Get user dashboard financial data
 * @access  Private
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('financialData');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return financial data or default values if not set
    res.json({
      success: true,
      data: user.financialData || {
        totalBalance: 0,
        profit: 0,
        activeTrades: 0,
        activeTraders: 0,
        selectedTrader: null,
        transactions: [],
        investments: []
      }
    });
  } catch (err) {
    console.error('Error fetching financial data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/financial/dashboard
 * @desc    Update user financial data
 * @access  Private
 */
router.put('/dashboard', auth, async (req, res) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request data'
      });
    }
    
    const { 
      totalBalance, 
      profit, 
      activeTrades, 
      activeTraders,
      selectedTrader,
      transactions,
      investments
    } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Initialize financial data if it doesn't exist
    if (!user.financialData) {
      user.financialData = {};
    }
    
    // Only update fields that are provided
    if (totalBalance !== undefined) user.financialData.totalBalance = totalBalance;
    if (profit !== undefined) user.financialData.profit = profit;
    if (activeTrades !== undefined) user.financialData.activeTrades = activeTrades;
    if (activeTraders !== undefined) user.financialData.activeTraders = activeTraders;
    if (selectedTrader !== undefined) user.financialData.selectedTrader = selectedTrader;
    
    // For transactions and investments, handle them more carefully
    if (transactions) {
      // Initialize array if needed
      if (!Array.isArray(user.financialData.transactions)) {
        user.financialData.transactions = [];
      }
      
      // Add new transaction(s)
      if (Array.isArray(transactions)) {
        user.financialData.transactions = [
          ...transactions,
          ...user.financialData.transactions
        ].slice(0, 100); // Limit to last 100 transactions
      } else if (typeof transactions === 'object') {
        // Single transaction object
        user.financialData.transactions.unshift(transactions);
        
        // Trim if needed
        if (user.financialData.transactions.length > 100) {
          user.financialData.transactions = user.financialData.transactions.slice(0, 100);
        }
      }
    }
    
    // Similar handling for investments
    if (investments) {
      if (!Array.isArray(user.financialData.investments)) {
        user.financialData.investments = [];
      }
      
      if (Array.isArray(investments)) {
        // Replace or merge investments
        user.financialData.investments = investments;
      } else if (typeof investments === 'object') {
        // Add single investment
        user.financialData.investments.push(investments);
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: user.financialData
    });
  } catch (err) {
    console.error('Error updating financial data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/financial/deposit
 * @desc    Process a deposit
 * @access  Private
 */
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    // Validate
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid deposit amount'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Initialize financial data if needed
    if (!user.financialData) {
      user.financialData = {
        totalBalance: 0,
        transactions: []
      };
    }
    
    // Create transaction
    const transaction = {
      date: new Date(),
      type: 'Deposit',
      description: `Deposit via ${method || 'account funding'}`,
      amount: parseFloat(amount),
      status: 'Pending'
    };
    
    // Update user data
    if (!Array.isArray(user.financialData.transactions)) {
      user.financialData.transactions = [];
    }
    
    user.financialData.transactions.unshift(transaction);
    
    // Save the user
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Deposit received and pending approval',
      data: transaction
    });
  } catch (err) {
    console.error('Deposit processing error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
