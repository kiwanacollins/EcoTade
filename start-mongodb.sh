#!/bin/bash

# Check if MongoDB container is already running
if docker ps | grep -q "mongodb"; then
  echo "MongoDB container is already running"
  # Show the port mapping
  echo "Port mapping:"
  docker port mongodb
else
  # Check if container exists but is stopped
  if docker ps -a | grep -q "mongodb"; then
    echo "Starting existing MongoDB container..."
    docker start mongodb
  else
    echo "Creating and starting MongoDB container..."
    docker run --name mongodb \
      -e MONGO_INITDB_ROOT_USERNAME=admin \
      -e MONGO_INITDB_ROOT_PASSWORD=password \
      -e MONGO_INITDB_DATABASE=forexproxdb \
      -v mongodb_data:/data/db \
      -v mongodb_config:/data/configdb \
      -v $(pwd)/mongo-init:/docker-entrypoint-initdb.d \
      -p 27018:27017 \
      -d mongo:latest
    
    echo "Waiting for MongoDB to initialize..."
    sleep 5
  fi
fi

# Check if MongoDB is accessible
echo "Testing MongoDB connection..."
if docker exec mongodb mongosh --eval "db.adminCommand('ping')" --quiet admin -u admin -p password; then
  echo "MongoDB is running and accessible!"
else
  echo "Warning: MongoDB may not be fully initialized yet. Please check logs with: docker logs mongodb"
fi
