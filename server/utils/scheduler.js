/**
 * Financial Data Scheduler
 * This module schedules regular updates of financial data for all users
 * It uses node-cron to schedule tasks at specific times
 */

// Note: You'll need to install the node-cron package with:
// npm install --save node-cron

const cron = require('node-cron');
const { scheduledDailyUpdate } = require('../controllers/financial.controller');

/**
 * Initialize all scheduled financial tasks
 */
const initScheduler = () => {
  console.log('Initializing financial data scheduler...');
  
  // Schedule daily profit/loss update at 00:01 every day (server time)
  // Format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) weekday(0-6)
  cron.schedule('0 1 0 * * *', async () => {
    console.log('Running scheduled daily profit/loss update...');
    
    try {
      const result = await scheduledDailyUpdate();
      console.log(`Daily profit/loss update completed: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Error during scheduled daily profit/loss update:', error);
    }
  });
  
  console.log('Financial data scheduler initialized');
};

module.exports = {
  initScheduler
};