#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Create necessary directories
print_status "Creating deployment directories..."
mkdir -p /opt/lexcommand/{frontend,backend,redis}
mkdir -p /var/log/lexcommand
mkdir -p /etc/lexcommand/keys

# Install system dependencies
print_status "Installing system dependencies..."
apt-get update
apt-get install -y \
    nodejs \
    npm \
    python3 \
    python3-pip \
    python3-venv \
    redis-server \
    nginx \
    certbot \
    python3-certbot-nginx \
    docker.io \
    docker-compose

# Setup Redis
print_status "Configuring Redis..."
cat > /etc/redis/redis.conf << EOL
bind 127.0.0.1
port 6379
requirepass ${REDIS_PASSWORD}
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
EOL

systemctl restart redis-server

# Setup Backend
print_status "Setting up backend..."
cd /opt/lexcommand/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create backend environment file
cat > .env << EOL
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=${FRONTEND_URL}
OTLP_ENDPOINT=localhost:4317
EOL

# Setup Frontend
print_status "Setting up frontend..."
cd /opt/lexcommand/frontend

# Install Node.js dependencies
npm install

# Create frontend environment file
cat > .env << EOL
REACT_APP_API_URL=${BACKEND_URL}
REACT_APP_SENTRY_DSN=${SENTRY_DSN}
REACT_APP_ALLOWED_ORIGINS=${FRONTEND_URL}
EOL

# Build frontend
npm run build

# Setup Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/lexcommand << EOL
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Frontend
    location / {
        root /opt/lexcommand/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EOL

# Enable site
ln -sf /etc/nginx/sites-available/lexcommand /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Setup SSL
print_status "Setting up SSL..."
certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email ${ADMIN_EMAIL}

# Create systemd services
print_status "Creating systemd services..."

# Backend service
cat > /etc/systemd/system/lexcommand-backend.service << EOL
[Unit]
Description=LexCommand Backend
After=network.target redis.service

[Service]
User=lexcommand
Group=lexcommand
WorkingDirectory=/opt/lexcommand/backend
Environment="PATH=/opt/lexcommand/backend/venv/bin"
ExecStart=/opt/lexcommand/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# Start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable lexcommand-backend
systemctl start lexcommand-backend

# Setup monitoring
print_status "Setting up monitoring..."
docker-compose -f /opt/lexcommand/docker-compose.yml up -d prometheus grafana

# Final checks
print_status "Running final checks..."
curl -s http://localhost:8000/health || print_error "Backend health check failed"
curl -s http://localhost:80 || print_error "Frontend health check failed"

print_status "Deployment completed successfully!"
print_warning "Please check the logs for any errors:"
print_warning "Backend logs: journalctl -u lexcommand-backend"
print_warning "Nginx logs: tail -f /var/log/nginx/error.log" 