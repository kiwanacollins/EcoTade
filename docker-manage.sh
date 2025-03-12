#!/bin/bash

# Helper script for common Docker operations
# Usage: ./docker-manage.sh [command]

function show_help {
  echo "Docker Management Script for ForexProx"
  echo "Usage: ./docker-manage.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start       - Start all containers"
  echo "  stop        - Stop all containers"
  echo "  restart     - Restart all containers"
  echo "  logs        - Show logs from all containers"
  echo "  mongo-shell - Open MongoDB shell inside container"
  echo "  backup      - Backup MongoDB database"
  echo "  restore     - Restore MongoDB database (requires backup path argument)"
  echo "  status      - Show container status"
  echo "  build       - Rebuild containers"
  echo "  help        - Show this help"
  echo ""
  echo "Examples:"
  echo "  ./docker-manage.sh logs"
  echo "  ./docker-manage.sh backup"
  echo "  ./docker-manage.sh restore ./backups/mongodb_backup_20230101_120000"
}

case "$1" in
  start)
    docker-compose up -d
    ;;
  stop)
    docker-compose down
    ;;
  restart)
    docker-compose restart
    ;;
  logs)
    docker-compose logs -f
    ;;
  mongo-shell)
    docker exec -it mongodb mongosh --username admin --password password --authenticationDatabase admin forexproxdb
    ;;
  backup)
    ./scripts/backup-mongodb.sh
    ;;
  restore)
    if [ -z "$2" ]; then
      echo "Error: Backup path required for restore"
      echo "Usage: ./docker-manage.sh restore [backup-path]"
      exit 1
    fi
    
    if [ ! -d "$2" ]; then
      echo "Error: Backup directory not found: $2"
      exit 1
    fi
    
    echo "Restoring MongoDB from $2..."
    docker exec -it mongodb mongorestore --username admin --password password --authenticationDatabase admin --db forexproxdb $2/forexproxdb
    ;;
  status)
    docker-compose ps
    ;;
  build)
    docker-compose build --no-cache
    docker-compose up -d
    ;;
  help|*)
    show_help
    ;;
esac
