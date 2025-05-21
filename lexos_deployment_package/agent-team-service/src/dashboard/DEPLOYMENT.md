# LexOS Agent Dashboard - Deployment Guide

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Access to the production server
- SSL certificates for HTTPS

## Step 1: Environment Setup

1. Create `.env` file in the dashboard directory:
```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000

# Environment
REACT_APP_ENV=development
NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_LOGGING=true
REACT_APP_ENABLE_ERROR_TRACKING=true

# Security
REACT_APP_ENABLE_HTTPS=false
REACT_APP_ENABLE_CORS=true

# Performance
REACT_APP_CACHE_DURATION=3600
REACT_APP_MAX_CONNECTIONS=10

# Monitoring
REACT_APP_METRICS_INTERVAL=5000
REACT_APP_HEARTBEAT_INTERVAL=30000

# UI Configuration
REACT_APP_THEME=cyberpunk
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_TIMEZONE=UTC

# Agent Configuration
REACT_APP_MAX_AGENTS=10
REACT_APP_AGENT_TIMEOUT=300000
REACT_APP_TASK_TIMEOUT=60000

# DJ (Dynamic Job) Configuration
REACT_APP_MAX_CONCURRENT_JOBS=5
REACT_APP_JOB_QUEUE_SIZE=100
REACT_APP_JOB_TIMEOUT=3600000
```

2. Create `.env.production` file:
```env
# API Configuration
REACT_APP_API_BASE_URL=https://api.lexos-core.com
REACT_APP_WS_URL=wss://api.lexos-core.com

# Environment
REACT_APP_ENV=production
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_LOGGING=true
REACT_APP_ENABLE_ERROR_TRACKING=true

# Security
REACT_APP_ENABLE_HTTPS=true
REACT_APP_ENABLE_CORS=true
REACT_APP_ENABLE_CSRF=true

# Performance
REACT_APP_CACHE_DURATION=3600
REACT_APP_MAX_CONNECTIONS=50

# Monitoring
REACT_APP_METRICS_INTERVAL=5000
REACT_APP_HEARTBEAT_INTERVAL=30000

# UI Configuration
REACT_APP_THEME=cyberpunk
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_TIMEZONE=UTC

# Agent Configuration
REACT_APP_MAX_AGENTS=50
REACT_APP_AGENT_TIMEOUT=300000
REACT_APP_TASK_TIMEOUT=60000

# DJ (Dynamic Job) Configuration
REACT_APP_MAX_CONCURRENT_JOBS=20
REACT_APP_JOB_QUEUE_SIZE=500
REACT_APP_JOB_TIMEOUT=3600000

# Production Optimizations
REACT_APP_ENABLE_COMPRESSION=true
REACT_APP_ENABLE_CACHING=true
REACT_APP_ENABLE_CDN=true
```

## Step 2: Build Process

1. Open Command Prompt (not PowerShell) and navigate to the dashboard directory:
```bash
cd lexos_deployment_package/agent-team-service/src/dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create production build:
```bash
npm run build
```

## Step 3: Server Configuration

1. **Nginx Configuration**
Create a new Nginx configuration file:
```nginx
server {
    listen 80;
    server_name dashboard.lexos-core.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name dashboard.lexos-core.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Root directory
    root /path/to/your/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

2. **Apache Configuration** (if using Apache)
Create `.htaccess` file in the build directory:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# Security headers
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains" env=HTTPS
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "no-referrer-when-downgrade"
Header set Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';"

# Enable CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## Step 4: Deployment

1. Copy the contents of the `build` directory to your web server's root directory.

2. Ensure proper permissions:
```bash
chmod -R 755 /path/to/your/build
chown -R www-data:www-data /path/to/your/build
```

3. Restart your web server:
```bash
# For Nginx
sudo systemctl restart nginx

# For Apache
sudo systemctl restart apache2
```

## Step 5: Verification

1. Check the dashboard is accessible via HTTPS:
```
https://dashboard.lexos-core.com
```

2. Verify all features are working:
- Real-time agent monitoring
- Task management
- DJ (Dynamic Job) management
- System health monitoring
- WebSocket connections
- API integrations

3. Monitor the server logs for any errors:
```bash
# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Apache logs
tail -f /var/log/apache2/error.log
tail -f /var/log/apache2/access.log
```

## Troubleshooting

If you encounter issues:

1. **Build Issues**
   - Clear the build cache: `npm run clean`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`
   - Rebuild: `npm run build`

2. **Server Issues**
   - Check server logs
   - Verify SSL certificates
   - Check file permissions
   - Verify proxy configurations

3. **Application Issues**
   - Check browser console for errors
   - Verify environment variables
   - Check API connectivity
   - Verify WebSocket connections

## Support

For any deployment issues, contact:
- Technical Support: support@lexos-core.com
- Emergency Contact: emergency@lexos-core.com

## Security Notes

1. Keep all environment variables secure
2. Regularly update SSL certificates
3. Monitor server logs for suspicious activity
4. Keep all dependencies updated
5. Regularly backup the configuration 