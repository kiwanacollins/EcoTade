const User = require('../models/User');

// Get user's financial dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('financialData');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user.financialData || {
        balance: 0,
        profit: 0,
        trades: [],
        payments: []
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update user's financial dashboard data
exports.updateDashboard = async (req, res) => {
  try {
    const { balance, profit, trades } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Initialize financial data if it doesn't exist
    if (!user.financialData) {
      user.financialData = {};
    }
    
    // Update only the fields that are provided
    if (balance !== undefined) user.financialData.balance = balance;
    if (profit !== undefined) user.financialData.profit = profit;
    if (trades !== undefined) user.financialData.trades = trades;
    
    await user.save();
    
    res.json({
      success: true,
      data: user.financialData
    });
  } catch (err) {
    console.error('Error updating dashboard data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Save selected trader
exports.saveSelectedTrader = async (req, res) => {
  try {
    const { traderId } = req.body;
    
    if (!traderId) {
      return res.status(400).json({ success: false, message: 'Trader ID is required' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Initialize financial data if it doesn't exist
    if (!user.financialData) {
      user.financialData = {};
    }
    
    user.financialData.selectedTrader = traderId;
    await user.save();
    
    res.json({
      success: true,
      message: 'Trader selected successfully',
      data: { selectedTrader: traderId }
    });
  } catch (err) {
    console.error('Error saving selected trader:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Process payment proof (this will be called by the file upload route)
exports.processPaymentProof = async (req, res) => {
  try {
    // This function would typically:
    // 1. Save payment data to the database
    // 2. Update user's payment history
    // 3. Handle any additional business logic
    
    // For now, we'll just return a success response
    // The actual file upload is handled by multer middleware in the route
    
    res.json({
      success: true,
      message: 'Payment proof received successfully',
      data: {
        fileInfo: req.file,
        paymentDetails: {
          type: req.body.paymentType,
          amount: req.body.amount,
          timestamp: new Date()
        }
      }
    });
  } catch (err) {
    console.error('Error processing payment proof:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
