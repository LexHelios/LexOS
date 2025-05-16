#!/bin/bash
set -e

# Configuration
VULTR_API_KEY="YOUR_VULTR_API_KEY"
DOMAIN="lexcommand.ai"
EMAIL="Veekashsharma@gmail.com"
REGION="ewr"  # New York
PLAN="vc2-2c-4gb"  # 2 CPU, 4GB RAM
OS="ubuntu_22_04_x64"

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

# Check if Vultr CLI is installed
if ! command -v vultr &> /dev/null; then
    print_status "Installing Vultr CLI..."
    curl -L https://github.com/vultr/vultr-cli/releases/download/v2.0.0/vultr-cli_2.0.0_linux_amd64.tar.gz | tar xz
    sudo mv vultr-cli /usr/local/bin/vultr
fi

# Configure Vultr CLI
print_status "Configuring Vultr CLI..."
vultr config set api-key $VULTR_API_KEY

# Create instance
print_status "Creating Vultr instance..."
INSTANCE_ID=$(vultr instance create \
    --region $REGION \
    --plan $PLAN \
    --os $OS \
    --label lexcommand \
    --host lexcommand \
    --tag deploy \
    --ssh-keys "$(cat ~/.ssh/id_rsa.pub)" \
    --user-data "$(cat scripts/cloud-init.yml)" \
    --output json | jq -r '.instance.id')

print_status "Waiting for instance to be ready..."
sleep 30

# Get instance IP
INSTANCE_IP=$(vultr instance get $INSTANCE_ID --output json | jq -r '.instance.main_ip')

# Wait for SSH to be available
print_status "Waiting for SSH to be available..."
until ssh -o StrictHostKeyChecking=no root@$INSTANCE_IP "echo 'SSH is ready'"; do
    sleep 5
done

# Deploy application
print_status "Deploying application..."
rsync -avz --exclude '.git' --exclude 'venv' --exclude '__pycache__' \
    ./ root@$INSTANCE_IP:/opt/lexcommand/

# Run post-deployment setup
print_status "Running post-deployment setup..."
ssh root@$INSTANCE_IP "cd /opt/lexcommand && \
    docker compose up -d --build && \
    certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive && \
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/ && \
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/ && \
    docker compose restart nginx"

# Set up monitoring
print_status "Setting up monitoring..."
ssh root@$INSTANCE_IP "apt install -y prometheus node-exporter && \
    systemctl enable prometheus node-exporter && \
    systemctl start prometheus node-exporter"

# Configure firewall
print_status "Configuring firewall..."
ssh root@$INSTANCE_IP "ufw allow ssh && \
    ufw allow http && \
    ufw allow https && \
    ufw --force enable"

print_status "Deployment completed successfully!"
print_status "Application is available at: https://$DOMAIN"
print_status "Instance IP: $INSTANCE_IP"  