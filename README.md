# Deployment test 3 yes
# kiwana collins has successfully deployed using a github actions as a CI/CD pipeline

## Production Notes
- API endpoints in production should automatically route to https://forexprox.com/api
- Local development uses http://localhost:5000/api
- Added protection against incorrect API endpoint URLs in production environment

## MongoDB Docker Setup
This application uses MongoDB in a Docker container.

### Local Development Setup
1. Install Docker and Docker Compose on your local machine
2. Run `docker-compose up -d` to start MongoDB and the application
3. The application will be available at http://localhost:5000

### VPS Deployment
1. Transfer the project files to your VPS
2. Make the deployment script executable: `chmod +x deploy.sh`
3. Run the deployment script: `./deploy.sh`
4. MongoDB will be accessible internally at mongodb://mongodb:27017
5. Your application will be accessible at your VPS IP address on port 5000

### Environment Variables
- MongoDB connection variables are configured in docker-compose.yml
- For local development without Docker, copy .env.production to .env and modify as needed


