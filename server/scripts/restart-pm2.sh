#!/bin/bash

# First ensure MongoDB is running
echo "Ensuring MongoDB container is running..."
if [ -f "../start-mongodb.sh" ]; then
  bash ../start-mongodb.sh
else
  echo "MongoDB start script not found, skipping"
fi

# Display current PM2 status
echo "Current PM2 status:"
pm2 status

# MongoDB Docker connection string (using localhost since we're connecting from host)
# Note the updated port to 27018
MONGODB_URI="mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin"

# Stop existing process if running
pm2 stop forexprox 2>/dev/null || true

# Set environment variables at the PM2 level
echo "Setting MongoDB connection string..."
pm2 set MONGODB_URI $MONGODB_URI

# Export the variable to the current environment as well
export MONGODB_URI=$MONGODB_URI

# First, directly create a .env file to ensure variables are properly set
echo "Creating/updating .env file..."
cat > ../.env <<EOL
MONGODB_URI=$MONGODB_URI
NODE_ENV=production
PORT=5000
EOL

echo "Environment file created:"
cat ../.env

# Check if ecosystem file exists
if [ -f "../ecosystem.config.js" ]; then
    echo "Starting with ecosystem.config.js"
    cd ..
    pm2 start ecosystem.config.js --update-env
else 
    echo "Starting directly with server.js"
    cd ..
    pm2 start server.js --name forexprox \
      --env-var "MONGODB_URI=$MONGODB_URI" \
      --env-var "NODE_ENV=production" \
      --env-var "PORT=5000"
fi

# Check if process started successfully
echo "PM2 status after restart:"
pm2 status

# Save PM2 configuration so it persists after system reboot
pm2 save

echo "Done! Check the logs with: pm2 logs forexprox"
