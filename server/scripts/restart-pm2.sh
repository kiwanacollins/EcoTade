#!/bin/bash

# First ensure MongoDB is running
echo "Ensuring MongoDB container is running..."
bash ../start-mongodb.sh

# Display current PM2 status
echo "Current PM2 status:"
pm2 status

# MongoDB Docker connection string (using localhost since we're connecting from host)
MONGODB_URI="mongodb://admin:password@localhost:27017/forexproxdb?authSource=admin"

# Stop existing process if running
pm2 stop forexprox 2>/dev/null || true

# Set environment variables at the PM2 level
echo "Setting MongoDB connection string..."
pm2 set MONGODB_URI $MONGODB_URI

# Export the variable to the current environment as well
export MONGODB_URI=$MONGODB_URI

# Check if ecosystem file exists
if [ -f "ecosystem.config.js" ]; then
    echo "Starting with ecosystem.config.js"
    pm2 start ecosystem.config.js --update-env
else 
    echo "Starting directly with server.js"
    pm2 start server.js --name forexprox --env-var "MONGODB_URI=$MONGODB_URI" --env-var "NODE_ENV=production"
fi

# Check if process started successfully
echo "PM2 status after restart:"
pm2 status

# Save PM2 configuration so it persists after system reboot
pm2 save

# Generate startup script if not already done
if ! pm2 startup list | grep -q "active"; then
    echo "Generating PM2 startup script..."
    pm2 startup
fi

echo "Done! Check the logs with: pm2 logs forexprox"
