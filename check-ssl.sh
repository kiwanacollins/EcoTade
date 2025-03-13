#!/bin/bash

# Make script executable
chmod +x "$0"

echo "=== SSL Certificate Checker ==="
SERVER="srv749600.hstgr.cloud"

echo "Checking SSL certificate for $SERVER..."
echo ""

echo "1. Attempting OpenSSL connection..."
openssl s_client -connect $SERVER:443 -servername $SERVER </dev/null 2>/dev/null | openssl x509 -text | grep -E "Subject:|DNS:"

echo ""
echo "2. Checking certificate common name..."
echo | openssl s_client -connect $SERVER:443 -servername $SERVER 2>/dev/null | openssl x509 -noout -subject -issuer

echo ""
echo "3. Checking certificate validity dates..."
echo | openssl s_client -connect $SERVER:443 -servername $SERVER 2>/dev/null | openssl x509 -noout -dates

echo ""
echo "=== SSL Check Complete ==="
echo ""
echo "If you see 'CN=' with a different domain than $SERVER, this is the cause of the certificate error."
echo "Options to fix this:"
echo "1. Use HTTP instead of HTTPS temporarily (less secure)"
echo "2. Install a proper SSL certificate for your domain using Let's Encrypt"
echo "3. Use a service like Cloudflare for SSL termination"
