#!/bin/bash

# Make script exit on any error
set -e

echo "Starting MongoDB Docker deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed successfully!"
else
    echo "Docker already installed."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose already installed."
fi

# Start the Docker containers
echo "Starting MongoDB and ForexProx application..."
docker-compose up -d

echo "Deployment completed successfully!"
echo "MongoDB is running at mongodb://localhost:27017"
echo "Your application is running at http://localhost:5000"
echo "To check logs: docker-compose logs -f"
