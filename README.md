# LexOS - Autonomous AI Operations System

## 🔷 Core Purpose
LexOS is a fully autonomous AI operations system designed to manage, automate, and optimize all aspects of multifamily housing, AI infrastructure, and business intelligence. It's a private, sovereign AGI-like command platform that replaces SaaS dependency, broker inefficiency, and manual decision-making with real-time intelligence, automation, and action.

## 🎯 Target Users
- **Primary**: Vince Sharma (Overlord) – owner/operator of multifamily real estate and AI infrastructure
- **Secondary**: The Sharma family, trusted staff, AI agents, and select partners (property managers, DJs, engineers)
- **Tertiary**: Future tenants, clients, investors, and governmental partners via automation portals

## 🚀 Key Features
- Autonomous task execution (leasing, collections, repairs, reporting)
- Voice + dashboard command interface (LexCommand.ai)
- Integration with Rent Manager, Google, Flowith.io, and financial APIs
- AI agent council (Shadow, Nova, Atlas, Orion) for delegated workflows
- Secure hosting on H100, B200, A6000 or cloud backup nodes
- Custom-built music remixing + media engine (for DJ & promo use)
- Asset protection and investment analysis modules

## 🏆 Success Metrics
- LexCommand becomes daily command hub
- 90%+ reduction in repetitive property management tasks
- AI identifies and executes profitable deals autonomously
- Entire Sharma family trusts, uses, and expands LexOS independently

## 🧱 Technical Architecture

### 🖥️ Frontend Requirements
- React + Vite (LexCommand interface)
- JWT Auth with refresh tokens
- WebSocket live updates
- Audio input support + AI agent chat stream

### 🛠️ Backend Services
- FastAPI backend (main.py) with:
  - /login
  - /reason
  - /health
  - /metrics
  - /ws (WebSockets)
- Redis (for session + job tracking)
- Postgres (optional for scale)
- Gunicorn + systemd + Caddy for production

### 💾 Data Storage
- JSON logs for agent decisions
- Redis for volatile memory
- GitHub (code + memory_archive.md for context)
- S3 or local file system for uploads/downloads

### 🧠 AI/ML Components
- GPT-4.1 via OpenAI API
- Claude, Groq, Gemini (via API trigger agents)
- Devstral running on local FastAPI (127.0.0.1:7860)
- Flowith.io agent orchestration (external control)

### 🔌 Integration Points
- Rent Manager
- Google Workspace
- Flowith.io API
- GitHub/Git Actions
- Vultr, RunPod, TensorDock control scripts

## 🧩 Development Phases

### ✅ Phase 1: MVP (Almost Done)
- Working backend (FastAPI + Redis + JWT)
- Working frontend (React + WebSocket + Auth UI)
- H100 + A6000 hosting ready
- GitHub deployment infrastructure live
- Final deployment script for full live push (Caddy, systemd)

### 🔜 Phase 2: Core Features
- AI Agent Council logic per task (Shadow, Nova, Orion, etc.)
- Task scheduling, job persistence, live job manager
- Audio input + vocal command execution
- Mission_X endpoint to receive commands from dashboard

### 🔮 Phase 3: Advanced Features
- Self-healing watchdog + sentinel daemon
- Music Engine: Remix manager for DJ use
- Flowith.io + Rent Manager integration
- Financial intelligence + LIHTC property scoring AI

## ⚠️ Current Roadblocks
- Vision-to-Deployment Gap: Lack of clear, structured, and finished MVP pipeline
- Overuse of Tools: Integration complexity with multiple tools (Flowith, Copilot, Claude, Cursor, Manus, Devstral)
- DevOps Bottleneck: Deployment scripts, systemd services, and Caddy/Nginx configs
- Frontend → Backend Bridging: JWT auth, Redis sessions, and WebSocket handling inconsistencies

## 🚀 Deployment Guide

### Prerequisites
- Docker (v20.10+)
- Docker Compose (v2.0+)
- Node.js (v16+)
- npm (v8+)
- At least 4GB of RAM
- 20GB of free disk space

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/LexHelios/LexOS.git
cd LexOS
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

### Services

The deployment includes the following services:

- Frontend (port 80)
- API (port 8000)
- WebSocket (port 8001)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Prometheus (port 9090)
- Grafana (port 3000)

### Configuration

#### Environment Variables

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

#### Security

- Change all default passwords in production
- Use strong, unique passwords for each service
- Keep your `.env` file secure and never commit it to version control
- Regularly update dependencies for security patches

### Monitoring

The deployment includes Prometheus and Grafana for monitoring:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default credentials: admin/admin)

### Health Checks

Run health checks manually:
```bash
./scripts/health_check.sh
```

### Troubleshooting

#### Common Issues

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

#### Logs

View logs for specific services:
```bash
docker-compose logs [service_name]
```

## 📞 Support
For support, email support@lexcommand.ai or join our Slack channel.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
