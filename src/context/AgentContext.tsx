import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

// Types
export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  role: string;
  metrics: {
    cpu: number;
    memory: number;
    tasks: number;
    errors: number;
  };
  config: {
    model: string;
    version: string;
    settings: Record<string, any>;
  };
  uptime: number;
  lastSync: number;
  wsState: 'connected' | 'disconnected' | 'reconnecting';
}

interface AgentState {
  agents: Record<string, Agent>;
  selectedAgent: string | null;
  isModalOpen: boolean;
  error: string | null;
}

type AgentAction =
  | { type: 'SET_AGENTS'; payload: Record<string, Agent> }
  | { type: 'UPDATE_AGENT'; payload: { id: string; data: Partial<Agent> } }
  | { type: 'SELECT_AGENT'; payload: string | null }
  | { type: 'TOGGLE_MODAL' }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: AgentState = {
  agents: {},
  selectedAgent: null,
  isModalOpen: false,
  error: null,
};

// Reducer
function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.id]: {
            ...state.agents[action.payload.id],
            ...action.payload.data,
          },
        },
      };
    case 'SELECT_AGENT':
      return { ...state, selectedAgent: action.payload };
    case 'TOGGLE_MODAL':
      return { ...state, isModalOpen: !state.isModalOpen };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Context
const AgentContext = createContext<{
  state: AgentState;
  dispatch: React.Dispatch<AgentAction>;
} | null>(null);

// Provider
export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const { sendMessage, lastMessage } = useWebSocket();

  // Subscribe to agent status updates
  useEffect(() => {
    if (lastMessage?.type === 'agent_status') {
      dispatch({
        type: 'UPDATE_AGENT',
        payload: {
          id: lastMessage.data.id,
          data: lastMessage.data,
        },
      });
    }
  }, [lastMessage]);

  // Request initial agent status
  useEffect(() => {
    sendMessage({ type: 'request_agent_status' });
  }, [sendMessage]);

  return (
    <AgentContext.Provider value={{ state, dispatch }}>
      {children}
    </AgentContext.Provider>
  );
}

// Hook
export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
} 