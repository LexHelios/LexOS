# Deployment Guide

This guide provides detailed instructions for deploying the LexCommand Shadow Autonomy system.

## Prerequisites

- Kubernetes cluster (v1.21+)
- Helm (v3.7+)
- Docker
- kubectl configured
- Cloudflare account (for frontend)
- Redis instance
- Monitoring stack (Prometheus, Grafana)

## Architecture

The system consists of the following components:

1. Frontend (React SPA)
2. Backend API (FastAPI)
3. Redis (Session store)
4. Monitoring stack
5. Database (PostgreSQL)

## Deployment Steps

### 1. Frontend Deployment

#### Using Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `build`
   - Node version: 18
3. Set environment variables:
   ```
   REACT_APP_API_URL=https://api.lexcommand.example.com
   REACT_APP_SENTRY_DSN=your-sentry-dsn
   REACT_APP_ALLOWED_ORIGINS=https://lexcommand.example.com
   ```

#### Using Docker

```bash
# Build the image
docker build -t lexcommand-frontend:latest -f frontend/Dockerfile .

# Push to registry
docker push your-registry/lexcommand-frontend:latest
```

### 2. Backend Deployment

#### Using Helm

1. Add the Helm repository:
```bash
helm repo add lexcommand https://charts.lexcommand.ai
helm repo update
```

2. Create a values file (`values.yaml`):
```yaml
replicaCount: 3
image:
  repository: your-registry/lexcommand-backend
  tag: latest
  pullPolicy: Always

env:
  REDIS_HOST: redis-master
  REDIS_PORT: 6379
  JWT_SECRET: your-secret
  ALLOWED_ORIGINS: https://lexcommand.example.com

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

3. Install the chart:
```bash
helm install lexcommand-backend lexcommand/lexcommand-backend -f values.yaml
```

### 3. Redis Deployment

```bash
helm install redis bitnami/redis \
  --set auth.password=your-password \
  --set master.persistence.size=10Gi \
  --set replica.persistence.size=10Gi
```

### 4. Monitoring Stack

1. Install Prometheus:
```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --set grafana.enabled=true \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

2. Configure Grafana dashboards:
   - Import dashboard JSON files from `monitoring/grafana/`
   - Configure data sources
   - Set up alerts

### 5. Database Setup

1. Install PostgreSQL:
```bash
helm install postgres bitnami/postgresql \
  --set auth.postgresPassword=your-password \
  --set primary.persistence.size=20Gi
```

2. Run migrations:
```bash
kubectl exec -it deploy/lexcommand-backend -- alembic upgrade head
```

## Security Configuration

1. Configure TLS:
```bash
kubectl create secret tls lexcommand-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem
```

2. Set up network policies:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: lexcommand-backend
spec:
  podSelector:
    matchLabels:
      app: lexcommand-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
```

## Monitoring and Alerts

1. Configure Prometheus alerts:
```yaml
groups:
- name: lexcommand
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
```

2. Set up Slack notifications:
```yaml
receivers:
- name: slack
  slack_configs:
  - channel: '#alerts'
    send_resolved: true
```

## Backup and Recovery

1. Configure database backups:
```bash
kubectl create cronjob postgres-backup \
  --image=postgres:13 \
  --schedule="0 0 * * *" \
  -- pg_dump -h postgres -U postgres lexcommand > /backup/lexcommand-$(date +%Y%m%d).sql
```

2. Set up Redis persistence:
```yaml
redis:
  master:
    persistence:
      enabled: true
      snapshot: true
```

## Scaling

1. Horizontal Pod Autoscaling:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: lexcommand-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: lexcommand-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

## Troubleshooting

### Common Issues

1. Database connection issues:
```bash
kubectl logs -l app=lexcommand-backend
kubectl exec -it deploy/postgres -- psql -U postgres
```

2. Redis connection issues:
```bash
kubectl logs -l app=lexcommand-backend
kubectl exec -it deploy/redis-master -- redis-cli
```

3. Frontend issues:
```bash
# Check Cloudflare Pages deployment logs
# Check browser console for errors
```

### Health Checks

```bash
# API health
curl https://api.lexcommand.example.com/health

# Frontend health
curl https://lexcommand.example.com/health

# Database health
kubectl exec -it deploy/postgres -- pg_isready
```

## Maintenance

1. Upgrading:
```bash
# Update Helm charts
helm repo update

# Upgrade backend
helm upgrade lexcommand-backend lexcommand/lexcommand-backend -f values.yaml

# Upgrade frontend
# Update Docker image tag in Cloudflare Pages
```

2. Backup verification:
```bash
# Verify database backups
kubectl exec -it deploy/postgres -- pg_restore -l /backup/lexcommand-latest.sql

# Verify Redis persistence
kubectl exec -it deploy/redis-master -- redis-cli save
```

## Support

For deployment support:
- Email: deploy@lexcommand.ai
- Slack: #deployment-support
- Documentation: https://docs.lexcommand.ai/deployment 