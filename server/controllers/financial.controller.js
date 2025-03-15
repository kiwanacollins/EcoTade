const { User } = require('../models');

// @desc    Get user's financial dashboard data
// @route   GET /api/financial/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    // Get user from authenticated request
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return formatted financial data
    return res.status(200).json({
      success: true,
      data: {
        totalBalance: user.financialData?.totalBalance || 0,
        profit: user.financialData?.profit || 0,
        activeTrades: user.financialData?.activeTrades || 0,
        activeTraders: user.financialData?.activeTraders || 0,
        selectedTrader: user.financialData?.selectedTrader || null,
        transactions: user.financialData?.transactions || [],
        investments: user.financialData?.investments || []
      }
    });
  } catch (error) {
    console.error('Error fetching financial dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching financial data'
    });
  }
};

// @desc    Update user's financial dashboard data
// @route   PUT /api/financial/dashboard
// @access  Private
exports.updateDashboard = async (req, res) => {
  try {
    // Get user from authenticated request
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize financialData if it doesn't exist
    if (!user.financialData) {
      user.financialData = {};
    }
    
    const updateData = {};
    
    // Only update fields that are provided in the request
    if (req.body.selectedTrader !== undefined) {
      updateData['financialData.selectedTrader'] = req.body.selectedTrader;
    }
    
    if (req.body.activeTraders !== undefined) {
      updateData['financialData.activeTraders'] = req.body.activeTraders;
    }
    
    if (req.body.totalBalance !== undefined) {
      updateData['financialData.totalBalance'] = req.body.totalBalance;
    }
    
    if (req.body.profit !== undefined) {
      updateData['financialData.profit'] = req.body.profit;
    }
    
    if (req.body.activeTrades !== undefined) {
      updateData['financialData.activeTrades'] = req.body.activeTrades;
    }
    
    // If there's transaction data, add it to the transactions array
    if (req.body.transaction) {
      updateData.$push = { 'financialData.transactions': req.body.transaction };
    }
    
    // If there's investment data, add it to the investments array
    if (req.body.investment) {
      updateData.$push = { 'financialData.investments': req.body.investment };
    }
    
    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true // Validate the update against the schema
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Financial data updated successfully',
      data: {
        totalBalance: updatedUser.financialData?.totalBalance || 0,
        profit: updatedUser.financialData?.profit || 0,
        activeTrades: updatedUser.financialData?.activeTrades || 0,
        activeTraders: updatedUser.financialData?.activeTraders || 0,
        selectedTrader: updatedUser.financialData?.selectedTrader || null
      }
    });
  } catch (error) {
    console.error('Error updating financial dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating financial data'
    });
  }
};

// @desc    Save selected trader
// @route   POST /api/financial/trader
// @access  Private
exports.saveSelectedTrader = async (req, res) => {
  try {
    const { traderId, traderData } = req.body;
    
    if (!traderId && !traderData) {
      return res.status(400).json({
        success: false,
        message: 'Trader ID or trader data is required'
      });
    }
    
    // Get user from authenticated request
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize financialData if it doesn't exist
    if (!user.financialData) {
      user.financialData = {};
    }
    
    // Update selected trader and active traders count
    user.financialData.selectedTrader = traderData || traderId;
    user.financialData.activeTraders = 1; // Set to 1 when a trader is selected
    
    // Save the updated user
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Trader selected successfully',
      data: {
        selectedTrader: user.financialData.selectedTrader,
        activeTraders: user.financialData.activeTraders
      }
    });
  } catch (error) {
    console.error('Error saving selected trader:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving selected trader'
    });
  }
};
