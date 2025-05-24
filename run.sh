#!/bin/bash

# LexOS Deployment Bootstrapper
# This script handles the deployment process for LexOS Core

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    # Check system resources
    local total_mem=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$total_mem" -lt 4096 ]; then
        warn "System has less than 4GB of RAM. This might affect performance."
    fi
    
    log "System requirements met."
}

# Validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        error ".env file not found. Please create it from .env.example"
    fi
    
    # Check required environment variables
    required_vars=(
        "REACT_APP_API_BASE_URL"
        "REACT_APP_WS_URL"
        "DB_HOST"
        "DB_PORT"
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "REDIS_HOST"
        "REDIS_PORT"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "GRAFANA_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    log "Environment validation complete."
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    
    cd agent-team-service/src/dashboard
    
    # Install dependencies
    npm install
    
    # Build production version
    npm run build
    
    cd ../../..
    
    log "Frontend build complete."
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start Docker services
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Run health checks
    if ! ./scripts/health_check.sh; then
        error "Health checks failed. Check the logs for more information."
    fi
    
    log "Services started successfully."
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Wait for Prometheus to be ready
    sleep 10
    
    # Check if Prometheus is running
    if ! curl -s http://localhost:9090/-/healthy > /dev/null; then
        warn "Prometheus is not healthy. Monitoring might not work correctly."
    fi
    
    # Check if Grafana is running
    if ! curl -s http://localhost:3000/api/health > /dev/null; then
        warn "Grafana is not healthy. Monitoring dashboard might not be available."
    fi
    
    log "Monitoring setup complete."
}

# Main deployment process
main() {
    log "Starting LexOS deployment..."
    
    check_requirements
    validate_environment
    build_frontend
    start_services
    setup_monitoring
    
    log "LexOS deployment completed successfully!"
    log "You can access:"
    log "- Frontend: http://localhost"
    log "- API: http://localhost:8000"
    log "- WebSocket: ws://localhost:8001"
    log "- Grafana: http://localhost:3000"
    log "- Prometheus: http://localhost:9090"
}

# Run main function
main 