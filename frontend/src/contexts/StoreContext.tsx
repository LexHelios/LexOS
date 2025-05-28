import { createContext, useContext } from 'react';
import { create, StoreApi, UseBoundStore } from 'zustand';
import { MusicStore, Mix } from '../types/music';

interface Command {
  id: string;
  type: string;
  content: string;
  timestamp: number;
}

interface CommandStore {
  commands: Command[];
  addCommand: (command: Command) => void;
  removeCommand: (id: string) => void;
  clearCommands: () => void;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  capabilities: string[];
}

interface AgentStore {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
}

interface StoreContextType {
  commandStore: CommandStore;
  agentStore: AgentStore;
  musicStore: MusicStore;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useCommandStore = create<CommandStore>((set) => ({
  commands: [],
  addCommand: (command) => set((state) => ({ 
    commands: [...state.commands, command] 
  })),
  removeCommand: (id) => set((state) => ({ 
    commands: state.commands.filter(cmd => cmd.id !== id) 
  })),
  clearCommands: () => set({ commands: [] })
}));

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  addAgent: (agent) => set((state) => ({ 
    agents: [...state.agents, agent] 
  })),
  removeAgent: (id) => set((state) => ({ 
    agents: state.agents.filter(agent => agent.id !== id) 
  })),
  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    )
  }))
}));

export const useMusicStore = create<MusicStore>((set) => ({
  currentMix: null,
  mixes: [],
  createMix: (name: string) => {
    const newMix: Mix = {
      id: Date.now().toString(),
      name,
      tracks: [],
      bpm: 120,
      key: 'C',
      metadata: {}
    };
    set((state) => ({
      mixes: [...state.mixes, newMix],
      currentMix: newMix
    }));
  },
  updateMix: (mixId: string, updates: Partial<Mix>) => {
    set((state) => ({
      mixes: state.mixes.map(mix => 
        mix.id === mixId ? { ...mix, ...updates } : mix
      ),
      currentMix: state.currentMix?.id === mixId 
        ? { ...state.currentMix, ...updates }
        : state.currentMix
    }));
  },
  deleteMix: (mixId: string) => {
    set((state) => ({
      mixes: state.mixes.filter(mix => mix.id !== mixId),
      currentMix: state.currentMix?.id === mixId ? null : state.currentMix
    }));
  },
  setCurrentMix: (mixId: string) => {
    set((state) => ({
      currentMix: state.mixes.find(mix => mix.id === mixId) || null
    }));
  }
}));

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StoreContext.Provider
      value={{
        commandStore: useCommandStore.getState(),
        agentStore: useAgentStore.getState(),
        musicStore: useMusicStore.getState()
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 