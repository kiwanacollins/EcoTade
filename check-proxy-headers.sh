#!/bin/bash

echo "=== Proxy Configuration Check ==="

# Function to make a curl request and inspect headers
check_headers() {
  local url=$1
  echo "Checking headers for: $url"
  
  # Make a curl request with verbose option to see all headers
  curl -v -X OPTIONS $url \
    -H "Origin: https://forexprox.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type, Authorization" \
    2>&1 | grep -i "access-control"
  
  echo ""
}

# Check the server directly
echo "1. Checking direct server request:"
check_headers "https://srv749600.hstgr.cloud/api/health"

echo "=== Check Complete ==="
echo ""
echo "If you see multiple 'access-control-allow-origin' headers in the response,"
echo "your proxy server (like Nginx or Apache) might be adding duplicate headers."
echo "Check your proxy server configuration files for CORS settings."
