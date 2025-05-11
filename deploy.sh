#!/bin/bash
set -e

# Configuration
APP_NAME="lexcommand"
DEPLOY_USER="root"
DEPLOY_HOST="45.63.71.110"
DEPLOY_PATH="/opt/lexcommand"
BACKUP_PATH="/opt/lexcommand/backups"
ENV_FILE=".env"
DOMAIN="lexcommand.ai"
SSL_EMAIL="Veekashsharma@gmail.com"

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

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file $ENV_FILE not found!"
    exit 1
fi

# Create backup
print_status "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_PATH/$TIMESTAMP"
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $BACKUP_DIR"
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' \
    $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/ $BACKUP_DIR/

# Deploy new code
print_status "Deploying new code..."
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' \
    --exclude '.git' --exclude '.env' \
    ./ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/

# Copy environment file
print_status "Updating environment configuration..."
scp $ENV_FILE $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/.env

# Setup Python environment and install dependencies
print_status "Setting up Python environment..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_PATH && \
    python3 -m venv venv && \
    source venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt"

# Generate JWT keys if they don't exist
print_status "Checking JWT keys..."
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p /etc/lexcommand/keys"
ssh $DEPLOY_USER@$DEPLOY_HOST "if [ ! -f /etc/lexcommand/keys/jwt-private.pem ]; then \
    openssl genpkey -algorithm RSA -out /etc/lexcommand/keys/jwt-private.pem && \
    openssl rsa -pubout -in /etc/lexcommand/keys/jwt-private.pem -out /etc/lexcommand/keys/jwt-public.pem && \
    chmod 600 /etc/lexcommand/keys/jwt-private.pem && \
    chmod 644 /etc/lexcommand/keys/jwt-public.pem; \
    fi"

# Setup SSL certificates if they don't exist
print_status "Checking SSL certificates..."
ssh $DEPLOY_USER@$DEPLOY_HOST "if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then \
    sudo apt-get update && \
    sudo apt-get install -y certbot && \
    sudo certbot certonly --standalone -d $DOMAIN --email $SSL_EMAIL --agree-tos --non-interactive; \
    fi"

# Setup system user if it doesn't exist
print_status "Setting up system user..."
ssh $DEPLOY_USER@$DEPLOY_HOST "if ! id 'lexcommand' &>/dev/null; then \
    sudo useradd -r -s /bin/false lexcommand && \
    sudo mkdir -p /opt/lexcommand && \
    sudo chown -R lexcommand:lexcommand /opt/lexcommand && \
    sudo mkdir -p /etc/lexcommand/keys && \
    sudo chown -R lexcommand:lexcommand /etc/lexcommand; \
    fi"

# Setup logging directory
print_status "Setting up logging directory..."
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo mkdir -p /var/log/lexcommand && \
    sudo chown -R lexcommand:lexcommand /var/log/lexcommand"

# Copy and enable systemd service
print_status "Setting up systemd service..."
scp lexcommand.service $DEPLOY_USER@$DEPLOY_HOST:/tmp/
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo mv /tmp/lexcommand.service /etc/systemd/system/ && \
    sudo systemctl daemon-reload && \
    sudo systemctl enable lexcommand"

# Restart services
print_status "Restarting services..."
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo systemctl restart lexcommand"

# Check service status
print_status "Checking service status..."
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo systemctl status lexcommand"

# Run health check
print_status "Running health check..."
HEALTH_CHECK=$(curl -s https://$DOMAIN/health)
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    print_status "Deployment successful! Service is healthy."
else
    print_error "Health check failed! Please check the service logs."
    exit 1
fi

# Cleanup old backups (keep last 5)
print_status "Cleaning up old backups..."
ssh $DEPLOY_USER@$DEPLOY_HOST "ls -t $BACKUP_PATH | tail -n +6 | xargs -I {} rm -rf $BACKUP_PATH/{}"

print_status "Deployment completed successfully!" 