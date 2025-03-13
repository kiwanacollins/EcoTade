/**
 * CORS Configuration Checker
 * This script helps diagnose CORS issues by testing the server's configuration
 * 
 * Usage: node check-cors.js
 */

const http = require('http');
const https = require('https');

// Configuration
const SERVER_URL = 'https://forexprox.com'; 
const TEST_ENDPOINTS = [
  '/api/health',
  '/api/auth/me',  // Protected endpoint
];
const TEST_ORIGINS = [
  'https://forexprox.com',
  'http://localhost:3000',
  'https://m.forexprox.com',
  'null',
  // Test with no origin
  undefined
];

console.log('=== CORS Configuration Checker ===');
console.log(`Testing server: ${SERVER_URL}\n`);

async function testCorsConfiguration() {
  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    console.log('--------------------------------------------------');
    
    for (const origin of TEST_ORIGINS) {
      await testWithOrigin(endpoint, origin);
    }
  }
  
  console.log('\n=== CORS Check Complete ===');
  console.log('\nRecommendations:');
  console.log('1. If using credentials: Access-Control-Allow-Origin must be a specific origin (not *)');
  console.log('2. When using a specific origin, it must match the request origin exactly');
  console.log('3. For mobile devices, always use specific origins and enable credentials');
}

async function testWithOrigin(endpoint, origin) {
  console.log(`\nOrigin: ${origin || '(no origin)'}`);
  
  const url = SERVER_URL + endpoint;
  
  // First, test OPTIONS for preflight
  await makeRequest('OPTIONS', url, origin);
  
  // Then test GET
  await makeRequest('GET', url, origin);
}

function makeRequest(method, url, origin) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'CORS-Check-Script/1.0',
        'Accept': 'application/json'
      }
    };
    
    // Add origin header if provided
    if (origin) {
      options.headers['Origin'] = origin;
    }
    
    // Add token for auth endpoints
    if (urlObj.pathname.includes('/auth/')) {
      options.headers['Authorization'] = 'Bearer YOUR_TEST_TOKEN'; // Add a real token if testing auth
    }
    
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    console.log(`Sending ${method} request to ${urlObj.pathname}`);
    
    const req = protocol.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      // Check CORS headers
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      };
      
      console.log('CORS Headers:', JSON.stringify(corsHeaders, null, 2));
      
      // Flag issues
      if (corsHeaders['access-control-allow-credentials'] === 'true' && 
          corsHeaders['access-control-allow-origin'] === '*') {
        console.log('⚠️ ERROR: Cannot use wildcard (*) with credentials!');
      }
      
      if (origin && corsHeaders['access-control-allow-origin'] !== origin && 
          corsHeaders['access-control-allow-origin'] !== '*') {
        console.log('⚠️ ERROR: Origin mismatch! Request origin and allowed origin must match exactly');
      }
      
      if (!corsHeaders['access-control-allow-origin']) {
        console.log('⚠️ ERROR: No Access-Control-Allow-Origin header set');
      }
      
      resolve();
    });
    
    req.on('error', (e) => {
      console.error(`⚠️ Request error: ${e.message}`);
      resolve();
    });
    
    req.end();
  });
}

// Run the tests
testCorsConfiguration();
