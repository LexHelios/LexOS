# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting LexOS deployment..." -ForegroundColor Green

# Check for required tools
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ vercel CLI is required. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Environment variables
$env:VITE_API_URL = "https://api.lexcommand.ai"
$env:VITE_WS_URL = "wss://api.lexcommand.ai/ws"
$env:VITE_APP_ENV = "production"

# Frontend deployment
Write-Host "📦 Building frontend..." -ForegroundColor Green
Set-Location frontend
npm install
npm run build

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
vercel --prod --yes

# Return to root
Set-Location ..

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Frontend: https://www.lexcommand.ai" -ForegroundColor Cyan
Write-Host "🔌 API: https://api.lexcommand.ai" -ForegroundColor Cyan
Write-Host "📡 WebSocket: wss://api.lexcommand.ai/ws" -ForegroundColor Cyan

# Print deployment checklist
Write-Host "
📋 Deployment Checklist:
1. Verify DNS records are configured:
   - www.lexcommand.ai -> Vercel deployment
   - api.lexcommand.ai -> Backend server
2. Check SSL certificates are valid
3. Verify CORS settings on backend
4. Test WebSocket connections
5. Monitor error rates
" -ForegroundColor Yellow 