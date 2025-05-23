# LexOS Deployment Package

This repository contains the deployment configuration for the LexOS platform.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Node.js (v16+)
- npm (v8+)
- At least 4GB of RAM
- 20GB of free disk space

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-org/lexos_deployment_package.git
cd lexos_deployment_package
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Make scripts executable:
```bash
chmod +x run.sh
chmod +x scripts/health_check.sh
```

4. Run the deployment:
```bash
./run.sh
```

## Services

The deployment includes the following services:

- Frontend (port 80)
- API (port 8000)
- WebSocket (port 8001)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Prometheus (port 9090)
- Grafana (port 3000)

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example` with your specific configuration:

```bash
# Required variables
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8001
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_redis_password
JWT_SECRET=your_secure_jwt_secret
GRAFANA_PASSWORD=your_secure_grafana_password
```

### Security

- Change all default passwords in production
- Use strong, unique passwords for each service
- Keep your `.env` file secure and never commit it to version control
- Regularly update dependencies for security patches

## Monitoring

The deployment includes Prometheus and Grafana for monitoring:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default credentials: admin/admin)

## Health Checks

Run health checks manually:
```bash
./scripts/health_check.sh
```

## Troubleshooting

### Common Issues

1. **Services not starting**
   - Check Docker logs: `docker-compose logs`
   - Verify environment variables
   - Check system resources

2. **Database connection issues**
   - Verify PostgreSQL is running: `docker-compose ps db`
   - Check database logs: `docker-compose logs db`

3. **Redis connection issues**
   - Verify Redis is running: `docker-compose ps redis`
   - Check Redis logs: `docker-compose logs redis`

### Logs

View logs for specific services:
```bash
docker-compose logs [service_name]
```

## Maintenance

### Backup

1. Database backup:
```bash
docker-compose exec db pg_dump -U lexos_user lexos > backup.sql
```

2. Redis backup:
```bash
docker-compose exec redis redis-cli SAVE
```

### Updates

1. Pull latest changes:
```bash
git pull
```

2. Rebuild and restart services:
```bash
docker-compose down
docker-compose up -d --build
```

## Support

For issues and support:
1. Check the troubleshooting guide
2. Review the logs
3. Contact the development team

## License

[Your License Here] 