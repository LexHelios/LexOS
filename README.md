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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis
- Docker (optional)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-org/lexos-core.git
cd lexos-core
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_ALLOWED_ORIGINS=http://localhost:3000

# Backend (.env)
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
ALLOWED_ORIGINS=http://localhost:3000
```

## 📞 Support
For support, email support@lexcommand.ai or join our Slack channel.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 