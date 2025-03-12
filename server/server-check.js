/**
 * Simple script to check if the server is running correctly
 * Upload this to your VPS and run it to verify configuration
 */

const http = require('http');
const os = require('os');

// Create a simple HTTP server that returns system information
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  
  const info = {
    status: 'running',
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    memory: {
      total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
      free: `${Math.round(os.freemem() / 1024 / 1024)} MB`
    },
    cpus: os.cpus().length,
    network: Object.keys(os.networkInterfaces())
  };
  
  res.end(JSON.stringify(info, null, 2));
});

// Use port 5001 to avoid conflicts with your main server
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server check running on port ${PORT}`);
  console.log(`Visit http://YOUR-VPS-IP:${PORT} to see server info`);
  console.log('Make sure your firewall allows access to this port');
});
