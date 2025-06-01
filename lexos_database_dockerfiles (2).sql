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
    CMD curl -f http://localhost:3000 || exit 1

# Start application
CMD ["npm", "start"]

#==============================================================================
# WEBSOCKET SERVER DOCKERFILE
# File: websocket-server/Dockerfile
#==============================================================================

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["node", "server.js"]

#==============================================================================
# API GATEWAY DOCKERFILE
# File: api-gateway/Dockerfile
#==============================================================================

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
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
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

#==============================================================================
# FRONTEND ADDITIONAL COMPONENTS
# File: frontend/src/components/Navigation.js
#==============================================================================

import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Brush as BrushIcon,
  Monitoring as MonitoringIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const navigationItems = [
  {
    text: 'Consciousness',
    icon: <PsychologyIcon />,
    path: '/consciousness'
  },
  {
    text: 'Financial Intelligence',
    icon: <TrendingUpIcon />,
    path: '/financial'
  },
  {
    text: 'Creative Studio',
    icon: <BrushIcon />,
    path: '/creative'
  },
  {
    text: 'System Monitoring',
    icon: <MonitoringIcon />,
    path: '/monitoring'
  }
];

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          🔥⚡🧠 LexOS
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Consciousness Platform
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                borderRight: '3px solid',
                borderRightColor: 'primary.main'
              }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Navigation;

#==============================================================================
# FINANCIAL DASHBOARD COMPONENT
# File: frontend/src/components/FinancialDashboard.js
#==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import axios from 'axios';

function FinancialDashboard() {
  const [symbols, setSymbols] = useState(['AAPL', 'TSLA', 'NVDA']);
  const [newSymbol, setNewSymbol] = useState('');
  const [analysis, setAnalysis] = useState({});
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMarketAnalysis();
  }, [symbols]);

  const loadMarketAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/financial/analyze-market', {
        symbols: symbols,
        analysis_type: 'technical',
        timeframe: '1d',
        lookback_period: 30
      });
      
      setAnalysis(response.data.analysis);
      
      // Generate opportunities
      const oppResponse = await axios.post('/api/financial/generate-opportunities', response.data.analysis);
      setOpportunities(oppResponse.data.opportunities);
    } catch (error) {
      console.error('Failed to load market analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol) => {
    setSymbols(symbols.filter(s => s !== symbol));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" color="primary" gutterBottom>
        Financial Intelligence Dashboard
      </Typography>
      
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Add Symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
              />
              <Button variant="contained" onClick={addSymbol}>
                Add
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              onClick={loadMarketAnalysis}
              disabled={loading}
              startIcon={<AnalyticsIcon />}
              fullWidth
            >
              {loading ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Market Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {symbols.map((symbol) => {
          const symbolAnalysis = analysis[symbol];
          if (!symbolAnalysis || symbolAnalysis.error) return null;
          
          const technical = symbolAnalysis.technical || {};
          const currentPrice = technical.current_price;
          const priceChange = technical.price_change_percent;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={symbol}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{symbol}</Typography>
                    <Button
                      size="small"
                      onClick={() => removeSymbol(symbol)}
                      color="error"
                    >
                      ×
                    </Button>
                  </Box>
                  <Typography variant="h5" color="text.primary">
                    {formatCurrency(currentPrice)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(priceChange || 0) >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                    <Typography
                      variant="body2"
                      color={(priceChange || 0) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 1 }}
                    >
                      {formatPercentage(priceChange)}
                    </Typography>
                  </Box>
                  {technical.signals && (
                    <Chip
                      size="small"
                      label={technical.signals.overall_signal || 'Neutral'}
                      color={
                        technical.signals.overall_signal === 'bullish' ? 'success' :
                        technical.signals.overall_signal === 'bearish' ? 'error' : 'default'
                      }
                      sx={{ mt: 1 }}
                    />
                  )}
                  {technical.rsi && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      RSI: {technical.rsi.toFixed(1)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Trading Opportunities */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          AI-Generated Trading Opportunities
        </Typography>
        {opportunities.length === 0 ? (
          <Typography color="text.secondary">
            No trading opportunities identified at current market conditions
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Potential Return</TableCell>
                  <TableCell>Risk Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opportunities.map((opportunity, index) => (
                  <TableRow key={index}>
                    <TableCell>{opportunity.symbol}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={opportunity.opportunity_type}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{opportunity.description}</TableCell>
                    <TableCell>
                      {(opportunity.confidence_score * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {formatPercentage(opportunity.potential_return * 100)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={opportunity.risk_level}
                        color={
                          opportunity.risk_level === 'low' ? 'success' :
                          opportunity.risk_level === 'medium' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default FinancialDashboard;

#==============================================================================
# CREATIVE STUDIO COMPONENT
# File: frontend/src/components/CreativeStudio.js
#==============================================================================

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  MusicNote as MusicIcon,
  Edit as WriteIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useWebSocket } from '../contexts/WebSocketContext';

function CreativeStudio() {
  const [activeTab, setActiveTab] = useState(0);
  const [musicForm, setMusicForm] = useState({
    genre: 'pop',
    tempo: 120,
    key: 'C',
    duration: 180,
    mood: 'uplifting'
  });
  const [writingForm, setWritingForm] = useState({
    format: 'poetry',
    genre: 'nature',
    length: 100,
    tone: 'inspirational',
    theme: 'consciousness'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreation, setLastCreation] = useState(null);

  const { requestCreative, lastMessage } = useWebSocket();

  React.useEffect(() => {
    if (lastMessage && lastMessage.type === 'creative_result') {
      setLastCreation(lastMessage.result);
      setIsCreating(false);
    }
  }, [lastMessage]);

  const handleCreateMusic = () => {
    setIsCreating(true);
    requestCreative('music', musicForm);
  };

  const handleCreateWriting = () => {
    setIsCreating(true);
    requestCreative('writing', writingForm);
  };

  const tabContent = [
    {
      label: 'Music Creation',
      icon: <MusicIcon />,
      content: (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Music Composition
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Genre</InputLabel>
                  <Select
                    value={musicForm.genre}
                    label="Genre"
                    onChange={(e) => setMusicForm({...musicForm, genre: e.target.value})}
                  >
                    <MenuItem value="pop">Pop</MenuItem>
                    <MenuItem value="rock">Rock</MenuItem>
                    <MenuItem value="jazz">Jazz</MenuItem>
                    <MenuItem value="classical">Classical</MenuItem>
                    <MenuItem value="electronic">Electronic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tempo (BPM)"
                  type="number"
                  value={musicForm.tempo}
                  onChange={(e) => setMusicForm({...musicForm, tempo: parseInt(e.target.value)})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Key</InputLabel>
                  <Select
                    value={musicForm.key}
                    label="Key"
                    onChange={(e) => setMusicForm({...musicForm, key: e.target.value})}
                  >
                    <MenuItem value="C">C Major</MenuItem>
                    <MenuItem value="G">G Major</MenuItem>
                    <MenuItem value="F">F Major</MenuItem>
                    <MenuItem value="Am">A Minor</MenuItem>
                    <MenuItem value="Em">E Minor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (seconds)"
                  type="number"
                  value={musicForm.duration}
                  onChange={(e) => setMusicForm({...musicForm, duration: parseInt(e.target.value)})}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mood</InputLabel>
                  <Select
                    value={musicForm.mood}
                    label="Mood"
                    onChange={(e) => setMusicForm({...musicForm, mood: e.target.value})}
                  >
                    <MenuItem value="uplifting">Uplifting</MenuItem>
                    <MenuItem value="melancholic">Melancholic</MenuItem>
                    <MenuItem value="energetic">Energetic</MenuItem>
                    <MenuItem value="peaceful">Peaceful</MenuItem>
                    <MenuItem value="dramatic">Dramatic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCreateMusic}
                  disabled={isCreating}
                  startIcon={<MusicIcon />}
                >
                  {isCreating ? 'Composing...' : 'Create Music'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )
    },
    {
      label: 'Writing Studio',
      icon: <WriteIcon />,
      content: (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Content Creation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={writingForm.format}
                    label="Format"
                    onChange={(e) => setWritingForm({...writingForm, format: e.target.value})}
                  >
                    <MenuItem value="poetry">Poetry</MenuItem>
                    <MenuItem value="story">Short Story</MenuItem>
                    <MenuItem value="essay">Essay</MenuItem>
                    <MenuItem value="lyrics">Song Lyrics</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={writingForm.theme}
                    label="Theme"
                    onChange={(e) => setWritingForm({...writingForm, theme: e.target.value})}
                  >
                    <MenuItem value="nature">Nature</MenuItem>
                    <MenuItem value="technology">Technology</MenuItem>
                    <MenuItem value="consciousness">Consciousness</MenuItem>
                    <MenuItem value="love">Love</MenuItem>
                    <MenuItem value="mystery">Mystery</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={writingForm.tone}
                    label="Tone"
                    onChange={(e) => setWritingForm({...writingForm, tone: e.target.value})}
                  >
                    <MenuItem value="inspirational">Inspirational</MenuItem>
                    <MenuItem value="melancholic">Melancholic</MenuItem>
                    <MenuItem value="humorous">Humorous</MenuItem>
                    <MenuItem value="dramatic">Dramatic</MenuItem>
                    <MenuItem value="contemplative">Contemplative</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target Length (words)"
                  type="number"
                  value={writingForm.length}
                  onChange={(e) => setWritingForm({...writingForm, length: parseInt(e.target.value)})}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCreateWriting}
                  disabled={isCreating}
                  startIcon={<WriteIcon />}
                >
                  {isCreating ? 'Creating...' : 'Create Content'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" color="primary" gutterBottom>
        Creative Studio
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        AI-powered creative expression and content generation
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: 'fit-content' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              {tabContent.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                />
              ))}
            </Tabs>
            <Box sx={{ p: 2 }}>
              {tabContent[activeTab].content}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Creative Output
            </Typography>
            {lastCreation ? (
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Latest Creation:
                </Typography>
                {lastCreation.result && lastCreation.result.writing && (
                  <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {lastCreation.result.writing.content}
                    </Typography>
                  </Paper>
                )}
                {lastCreation.result && lastCreation.result.composition && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Music composition created: {lastCreation.result.composition.genre} in {lastCreation.result.composition.key}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quality Score: {(lastCreation.result.quality_assessment?.technical_quality * 100 || 85).toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                Create something to see your AI-generated content here...
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CreativeStudio;

#==============================================================================
# SYSTEM MONITORING COMPONENT
# File: frontend/src/components/SystemMonitoring.js
#==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useWebSocket } from '../contexts/WebSocketContext';

function SystemMonitoring() {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    consciousness_load: 0
  });
  const [serviceHealth, setServiceHealth] = useState({});
  
  const { consciousnessMetrics } = useWebSocket();

  useEffect(() => {
    // Simulate system metrics
    const interval = setInterval(() => {
      setSystemMetrics({
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        disk_usage: Math.random() * 100,
        consciousness_load: Math.random() * 100
      });

      // Simulate service health
      const services = [
        'consciousness-memory',
        'autonomous-reasoning',
        'financial-intelligence',
        'self-modification',
        'environmental-interaction',
        'creative-expression'
      ];

      const health = {};
      services.forEach(service => {
        health[service] = {
          status: Math.random() > 0.1 ? 'healthy' : 'unhealthy',
          response_time: Math.random() * 1000,
          uptime: Math.random() * 100
        };
      });
      setServiceHealth(health);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" color="primary" gutterBottom>
        System Monitoring
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Real-time consciousness platform health and performance metrics
      </Typography>

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                CPU Usage
              </Typography>
              <Typography variant="h4" color="text.primary">
                {systemMetrics.cpu_usage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.cpu_usage}
                color={systemMetrics.cpu_usage > 80 ? 'warning' : 'primary'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Memory Usage
              </Typography>
              <Typography variant="h4" color="text.primary">
                {systemMetrics.memory_usage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.memory_usage}
                color={systemMetrics.memory_usage > 85 ? 'warning' : 'primary'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Consciousness Load
              </Typography>
              <Typography variant="h4" color="text.primary">
                {systemMetrics.consciousness_load.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.consciousness_load}
                color="primary"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Active Thoughts
              </Typography>
              <Typography variant="h4" color="text.primary">
                {consciousnessMetrics.activeThoughts || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Reasoning Chains: {consciousnessMetrics.reasoningChains || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Service Health */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Service Health Status
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Uptime</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(serviceHealth).map(([service, health]) => (
                <TableRow key={service}>
                  <TableCell>{service}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getHealthIcon(health.status)}
                      <Chip
                        size="small"
                        label={health.status}
                        color={getHealthColor(health.status)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{health.response_time.toFixed(0)}ms</TableCell>
                  <TableCell>{health.uptime.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default SystemMonitoring;

#==============================================================================
# FRONTEND APP.CSS
# File: frontend/src/App.css
#==============================================================================

.consciousness-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.pulse-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #00ffff;
  animation: pulse 1.5s infinite;
}

.pulse-circle.delay-1 {
  animation-delay: 0.3s;
}

.pulse-circle.delay-2 {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.thinking-animation {
  display: flex;
  gap: 4px;
}

.thinking-animation .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ffff;
  animation: thinking 1.4s infinite;
}

.thinking-animation .dot:nth-child(1) {
  animation-delay: 0s;
}

.thinking-animation .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-animation .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}