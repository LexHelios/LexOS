#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Create backup directory
BACKUP_DIR="backups/$(date +'%Y-%m-%d_%H-%M-%S')"
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
backup_postgres() {
    log "Backing up PostgreSQL database..."
    if docker-compose exec -T db pg_dump -U lexos_user lexos > "$BACKUP_DIR/database.sql"; then
        log "PostgreSQL backup completed successfully"
    else
        error "PostgreSQL backup failed"
    fi
}

# Backup Redis
backup_redis() {
    log "Backing up Redis data..."
    if docker-compose exec -T redis redis-cli SAVE > /dev/null; then
        docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_DIR/redis.rdb"
        log "Redis backup completed successfully"
    else
        error "Redis backup failed"
    fi
}

# Backup configuration
backup_config() {
    log "Backing up configuration files..."
    cp .env "$BACKUP_DIR/.env"
    cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml"
    cp prometheus.yml "$BACKUP_DIR/prometheus.yml"
    log "Configuration backup completed successfully"
}

# Create backup archive
create_archive() {
    log "Creating backup archive..."
    tar -czf "$BACKUP_DIR.tar.gz" -C "$BACKUP_DIR" .
    rm -rf "$BACKUP_DIR"
    log "Backup archive created: $BACKUP_DIR.tar.gz"
}

# Main backup process
main() {
    log "Starting backup process..."
    
    backup_postgres
    backup_redis
    backup_config
    create_archive
    
    log "Backup completed successfully!"
}

# Run main function
main 