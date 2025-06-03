# LexOS Deployment Package

This package contains all the necessary files to deploy LexOS on a TensorDock RTX A6000 instance.

## Contents

- `lexos_deployment_script.sh` - Main deployment script that handles the complete setup
- `docker-compose.yml` - Docker Compose configuration for the LexOS services
- `nginx-config/` - Nginx configuration files for the web server
- `web-content/` - HTML, CSS, and JavaScript files for the LexOS web interface
- `agent-scripts/` - Scripts for the autonomous agents (DevOps, QA, and Maintenance)
- `backup.sh` - Automated backup script for data and configuration

## Prerequisites

- Docker and Docker Compose installed
- NVIDIA Container Toolkit installed
- SSL certificates for HTTPS
- Sufficient disk space (minimum 100GB recommended)
- At least 32GB RAM
- NVIDIA GPU with CUDA support

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:
   ```
   # Directory Structure
   LEXOS_DATA_DIR=/var/lib/lexos
   LEXOS_CONFIG_DIR=/etc/lexos
   LEXOS_LOGS_DIR=/var/log/lexos
   LEXOS_AGENTS_DIR=/opt/lexos/agents

   # Database Configuration
   DB_PASSWORD=your_secure_password_here
   POSTGRES_DB=lexos_db
   POSTGRES_USER=lexos_user

   # API Configuration
   API_PORT=8000
   API_HOST=0.0.0.0

   # Security
   FLOWITH_API_TOKEN=your_api_token_here
   SSL_CERT_PATH=/etc/ssl/lexos/lexos.crt
   SSL_KEY_PATH=/etc/ssl/lexos/lexos.key

   # Redis Configuration
   REDIS_PASSWORD=your_redis_password_here

   # Agent Configuration
   DEVOPS_AGENT_GPU_ID=0
   QA_AGENT_GPU_ID=0
   MAINTENANCE_AGENT_GPU_ID=0

   # Logging
   LOG_LEVEL=INFO
   LOG_FORMAT=json
   ```

## Deployment Instructions

1. SSH into your TensorDock instance:
   ```bash
   ssh user@206.168.80.2 -p 8300
   ```

2. Upload this package to your TensorDock instance:
   ```bash
   scp -P 8300 lexos_deployment_package.zip user@206.168.80.2:~/
   ```

3. Unzip the package:
   ```bash
   unzip lexos_deployment_package.zip
   ```

4. Make the scripts executable:
   ```bash
   chmod +x lexos_deployment_script.sh
   chmod +x backup.sh
   ```

5. Run the deployment script:
   ```bash
   ./lexos_deployment_script.sh
   ```

## Validation

After deployment, verify that all containers are running:
```bash
sudo docker ps
```

You should see the following containers:
- lexos-nginx
- lexos-postgres
- lexos-web
- lexos-redis
- lexos-api
- lexos-devops-agent
- lexos-qa-agent
- lexos-maintenance-agent

## Health Checks

Each service includes health checks that can be accessed at:
- Main application: https://206.168.80.2/health
- API: https://206.168.80.2/api/health
- Agents: Internal health checks via Docker

## Backup and Recovery

The backup script (`backup.sh`) performs the following:
- PostgreSQL database backup
- Redis data backup
- Configuration files backup
- Automatic cleanup of old backups (7 days retention)

To run a manual backup:
```bash
./backup.sh
```

## Monitoring

The system includes:
- Container health monitoring
- GPU utilization monitoring
- Resource usage tracking
- Log aggregation

## Security Features

- HTTPS with modern SSL configuration
- Security headers
- CORS protection
- Rate limiting
- Basic authentication for status page
- Environment variable management
- Regular security updates

## Accessing LexOS

- Main interface: https://206.168.80.2
- LexCommand: https://206.168.80.2/lexcommand
- Status page: https://206.168.80.2/status (requires authentication)

## Troubleshooting

1. Check container logs:
   ```bash
   docker logs <container-name>
   ```

2. Verify health checks:
   ```bash
   curl https://206.168.80.2/health
   ```

3. Check system resources:
   ```bash
   docker stats
   ```

4. View agent status:
   ```bash
   docker exec lexos-devops-agent python3 /app/health_check.py
   ```

## Support

For issues or questions, please contact the LexOS support team.
