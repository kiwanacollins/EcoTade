/**
 * Error checking utility to diagnose PM2/server issues
 * Run this script to check for errors in your PM2 logs
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PM2_ERROR_LOG = path.join(__dirname, 'logs/pm2-error.log');
const PM2_OUT_LOG = path.join(__dirname, 'logs/pm2-out.log');
const SERVER_ERROR_LOG = path.join(__dirname, 'logs/error.log');

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Read the last n lines of a file
async function readLastLines(filePath, lineCount) {
  if (!fileExists(filePath)) {
    return `File not found: ${filePath}`;
  }

  // Create a read stream for the file
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const lines = [];
  for await (const line of rl) {
    lines.push(line);
    if (lines.length > lineCount) {
      lines.shift();
    }
  }

  return lines.join('\n');
}

async function checkLogs() {
  console.log('Checking for PM2 and server errors...');
  
  // Check PM2 error log
  console.log('\n===== PM2 Error Log =====');
  if (fileExists(PM2_ERROR_LOG)) {
    const pm2Errors = await readLastLines(PM2_ERROR_LOG, 20);
    console.log(pm2Errors || 'No recent errors');
  } else {
    console.log(`PM2 error log not found at ${PM2_ERROR_LOG}`);
  }
  
  // Check PM2 output log
  console.log('\n===== PM2 Output Log =====');
  if (fileExists(PM2_OUT_LOG)) {
    const pm2Output = await readLastLines(PM2_OUT_LOG, 20);
    console.log(pm2Output || 'No recent output');
  } else {
    console.log(`PM2 output log not found at ${PM2_OUT_LOG}`);
  }
  
  // Check server error log
  console.log('\n===== Server Error Log =====');
  if (fileExists(SERVER_ERROR_LOG)) {
    const serverErrors = await readLastLines(SERVER_ERROR_LOG, 20);
    console.log(serverErrors || 'No recent server errors');
  } else {
    console.log(`Server error log not found at ${SERVER_ERROR_LOG}`);
  }
  
  console.log('\nChecking environment...');
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
  
  console.log('\nChecking for required environment variables:');
  const requiredVars = ['PORT', 'MONGODB_URI', 'NODE_ENV'];
  for (const varName of requiredVars) {
    console.log(`${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);
  }
}

checkLogs().catch(console.error);
