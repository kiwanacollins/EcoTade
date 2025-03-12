#!/bin/bash

# Make the script executable
chmod +x "$0"

echo "=== MongoDB Health Check Script ==="

# Check if MongoDB container is running
echo "1. Checking if MongoDB container is running..."
if docker ps | grep -q mongodb; then
  echo "   ✅ MongoDB container is running"
  CONTAINER_ID=$(docker ps | grep mongodb | awk '{print $1}')
  echo "   Container ID: $CONTAINER_ID"
else
  echo "   ❌ MongoDB container is NOT running"
  echo "   Checking if container exists but is stopped..."
  if docker ps -a | grep -q mongodb; then
    echo "   Container exists but is stopped. Trying to start it..."
    docker start mongodb
    sleep 5
    if docker ps | grep -q mongodb; then
      echo "   ✅ MongoDB container successfully started"
    else
      echo "   ❌ Failed to start MongoDB container"
    fi
  else
    echo "   ❌ MongoDB container doesn't exist"
  fi
fi

# Get container port mapping
echo "2. Checking port mapping..."
PORT_MAPPING=$(docker port mongodb 2>/dev/null | grep 27017 || echo "Not available")
echo "   Port mapping: $PORT_MAPPING"

# Check container logs for errors
echo "3. Checking container logs for errors..."
docker logs --tail 20 mongodb 2>&1 | grep -i "error\|fail\|exception"

# Try to connect to MongoDB using mongosh
echo "4. Testing MongoDB connection..."
echo "   Attempting to ping MongoDB from inside the container..."
if docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" admin -u admin -p password 2>/dev/null; then
  echo "   ✅ MongoDB ping successful"
else
  echo "   ❌ MongoDB ping failed"
  echo "   This could be due to authentication issues or MongoDB not being ready"
fi

# Check if PM2 has the correct environment variables
echo "5. Checking PM2 environment variables..."
PM2_ENV=$(pm2 env forexprox 2>/dev/null)
echo "   PM2 MONGODB_URI set: $(echo "$PM2_ENV" | grep -c MONGODB_URI)"

# Write a test file to verify connection outside of the main app
echo "6. Creating a MongoDB test script..."
cat > test-mongodb-connection.js <<EOL
const { MongoClient } = require('mongodb');

// Get URI from environment or use default
const uri = process.env.MONGODB_URI || "mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin";
console.log('Testing connection to:', uri.replace(/\/\/.*:.*@/, '//USER:PASS@'));

async function main() {
  console.log('Attempting to connect...');
  const client = new MongoClient(uri, { connectTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB!');
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ping: 1 });
    console.log('✅ Ping result:', result);
    await client.close();
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

main();
EOL

echo "   Test script created. Run with:"
echo "   MONGODB_URI='mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin' node test-mongodb-connection.js"

echo "=== Health check complete ==="
