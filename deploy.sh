#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting LexOS deployment..."

# Check for required tools
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting."; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ vercel CLI is required. Installing..."; npm install -g vercel; }

# Environment variables
export VITE_API_URL="https://api.lexcommand.ai"
export VITE_WS_URL="wss://api.lexcommand.ai"
export VITE_APP_ENV="production"

# Frontend deployment
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

echo "🚀 Deploying to Vercel..."
vercel --prod --yes

# Return to root
cd ..

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://www.lexcommand.ai"
echo "🔌 API: https://api.lexcommand.ai"
echo "📡 WebSocket: wss://api.lexcommand.ai"

# Print deployment checklist
echo "
📋 Deployment Checklist:
1. Verify DNS records are configured:
   - www.lexcommand.ai -> Vercel deployment
   - api.lexcommand.ai -> Backend server
2. Check SSL certificates are valid
3. Verify CORS settings on backend
4. Test WebSocket connections
5. Monitor error rates
" 