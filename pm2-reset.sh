#!/bin/bash

echo "==== Complete PM2 Reset and Restart ===="

# Stop and delete the PM2 process if it exists
echo "Stopping and removing existing PM2 process..."
pm2 delete forexprox 2>/dev/null || true

# Remove any old environment variables
echo "Clearing PM2 environment variables..."
pm2 delete all 2>/dev/null || true
pm2 cleardump

# Create fresh .env file in the server directory
echo "Creating fresh .env file..."
cat > ./server/.env <<EOL
MONGODB_URI=mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
ALLOWED_ORIGINS=*
EOL

# Also create one in the root directory just to be safe
cat > ./.env <<EOL
MONGODB_URI=mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
ALLOWED_ORIGINS=*
EOL

echo "Starting MongoDB container..."
./start-mongodb.sh

# Verify MongoDB is running
echo "Verifying MongoDB container is running..."
docker ps | grep mongodb

# Start application with PM2
echo "Starting application with PM2..."
cd server
pm2 start server.js --name forexprox \
  --env-var "MONGODB_URI=mongodb://admin:password@localhost:27018/forexproxdb?authSource=admin" \
  --env-var "NODE_ENV=production" \
  --env-var "PORT=5000" \
  --env-var "ALLOWED_ORIGINS=*" \
  --update-env

# Save PM2 settings
echo "Saving PM2 config..."
pm2 save

echo "Done! Check the logs with: pm2 logs forexprox"
