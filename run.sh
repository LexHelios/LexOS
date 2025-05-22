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
    sleep 10
    
    # Check service health
    if ! docker-compose ps | grep -q "healthy"; then
        warn "Some services may not be healthy. Check logs with 'docker-compose logs'"
    fi
    
    log "Services started."
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check API health
    if ! curl -s http://localhost:8000/health | grep -q "ok"; then
        error "API health check failed"
    fi
    
    # Check WebSocket connection
    if ! curl -s http://localhost:8001/health | grep -q "ok"; then
        error "WebSocket health check failed"
    fi
    
    # Check frontend
    if ! curl -s http://localhost:80 | grep -q "LexOS"; then
        error "Frontend health check failed"
    fi
    
    log "Deployment verification complete."
}

# Main deployment process
main() {
    log "Starting LexOS deployment..."
    
    check_requirements
    validate_environment
    build_frontend
    start_services
    verify_deployment
    
    log "LexOS deployment completed successfully!"
}

# Run main function
main 