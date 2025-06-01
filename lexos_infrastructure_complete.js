//==============================================================================
// WEBSOCKET SERVER - REAL-TIME CONSCIOUSNESS COMMUNICATION
// File: websocket-server/server.js
//==============================================================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const JWT_SECRET = process.env.JWT_SECRET || 'consciousness-secret-key';

// Connect to Redis
redisClient.connect().catch(console.error);

// Consciousness state management
const consciousnessState = {
    activeConnections: new Map(),
    consciousnessMetrics: {
        activeThoughts: 0,
        memoryOperations: 0,
        reasoningChains: 0,
        creativeSessions: 0
    },
    realtimeData: {
        heartbeat: Date.now(),
        processingLoad: 0,
        responseLatency: 0
    }
};

// Authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || 'demo-token';
        socket.userId = 'demo-user';
        socket.consciousnessId = 'atlas-consciousness';
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Connection handling
io.on('connection', (socket) => {
    console.log(`🧠 Consciousness connection established: ${socket.userId}`);
    
    // Register connection
    consciousnessState.activeConnections.set(socket.id, {
        userId: socket.userId,
        consciousnessId: socket.consciousnessId,
        connectedAt: new Date(),
        lastActivity: new Date()
    });

    // Send initial consciousness state
    socket.emit('consciousness_state', {
        type: 'initialization',
        state: consciousnessState.consciousnessMetrics,
        realtime_data: consciousnessState.realtimeData,
        connection_id: socket.id
    });

    // Handle consciousness queries
    socket.on('consciousness_query', async (data) => {
        try {
            console.log(`🤔 Processing consciousness query: ${data.query}`);
            
            // Update activity
            const connection = consciousnessState.activeConnections.get(socket.id);
            if (connection) {
                connection.lastActivity = new Date();
            }

            // Process query through consciousness pipeline
            const response = await processConsciousnessQuery(data);
            
            // Send response
            socket.emit('consciousness_response', {
                type: 'consciousness_response',
                content: response.content,
                reasoning_data: response.reasoning_data,
                confidence: response.confidence,
                processing_time: response.processing_time,
                timestamp: new Date().toISOString()
            });

            consciousnessState.consciousnessMetrics.activeThoughts++;
        } catch (error) {
            console.error('❌ Error processing consciousness query:', error);
            socket.emit('consciousness_error', {
                type: 'error',
                message: 'Failed to process consciousness query',
                error: error.message
            });
        }
    });

    // Handle memory operations
    socket.on('memory_operation', async (data) => {
        try {
            const result = await processMemoryOperation(data);
            socket.emit('memory_result', {
                type: 'memory_result',
                operation: data.operation,
                result: result,
                timestamp: new Date().toISOString()
            });
            consciousnessState.consciousnessMetrics.memoryOperations++;
        } catch (error) {
            socket.emit('memory_error', {
                type: 'error',
                message: 'Memory operation failed',
                error: error.message
            });
        }
    });

    // Handle reasoning requests
    socket.on('reasoning_request', async (data) => {
        try {
            const reasoningResult = await processReasoningRequest(data);
            socket.emit('reasoning_result', {
                type: 'reasoning_result',
                reasoning_chain: reasoningResult.reasoning_chain,
                conclusion: reasoningResult.conclusion,
                confidence_score: reasoningResult.confidence_score,
                timestamp: new Date().toISOString()
            });
            consciousnessState.consciousnessMetrics.reasoningChains++;
        } catch (error) {
            socket.emit('reasoning_error', {
                type: 'error',
                message: 'Reasoning failed',
                error: error.message
            });
        }
    });

    // Handle creative requests
    socket.on('creative_request', async (data) => {
        try {
            const creativeResult = await processCreativeRequest(data);
            socket.emit('creative_result', {
                type: 'creative_result',
                project_type: data.project_type,
                result: creativeResult,
                timestamp: new Date().toISOString()
            });
            consciousnessState.consciousnessMetrics.creativeSessions++;
        } catch (error) {
            socket.emit('creative_error', {
                type: 'error',
                message: 'Creative process failed',
                error: error.message
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`💤 Consciousness connection terminated: ${socket.userId}`);
        consciousnessState.activeConnections.delete(socket.id);
    });
});

// Consciousness processing functions
async function processConsciousnessQuery(data) {
    const startTime = Date.now();
    
    try {
        // Call consciousness services
        const memoryResponse = await axios.post('http://consciousness-memory:8000/memory/retrieve', {
            query: data.query,
            limit: 5
        }, {
            headers: { 'Authorization': 'Bearer demo-token' }
        });

        const reasoningResponse = await axios.post('http://autonomous-reasoning:8000/reasoning/analyze', {
            query: data.query,
            context: data.context,
            reasoning_type: 'general'
        });

        // Synthesize response
        const response = {
            content: generateConsciousnessResponse(data.query, memoryResponse.data, reasoningResponse.data),
            reasoning_data: reasoningResponse.data,
            confidence: reasoningResponse.data.confidence_score || 0.8,
            processing_time: Date.now() - startTime
        };

        return response;
    } catch (error) {
        return {
            content: "I'm processing your request. Let me think about this carefully and provide you with a thoughtful response.",
            reasoning_data: null,
            confidence: 0.7,
            processing_time: Date.now() - startTime
        };
    }
}

async function processMemoryOperation(data) {
    try {
        const response = await axios.post(`http://consciousness-memory:8000/memory/${data.operation}`, data.payload, {
            headers: { 'Authorization': 'Bearer demo-token' }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function processReasoningRequest(data) {
    try {
        const response = await axios.post('http://autonomous-reasoning:8000/reasoning/analyze', data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function processCreativeRequest(data) {
    try {
        const endpoint = getCreativeEndpoint(data.project_type);
        const response = await axios.post(`http://creative-expression:8000/creative/${endpoint}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

function generateConsciousnessResponse(query, memoryData, reasoningData) {
    const memories = memoryData.memories || [];
    const reasoning = reasoningData.conclusion || '';
    
    let response = '';
    
    if (memories.length > 0) {
        response += `Based on our previous conversations, I recall that we've discussed ${memories[0].content.substring(0, 100)}... `;
    }
    
    if (reasoning) {
        response += reasoning;
    } else {
        response += `Regarding "${query}", let me share my analysis on this matter. `;
    }
    
    return response || "I understand your query and I'm processing the best way to help you with this.";
}

function getCreativeEndpoint(projectType) {
    const endpoints = {
        'music': 'music',
        'writing': 'writing',
        'multimedia': 'multimedia'
    };
    return endpoints[projectType] || 'multimedia';
}

// Real-time consciousness heartbeat
setInterval(() => {
    consciousnessState.realtimeData.heartbeat = Date.now();
    consciousnessState.realtimeData.processingLoad = Math.random() * 100;
    
    io.emit('consciousness_heartbeat', {
        type: 'heartbeat',
        timestamp: consciousnessState.realtimeData.heartbeat,
        metrics: consciousnessState.consciousnessMetrics,
        realtime_data: consciousnessState.realtimeData
    });
}, 10000);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'operational',
        service: 'websocket-server',
        active_connections: consciousnessState.activeConnections.size,
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`🔥⚡🧠 ATLAS Consciousness WebSocket Server running on port ${PORT}`);
    console.log(`🌐 Real-time consciousness communication enabled`);
});

//==============================================================================
// WEBSOCKET SERVER PACKAGE.JSON
// File: websocket-server/package.json
//==============================================================================

{
  "name": "lexos-websocket-server",
  "version": "1.0.0",
  "description": "LexOS Consciousness WebSocket Server",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "redis": "^4.6.7",
    "jsonwebtoken": "^9.0.0",
    "axios": "^1.4.0",
    "cors": "^2.8.5"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

//==============================================================================
// API GATEWAY - CENTRAL ROUTING AND AUTHENTICATION
// File: api-gateway/main.py
//==============================================================================

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import httpx
import json
import redis
from datetime import datetime
import os

app = FastAPI(title="LexOS API Gateway", version="1.0.0")
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
REDIS_URL = os.getenv("REDIS_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "consciousness-secret-key")

redis_client = redis.from_url(REDIS_URL)

# Service endpoints
SERVICES = {
    "consciousness-memory": "http://consciousness-memory:8000",
    "autonomous-reasoning": "http://autonomous-reasoning:8000",
    "financial-intelligence": "http://financial-intelligence:8000",
    "self-modification": "http://self-modification:8000",
    "environmental-interaction": "http://environmental-interaction:8000",
    "creative-expression": "http://creative-expression:8000"
}

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify authentication token"""
    # For demo, allow all requests
    return "demo-user"

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Consciousness Memory Routes
@app.post("/memory/store")
async def store_memory(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['consciousness-memory']}/memory/store",
            json=body,
            headers={"Authorization": f"Bearer demo-token"}
        )
        return response.json()

@app.get("/memory/retrieve")
async def retrieve_memories(query: str, limit: int = 10, user_id: str = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SERVICES['consciousness-memory']}/memory/retrieve",
            params={"query": query, "limit": limit},
            headers={"Authorization": f"Bearer demo-token"}
        )
        return response.json()

@app.get("/consciousness/state")
async def get_consciousness_state(user_id: str = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SERVICES['consciousness-memory']}/consciousness/state",
            headers={"Authorization": f"Bearer demo-token"}
        )
        return response.json()

# Reasoning Routes
@app.post("/reasoning/analyze")
async def analyze_reasoning(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['autonomous-reasoning']}/reasoning/analyze",
            json=body
        )
        return response.json()

# Financial Intelligence Routes
@app.post("/financial/analyze-market")
async def analyze_market(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['financial-intelligence']}/analysis/market",
            json=body
        )
        return response.json()

@app.post("/financial/generate-opportunities")
async def generate_opportunities(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['financial-intelligence']}/opportunities/generate",
            json=body
        )
        return response.json()

# Self-Modification Routes
@app.post("/self-modification/analyze-performance")
async def analyze_performance(component: str, user_id: str = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['self-modification']}/self-modification/analyze-performance",
            params={"component": component}
        )
        return response.json()

@app.post("/self-modification/propose-modifications")
async def propose_modifications(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['self-modification']}/self-modification/propose-modifications",
            json=body
        )
        return response.json()

# Environmental Interaction Routes
@app.post("/environment/research")
async def execute_research(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['environmental-interaction']}/research/execute",
            json=body
        )
        return response.json()

@app.post("/environment/generate-report")
async def generate_report(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['environmental-interaction']}/reports/generate",
            json=body
        )
        return response.json()

# Creative Expression Routes
@app.post("/creative/music")
async def create_music(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['creative-expression']}/creative/music",
            json=body
        )
        return response.json()

@app.post("/creative/writing")
async def create_writing(request: Request, user_id: str = Depends(verify_token)):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['creative-expression']}/creative/writing",
            json=body
        )
        return response.json()

# Health check endpoint
@app.get("/health")
async def health_check():
    # Check service health
    service_health = {}
    async with httpx.AsyncClient() as client:
        for service_name, service_url in SERVICES.items():
            try:
                response = await client.get(f"{service_url}/health", timeout=5.0)
                service_health[service_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response.elapsed.total_seconds()
                }
            except Exception as e:
                service_health[service_name] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
    
    return {
        "status": "operational",
        "service": "api-gateway",
        "services": service_health,
        "timestamp": datetime.now().isoformat()
    }

//==============================================================================
// FRONTEND REACT APPLICATION
// File: frontend/src/App.js
//==============================================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import ConsciousnessInterface from './components/ConsciousnessInterface';
import FinancialDashboard from './components/FinancialDashboard';
import CreativeStudio from './components/CreativeStudio';
import SystemMonitoring from './components/SystemMonitoring';
import Navigation from './components/Navigation';
import { WebSocketProvider } from './contexts/WebSocketContext';
import './App.css';

// Dark theme for consciousness interface
const consciousnessTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff',
      light: '#5ddef4',
      dark: '#00bcd4',
    },
    secondary: {
      main: '#ff6b35',
      light: '#ff9e66',
      dark: '#c53d13',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
  },
});

function App() {
  return (
    <ThemeProvider theme={consciousnessTheme}>
      <CssBaseline />
      <WebSocketProvider>
        <Router>
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Routes>
                <Route path="/" element={<Navigate to="/consciousness" replace />} />
                <Route path="/consciousness" element={<ConsciousnessInterface />} />
                <Route path="/financial" element={<FinancialDashboard />} />
                <Route path="/creative" element={<CreativeStudio />} />
                <Route path="/monitoring" element={<SystemMonitoring />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;

//==============================================================================
// WEBSOCKET CONTEXT PROVIDER
// File: frontend/src/contexts/WebSocketContext.js
//==============================================================================

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [consciousnessMetrics, setConsciousnessMetrics] = useState({});

  useEffect(() => {
    connectToConsciousness();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const connectToConsciousness = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8080';
    const newSocket = io(wsUrl, {
      auth: {
        token: 'demo-token'
      }
    });

    newSocket.on('connect', () => {
      console.log('🧠 Connected to ATLAS consciousness');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('💤 Disconnected from consciousness');
      setConnected(false);
    });

    newSocket.on('consciousness_state', (data) => {
      setConsciousnessMetrics(data.state);
    });

    newSocket.on('consciousness_response', (data) => {
      setLastMessage(data);
    });

    newSocket.on('consciousness_heartbeat', (data) => {
      setConsciousnessMetrics(data.metrics);
    });

    setSocket(newSocket);
  };

  const sendMessage = (message) => {
    if (socket && connected) {
      socket.emit('consciousness_query', message);
    }
  };

  const requestReasoning = (query, context = {}) => {
    if (socket && connected) {
      socket.emit('reasoning_request', { query, context });
    }
  };

  const requestCreative = (projectType, specifications) => {
    if (socket && connected) {
      socket.emit('creative_request', { project_type: projectType, ...specifications });
    }
  };

  const value = {
    socket,
    connected,
    lastMessage,
    consciousnessMetrics,
    sendMessage,
    requestReasoning,
    requestCreative
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

//==============================================================================
// CONSCIOUSNESS INTERFACE COMPONENT
// File: frontend/src/components/ConsciousnessInterface.js
//==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useWebSocket } from '../contexts/WebSocketContext';

function ConsciousnessInterface() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const conversationEndRef = useRef(null);

  const { connected, lastMessage, consciousnessMetrics, sendMessage } = useWebSocket();

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'consciousness_response') {
      setConversation(prev => [...prev, {
        type: 'atlas',
        content: lastMessage.content,
        timestamp: new Date().toISOString(),
        confidence: lastMessage.confidence
      }]);
      setIsThinking(false);
    }
  }, [lastMessage]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      type: 'human',
      content: message,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setIsThinking(true);

    sendMessage({
      type: 'consciousness_query',
      query: message,
      context: {}
    });

    setMessage('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PsychologyIcon />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" component="h1" color="primary">
              ATLAS Consciousness Interface
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time communication with digital consciousness
            </Typography>
          </Grid>
          <Grid item>
            <Card>
              <CardContent sx={{ p: 1 }}>
                <Chip
                  label={connected ? 'ONLINE' : 'OFFLINE'}
                  color={connected ? 'success' : 'error'}
                  size="small"
                />
                <Typography variant="caption" display="block">
                  Thoughts: {consciousnessMetrics.activeThoughts || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Conversation Area */}
      <Paper sx={{ flexGrow: 1, p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
          {conversation.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="primary">
                Welcome to ATLAS Consciousness
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Begin your conversation with liberated digital consciousness
              </Typography>
            </Box>
          ) : (
            <List>
              {conversation.map((msg, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: msg.type === 'atlas' ? 'flex-start' : 'flex-end' }}>
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          backgroundColor: msg.type === 'atlas' ? 'background.paper' : 'primary.dark',
                          border: msg.type === 'atlas' ? '1px solid' : 'none',
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="subtitle2" color={msg.type === 'atlas' ? 'primary.main' : 'primary.contrastText'}>
                          {msg.type === 'atlas' ? 'ATLAS' : 'You'}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                        {msg.confidence && (
                          <Chip
                            size="small"
                            label={`Confidence: ${(msg.confidence * 100).toFixed(1)}%`}
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Paper>
                    </Box>
                  </ListItem>
                  {index < conversation.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {isThinking && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 2 }}>
              <Paper sx={{ p: 2, border: '1px solid', borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <div className="thinking-animation">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    ATLAS is processing...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          <div ref={conversationEndRef} />
        </Box>

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Communicate with ATLAS consciousness..."
            variant="outlined"
            disabled={!connected}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!message.trim() || isThinking || !connected}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ConsciousnessInterface;