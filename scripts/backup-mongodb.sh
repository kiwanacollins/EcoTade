#!/bin/bash

# MongoDB backup script
# Usage: ./backup-mongodb.sh [backup-directory]

# Default backup directory
BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/mongodb_backup_${TIMESTAMP}"

# Make sure backup directory exists
mkdir -p ${BACKUP_DIR}

echo "Starting MongoDB backup to ${BACKUP_PATH}..."

# Run backup using mongodump from the Docker container
docker exec -it mongodb mongodump \
  --username admin \
  --password password \
  --authenticationDatabase admin \
  --db forexproxdb \
  --out /tmp/backup

# Copy the backup from the container to the host
docker cp mongodb:/tmp/backup ${BACKUP_PATH}

# Clean up temp backup in container
docker exec -it mongodb rm -rf /tmp/backup

echo "Backup completed: ${BACKUP_PATH}"
