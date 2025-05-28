import React from 'react';
import { Card } from '@/components/ui/card';
import { AgentCard } from '@/components/agents/AgentCard';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { TelemetryDashboard } from '@/components/telemetry/TelemetryDashboard';
import { CommandConsole } from '@/components/console/CommandConsole';
import { useAgentStore } from '@/stores/agentStore';

export const Layout: React.FC = () => {
  const { agents, selectedAgentId, actions } = useAgentStore();

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="grid h-full grid-cols-12 gap-4 p-4">
        {/* Agent Panel */}
        <div className="col-span-3 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <h2 className="mb-4 text-lg font-semibold">Agents</h2>
              <div className="space-y-4">
                {Object.values(agents).map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={agent.id === selectedAgentId}
                    onClick={() => actions.selectAgent(agent.id)}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-6 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden">
            <div className="h-full">
              <WorkflowCanvas
                agents={Object.values(agents)}
                onNodeClick={actions.selectAgent}
              />
            </div>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Telemetry Dashboard */}
          <Card className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <h2 className="mb-4 text-lg font-semibold">System Metrics</h2>
              <TelemetryDashboard
                metrics={[]} // TODO: Implement metrics collection
                currentMetrics={{
                  cpu: 45,
                  memory: 60,
                  gpu: 75,
                }}
              />
            </div>
          </Card>

          {/* Command Console */}
          <Card className="flex-1 overflow-hidden">
            <div className="h-full">
              <CommandConsole />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}; 