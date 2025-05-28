import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'error';
  metrics: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  error?: string;
}

interface AgentState {
  agents: Agent[];
  selectedAgent: string | null;
  actions: {
    addAgent: (agent: Agent) => void;
    removeAgent: (id: string) => void;
    updateAgent: (id: string, updates: Partial<Agent>) => void;
    updateAgentMetrics: (id: string, metrics: Agent['metrics']) => void;
    selectAgent: (id: string | null) => void;
  };
}

const useAgentStore = create<AgentState>()(
  devtools(
    (set) => ({
      agents: [],
      selectedAgent: null,
      actions: {
        addAgent: (agent) =>
          set((state) => ({
            agents: [...state.agents, agent],
          })),
        removeAgent: (id) =>
          set((state) => ({
            agents: state.agents.filter((agent) => agent.id !== id),
            selectedAgent: state.selectedAgent === id ? null : state.selectedAgent,
          })),
        updateAgent: (id, updates) =>
          set((state) => ({
            agents: state.agents.map((agent) =>
              agent.id === id ? { ...agent, ...updates } : agent
            ),
          })),
        updateAgentMetrics: (id, metrics) =>
          set((state) => ({
            agents: state.agents.map((agent) =>
              agent.id === id ? { ...agent, metrics } : agent
            ),
          })),
        selectAgent: (id) =>
          set({
            selectedAgent: id,
          }),
      },
    }),
    {
      name: 'agent-store',
    }
  )
);

export default useAgentStore; 