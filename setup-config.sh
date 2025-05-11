#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to prompt for input with validation
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    local required="$4"
    
    while true; do
        if [ -n "$default" ]; then
            read -p "$prompt [$default]: " input
            input=${input:-$default}
        else
            read -p "$prompt: " input
        fi
        
        if [ "$required" = "true" ] && [ -z "$input" ]; then
            print_error "This field is required!"
            continue
        fi
        
        eval "$var_name='$input'"
        break
    done
}

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c 32
}

print_status "Starting configuration setup..."

# Server Configuration
prompt_input "Enter deployment user" DEPLOY_USER "" "true"
prompt_input "Enter server hostname or IP" DEPLOY_HOST "" "true"
prompt_input "Enter domain name" DOMAIN "" "true"
prompt_input "Enter SSL email" SSL_EMAIL "" "true"

# Security Credentials
prompt_input "Enter admin username" ADMIN_USERNAME "admin" "true"
prompt_input "Enter admin password (leave empty to generate)" ADMIN_PASSWORD "" "false"
if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD=$(generate_password)
    print_status "Generated admin password: $ADMIN_PASSWORD"
fi

prompt_input "Enter Redis password (leave empty to generate)" REDIS_PASSWORD "" "false"
if [ -z "$REDIS_PASSWORD" ]; then
    REDIS_PASSWORD=$(generate_password)
    print_status "Generated Redis password: $REDIS_PASSWORD"
fi

# Environment Configuration
prompt_input "Enter environment (production/development)" ENVIRONMENT "production" "true"
prompt_input "Enter allowed origins (comma-separated)" ALLOWED_ORIGINS "https://$DOMAIN" "true"

# Generate configuration files
print_status "Generating configuration files..."

# Generate .env file
cat > .env << EOF
# Server Configuration
ENVIRONMENT=$ENVIRONMENT
DOMAIN=$DOMAIN

# Security Credentials
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD

# Environment Configuration
ALLOWED_ORIGINS=$ALLOWED_ORIGINS

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_SSL=false

# Monitoring Configuration
OTLP_ENDPOINT=localhost:4317
PROMETHEUS_PORT=9090

# Resource Limits
WORKERS=4
MAX_REQUESTS=1000

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30
WS_CLEANUP_INTERVAL=60
WS_MAX_CONNECTIONS=1000
EOF

# Update deploy.sh
sed -i "s/DEPLOY_USER=.*/DEPLOY_USER=\"$DEPLOY_USER\"/" deploy.sh
sed -i "s/DEPLOY_HOST=.*/DEPLOY_HOST=\"$DEPLOY_HOST\"/" deploy.sh

print_status "Configuration files generated successfully!"
print_status "Please review the generated files before proceeding with deployment."
print_status "Make sure to keep your .env file secure and never commit it to version control." 