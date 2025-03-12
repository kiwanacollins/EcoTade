#!/bin/bash

# This script directly starts the Node.js application without PM2
# to isolate potential environment variable issues

cd server

# Set the MongoDB URI directly
export MONGODB_URI="mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin"
export NODE_ENV="production"
export PORT=5000

echo "Starting application directly with:"
echo "MONGODB_URI=$MONGODB_URI"
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"

# Start the application
node server.js
