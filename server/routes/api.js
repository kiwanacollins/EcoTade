const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { User } = require('../models'); // Fixed import to use models index

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const financialRoutes = require('./financial.routes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/financial', financialRoutes); // Changed from /payments to /financial

// API health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running'
  });
});

// Get user's financial data
router.get('/user/financial-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('financialData');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.financialData || {
      totalBalance: 0,
      profit: 0,
      activeTrades: 0,
      activeTraders: 0,
      selectedTrader: null,
      transactions: [],
      investments: []
    });
  } catch (err) {
    console.error('Error fetching financial data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user's financial data
router.put('/user/financial-data', authMiddleware, async (req, res) => {
  try {
    const { 
      totalBalance, 
      profit, 
      activeTrades, 
      activeTraders,
      selectedTrader,
      transactions,
      investments
    } = req.body;
    
    // Find user and update financial data
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize financial data if it doesn't exist
    if (!user.financialData) {
      user.financialData = {};
    }
    
    // Update only the fields that are provided
    if (totalBalance !== undefined) user.financialData.totalBalance = totalBalance;
    if (profit !== undefined) user.financialData.profit = profit;
    if (activeTrades !== undefined) user.financialData.activeTrades = activeTrades;
    if (activeTraders !== undefined) user.financialData.activeTraders = activeTraders;
    if (selectedTrader !== undefined) user.financialData.selectedTrader = selectedTrader;
    if (transactions !== undefined) user.financialData.transactions = transactions;
    if (investments !== undefined) user.financialData.investments = investments;
    
    await user.save();
    
    res.json(user.financialData);
  } catch (err) {
    console.error('Error updating financial data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
