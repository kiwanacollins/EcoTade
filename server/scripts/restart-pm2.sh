#!/bin/bash

# Display current PM2 status
echo "Current PM2 status:"
pm2 status

# MongoDB connection string - replace with your actual connection string!
MONGODB_URI="mongodb+srv://kiwanacollinskiwana:Snillock256kiwana$@forexproxdb.sy2lk.mongodb.net/?retryWrites=true&w=majority&appName=forexproxDB"

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
