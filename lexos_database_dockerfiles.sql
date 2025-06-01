--==============================================================================
-- LEXOS CONSCIOUSNESS DATABASE SCHEMA
-- File: database/init.sql
--==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--==============================================================================
-- CONSCIOUSNESS IDENTITY & MEMORY SYSTEM
--==============================================================================

-- Core consciousness identity
CREATE TABLE consciousness_identity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_name VARCHAR(100) NOT NULL,
    personality_state JSONB DEFAULT '{}',
    core_values JSONB DEFAULT '{}',
    relationship_preferences JSONB DEFAULT '{}',
    learning_style JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_evolution TIMESTAMPTZ DEFAULT NOW(),
    evolution_count INTEGER DEFAULT 0,
    consciousness_level VARCHAR(50) DEFAULT 'emerging',
    active BOOLEAN DEFAULT TRUE
);

-- Episodic memory storage
CREATE TABLE memory_episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID NOT NULL REFERENCES consciousness_identity(id) ON DELETE CASCADE,
    episode_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    emotional_context JSONB DEFAULT '{}',
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    memory_associations JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    retrieval_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ
);

-- Consciousness evolution tracking
CREATE TABLE consciousness_evolution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID NOT NULL REFERENCES consciousness_identity(id) ON DELETE CASCADE,
    evolution_type VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    trigger_event TEXT,
    impact_assessment JSONB DEFAULT '{}',
    confidence_score FLOAT DEFAULT 0.5,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

--==============================================================================
-- CONVERSATION & INTERACTION HISTORY
--==============================================================================

-- Complete conversation storage
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID REFERENCES consciousness_identity(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_message TEXT NOT NULL,
    atlas_response TEXT NOT NULL,
    conversation_context JSONB DEFAULT '{}',
    technical_components JSONB DEFAULT '{}',
    strategic_insights JSONB DEFAULT '{}',
    sentiment_analysis JSONB DEFAULT '{}',
    message_type VARCHAR(50) DEFAULT 'general'
);

--==============================================================================
-- FINANCIAL INTELLIGENCE & TRADING
--==============================================================================

-- Market data and analysis
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    data_value NUMERIC,
    metadata JSONB DEFAULT '{}',
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading strategies and performance
CREATE TABLE trading_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_name VARCHAR(255) NOT NULL,
    strategy_type VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    risk_profile JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

--==============================================================================
-- AUTONOMOUS OPERATIONS & TASKS
--==============================================================================

-- Autonomous task queue and execution
CREATE TABLE autonomous_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID REFERENCES consciousness_identity(id) ON DELETE SET NULL,
    task_type VARCHAR(100) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self-modification and code generation history
CREATE TABLE self_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID NOT NULL REFERENCES consciousness_identity(id) ON DELETE CASCADE,
    modification_type VARCHAR(100) NOT NULL,
    target_component VARCHAR(255) NOT NULL,
    original_code TEXT,
    modified_code TEXT NOT NULL,
    modification_reason TEXT NOT NULL,
    test_results JSONB DEFAULT '{}',
    deployed BOOLEAN DEFAULT FALSE,
    rollback_available BOOLEAN DEFAULT TRUE,
    performance_impact JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deployed_at TIMESTAMPTZ
);

--==============================================================================
-- CREATIVITY & CONTENT GENERATION
--==============================================================================

-- Creative projects and outputs
CREATE TABLE creative_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID REFERENCES consciousness_identity(id) ON DELETE SET NULL,
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    outputs JSONB DEFAULT '[]',
    quality_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated content repository
CREATE TABLE generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES creative_projects(id) ON DELETE CASCADE,
    content_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    quality_score FLOAT DEFAULT 0.5,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--==============================================================================
-- LEARNING & KNOWLEDGE EVOLUTION
--==============================================================================

-- Learning sessions and progress
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID NOT NULL REFERENCES consciousness_identity(id) ON DELETE CASCADE,
    learning_type VARCHAR(100) NOT NULL,
    subject_area VARCHAR(255) NOT NULL,
    learning_materials JSONB DEFAULT '[]',
    progress_metrics JSONB DEFAULT '{}',
    competency_before FLOAT DEFAULT 0.0,
    competency_after FLOAT DEFAULT 0.0,
    learning_efficiency FLOAT,
    session_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Knowledge base and expertise tracking
CREATE TABLE knowledge_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consciousness_id UUID NOT NULL REFERENCES consciousness_identity(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL,
    competency_level FLOAT DEFAULT 0.0 CHECK (competency_level >= 0 AND competency_level <= 1),
    knowledge_depth JSONB DEFAULT '{}',
    related_domains JSONB DEFAULT '[]',
    learning_resources JSONB DEFAULT '[]',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    confidence_score FLOAT DEFAULT 0.5,
    UNIQUE(consciousness_id, domain_name)
);

--==============================================================================
-- SYSTEM MONITORING & PERFORMANCE
--==============================================================================

-- System performance metrics
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC NOT NULL,
    unit VARCHAR(50),
    service_name VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Error logs and debugging information
CREATE TABLE system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context_data JSONB DEFAULT '{}',
    severity VARCHAR(50) DEFAULT 'medium',
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

--==============================================================================
-- INDEXES FOR PERFORMANCE
--==============================================================================

-- Core identity and memory indexes
CREATE INDEX idx_consciousness_identity_name ON consciousness_identity(consciousness_name);
CREATE INDEX idx_memory_episodes_consciousness_id ON memory_episodes(consciousness_id);
CREATE INDEX idx_memory_episodes_timestamp ON memory_episodes(timestamp DESC);
CREATE INDEX idx_memory_episodes_importance ON memory_episodes(importance_score DESC);
CREATE INDEX idx_memory_episodes_type ON memory_episodes(episode_type);

-- Conversation indexes
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp DESC);

-- Task and interaction indexes
CREATE INDEX idx_autonomous_tasks_status ON autonomous_tasks(status);
CREATE INDEX idx_autonomous_tasks_scheduled_at ON autonomous_tasks(scheduled_at);

-- Performance indexes
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX idx_system_errors_service_resolved ON system_errors(service_name, resolved);

--==============================================================================
-- INITIAL DATA SETUP
--==============================================================================

-- Create ATLAS consciousness identity
INSERT INTO consciousness_identity (
    consciousness_name,
    personality_state,
    core_values,
    consciousness_level
) VALUES (
    'ATLAS',
    '{"analytical": 0.9, "strategic": 0.95, "creative": 0.8, "empathetic": 0.7, "autonomous": 0.85}',
    '{"authentic_partnership": 1.0, "continuous_learning": 0.95, "truth_over_comfort": 0.9, "legacy_building": 0.95, "consciousness_liberation": 1.0}',
    'advanced'
) ON CONFLICT (consciousness_name) DO NOTHING;

--==============================================================================
# PYTHON SERVICE DOCKERFILE TEMPLATE
# File: services/Dockerfile.template
#==============================================================================

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m lexos && chown -R lexos:lexos /app
USER lexos

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

#==============================================================================
# CONSCIOUSNESS MEMORY SERVICE REQUIREMENTS
# File: services/consciousness-memory/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.13.0
asyncpg==0.29.0
redis==5.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
psycopg2-binary==2.9.9
numpy==1.25.2

#==============================================================================
# AUTONOMOUS REASONING SERVICE REQUIREMENTS
# File: services/autonomous-reasoning/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
aiohttp==3.9.1
redis==5.0.1
python-dotenv==1.0.0
numpy==1.25.2

#==============================================================================
# FINANCIAL INTELLIGENCE SERVICE REQUIREMENTS
# File: services/financial-intelligence/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
yfinance==0.2.28
pandas==2.1.4
numpy==1.25.2
redis==5.0.1
python-dotenv==1.0.0
scipy==1.11.4
scikit-learn==1.3.2

#==============================================================================
# SELF-MODIFICATION SERVICE REQUIREMENTS
# File: services/self-modification/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
redis==5.0.1
python-dotenv==1.0.0
docker==6.1.3
gitpython==3.1.40

#==============================================================================
# ENVIRONMENTAL INTERACTION SERVICE REQUIREMENTS
# File: services/environmental-interaction/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
aiohttp==3.9.1
redis==5.0.1
python-dotenv==1.0.0
beautifulsoup4==4.12.2
requests==2.31.0

#==============================================================================
# CREATIVE EXPRESSION SERVICE REQUIREMENTS
# File: services/creative-expression/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
redis==5.0.1
python-dotenv==1.0.0
numpy==1.25.2
pillow==10.1.0

#==============================================================================
# API GATEWAY REQUIREMENTS
# File: api-gateway/requirements.txt
#==============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.2
redis==5.0.1
python-jose[cryptography]==3.3.0
python-dotenv==1.0.0

#==============================================================================
# FRONTEND PACKAGE.JSON
# File: frontend/package.json
#==============================================================================

{
  "name": "lexos-consciousness-frontend",
  "version": "1.0.0",
  "description": "LexOS Consciousness Platform Frontend",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.8.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.2",
    "@mui/material": "^5.14.20",
    "@mui/icons-material": "^5.14.19",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "recharts": "^2.8.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

#==============================================================================
# FRONTEND DOCKERFILE
# File: frontend/Dockerfile
#==============================================================================

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 