const User = require('../models/User');

// Get user's financial dashboard data with improved error handling
exports.getDashboard = async (req, res) => {
  try {
    console.log(`Fetching dashboard data for user ${req.user.id}`);
    
    const user = await User.findById(req.user.id).select('financialData');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Ensure we have default values for all key properties
    const financialData = user.financialData || {};
    
    // Create safe response object with all required fields
    const safeResponse = {
      success: true,
      data: {
        totalBalance: financialData.balance || 0,
        profit: financialData.profit || 0,
        trades: financialData.trades || [],
        payments: financialData.payments || [],
        dailyProfit: financialData.dailyProfit || 0,
        dailyLoss: financialData.dailyLoss || 0,
        activeTrades: financialData.activeTrades || 0,
        activeTraders: financialData.activeTraders || 0,
        selectedTrader: financialData.selectedTrader || null
      }
    };
    
    res.json(safeResponse);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching dashboard data', 
      error: err.message 
    });
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

// Save selected trader with improved error handling
exports.saveSelectedTrader = async (req, res) => {
  try {
    const { traderId, traderName, traderSpec, traderImg, traderPerformance } = req.body;
    
    if (!traderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trader ID is required'
      });
    }
    
    // Log the payload for debugging
    console.log('Saving trader selection with data:', {
      userId: req.user.id,
      traderId,
      traderName: traderName || '[not provided]',
      hasSpec: !!traderSpec,
      hasImage: !!traderImg
    });
    
    // Find user and update with proper error handling
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
    
    // Store both traderId and extended trader data for better resilience
    user.financialData.selectedTrader = {
      id: traderId,
      name: traderName || 'Selected Trader',
      spec: traderSpec || 'Trading Expert',
      img: traderImg || '',
      performance: traderPerformance || '+0%',
      selectedAt: new Date()
    };
    
    // Increment active traders count or set to 1 if not present
    // Only increment if the trader is different than the previous one
    const previousTraderId = user.financialData.selectedTrader?.id;
    if (!previousTraderId || previousTraderId !== traderId) {
      user.financialData.activeTraders = (user.financialData.activeTraders || 0) + 1;
    }
    
    // Wrap the save operation in try/catch for more detailed error handling
    try {
      await user.save();
      
      // Send successful response
      return res.json({
        success: true,
        message: 'Trader selected successfully',
        data: {
          selectedTrader: user.financialData.selectedTrader,
          activeTraders: user.financialData.activeTraders
        }
      });
    } catch (saveError) {
      console.error('Database save error:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Database error when saving trader selection',
        error: saveError.message
      });
    }
  } catch (err) {
    console.error('Error in saveSelectedTrader controller:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error processing trader selection',
      error: err.message
    });
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
      message: 'Payment proof received successfully, Your balance will be updated shortly.',
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

// Update daily profit and loss values
exports.updateDailyProfitLoss = async (req, res) => {
  try {
    const result = await exports.scheduledDailyUpdate();
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error updating daily profit/loss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily profit/loss values',
      error: error.message
    });
  }
};

// Scheduled task helper function to update daily values
exports.scheduledDailyUpdate = async () => {
  try {
    console.log('Starting scheduled daily profit/loss update');
    
    // Import the User model
    const User = require('../models/User');
    
    // Find all users
    const users = await User.find();
    
    console.log(`Found ${users.length} users for daily update`);
    
    // Initialize counters for statistics
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Get current financial data
        const financialData = user.financialData || {};
        
        // Calculate daily profit based on balance and a daily rate
        // In a real system, you would calculate this based on actual trading performance
        // Here we're using a simplified approach with randomization to simulate trading volatility
        
        // Base rate (0.5% to 2% of total balance)
        const baseRate = (Math.random() * 1.5 + 0.5) / 100;
        // Use balance instead of totalBalance which doesn't exist in the schema
        const balance = financialData.balance || 0;
        
        // Calculate daily profit - can be positive or negative
        const dailyProfitRate = Math.random() > 0.4 ? baseRate : -baseRate;
        const dailyProfit = balance * dailyProfitRate;
        
        // Daily loss is calculated as a percentage of the balance (0.05% to 0.35%)
        // This represents maximum drawdown risk
        const maxDailyLossRate = (Math.random() * 0.3 + 0.05) / 100;
        const dailyLoss = balance * maxDailyLossRate;
        
        // Update financial data - making sure we don't lose existing data
        if (!user.financialData) {
          user.financialData = {};
        }
        
        // Update the dailyProfit and dailyLoss fields
        user.financialData.dailyProfit = parseFloat(dailyProfit.toFixed(2));
        user.financialData.dailyLoss = parseFloat(dailyLoss.toFixed(2));
        
        // Save the updated user
        await user.save();
        updatedCount++;
      } catch (error) {
        console.error(`Error updating daily values for user ${user._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Daily profit/loss update completed. Updated: ${updatedCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      updated: updatedCount,
      errors: errorCount,
      total: users.length
    };
  } catch (error) {
    console.error('Error in scheduledDailyUpdate:', error);
    throw error;
  }
};
