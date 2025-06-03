# LexOS Deployment Guide

This guide explains how to deploy LexOS using a split architecture between Vercel (frontend), RunPod (backend), and Supabase (memory).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Vercel      │     │     RunPod      │     │    Supabase     │
│   (Frontend)   │◄────┤    (Backend)    │◄────┤    (Memory)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                      ▲                        ▲
        │                      │                        │
        │                      │                        │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Vercel      │     │     Render      │     │    Supabase     │
│     CDN        │     │  (Database)     │     │    Storage      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Prerequisites

1. Vercel Account
2. RunPod Account
3. Render Account (for database)
4. Supabase Account
5. Node.js and npm installed
6. Git repository with LexOS code

## Deployment Steps

### 1. Initial Setup

```bash
# Install deployment tools
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Environment Variables

#### Frontend (.env)
```env
VITE_WS_URL=wss://lexos.runpod.net/socket.io
VITE_API_URL=https://lexos.runpod.net
VITE_APP_NAME=LexOS
VITE_APP_VERSION=1.0.0
VITE_SUPABASE_URL=https://lexos.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-key
```

#### Backend (RunPod)
```env
ENVIRONMENT=production
ALLOWED_ORIGINS=https://lexcommand.ai,http://localhost:3000
REDIS_URL=redis://lexos-redis.onrender.com:6379
POSTGRES_URL=postgresql://lexos:${DB_PASSWORD}@lexos-postgres.onrender.com:5432/lexos
SUPABASE_URL=https://lexos.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Deploy

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

## Services Deployed

### Vercel (Frontend)
- React application
- Static assets
- Global CDN
- Automatic SSL

### RunPod (Backend)
- Main API Service
- LLM Service
- WebSocket Server
- GPU Acceleration

### Supabase (Memory)
- Short-term Memory (Redis)
- Long-term Memory (PostgreSQL)
- Vector Storage
- File Storage
- Real-time Subscriptions

### Render (Database)
- PostgreSQL Database (Backup)
- Redis Instance (Cache)

## Memory Management

### Short-term Memory (Supabase Redis)
- Session data
- Active conversations
- Temporary state
- Real-time updates

### Long-term Memory (Supabase PostgreSQL)
- User profiles
- Conversation history
- Knowledge base
- Vector embeddings

### Vector Storage (Supabase pgvector)
- Semantic search
- Similarity matching
- Context retrieval
- Knowledge graphs

## Monitoring

### Vercel
- Visit https://vercel.com/dashboard
- Check deployment status
- View analytics
- Monitor performance

### RunPod
- Visit https://www.runpod.io/console
- Monitor GPU usage
- View logs
- Check pod status

### Supabase
- Visit https://app.supabase.com
- Monitor database performance
- View real-time logs
- Check storage usage

### Render
- Visit https://dashboard.render.com
- Monitor database health
- View logs
- Check resource usage

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check ALLOWED_ORIGINS in RunPod environment
   - Verify frontend URL is included

2. **WebSocket Connection Issues**
   - Verify VITE_WS_URL in frontend .env
   - Check RunPod pod status

3. **Memory Issues**
   - Check Supabase connection
   - Verify vector storage configuration
   - Monitor memory usage

### Support

- Vercel Support: https://vercel.com/support
- RunPod Support: https://www.runpod.io/support
- Supabase Support: https://supabase.com/support
- Render Support: https://render.com/docs/support

## Security Notes

1. Never commit .env files
2. Use strong passwords for databases
3. Enable 2FA on all platforms
4. Regularly rotate API keys
5. Monitor access logs
6. Encrypt sensitive data in Supabase

## Backup and Recovery

### Database Backups
- Supabase handles automatic backups
- Backup frequency: Daily
- Retention: 7 days
- Point-in-time recovery available

### Application State
- Redis data is persisted
- Static assets are versioned
- Environment variables are stored securely
- Vector embeddings are backed up

## Scaling

### Vercel
- Automatic scaling
- Edge network optimization
- Zero-config CDN

### RunPod
- GPU scaling based on demand
- Automatic pod management
- Pay-per-use pricing

### Supabase
- Automatic database scaling
- Vector search optimization
- Real-time subscription scaling
- Storage scaling

### Render
- Database scaling options available
- Redis cluster support
- Automatic failover 