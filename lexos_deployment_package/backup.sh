#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/lexos"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Backup PostgreSQL database
backup_postgres() {
    log "Starting PostgreSQL backup..."
    docker exec lexos-postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz" || handle_error "PostgreSQL backup failed"
    log "PostgreSQL backup completed"
}

# Backup Redis data
backup_redis() {
    log "Starting Redis backup..."
    docker exec lexos-redis redis-cli SAVE || handle_error "Redis SAVE command failed"
    docker cp lexos-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb" || handle_error "Redis data copy failed"
    log "Redis backup completed"
}

# Backup configuration files
backup_config() {
    log "Starting configuration backup..."
    tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
        /etc/lexos/nginx \
        /etc/lexos/ssl \
        /opt/lexos/agents \
        /var/lib/lexos/web_html \
        /var/lib/lexos/api_html || handle_error "Configuration backup failed"
    log "Configuration backup completed"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete || handle_error "Cleanup failed"
    log "Cleanup completed"
}

# Main backup process
main() {
    log "Starting backup process..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Perform backups
    backup_postgres
    backup_redis
    backup_config
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Backup process completed successfully"
}

# Run main function
main 