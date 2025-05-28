import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Timeline } from '@tremor/react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'command' | 'agent' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export const SemanticDebuggerPanel: React.FC = () => {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DebugEvent | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const { commandStore, agentStore } = useStore();

  useEffect(() => {
    // Subscribe to command and agent events
    const unsubscribeCommands = commandStore.subscribe((state) => {
      const newEvents = state.history.map((cmd) => ({
        id: cmd.id,
        timestamp: cmd.timestamp,
        type: 'command',
        content: cmd.command,
        metadata: cmd.metadata,
      }));
      setEvents((prev) => [...prev, ...newEvents]);
    });

    const unsubscribeAgents = agentStore.subscribe((state) => {
      const newEvents = state.agentEvents.map((event) => ({
        id: event.id,
        timestamp: event.timestamp,
        type: 'agent',
        content: event.message,
        metadata: event.metadata,
      }));
      setEvents((prev) => [...prev, ...newEvents]);
    });

    return () => {
      unsubscribeCommands();
      unsubscribeAgents();
    };
  }, [commandStore, agentStore]);

  const handleTimeTravel = (event: DebugEvent) => {
    setSelectedEvent(event);
    setIsReplaying(true);
    
    // Implement time travel logic here
    if (event.type === 'command') {
      commandStore.rollbackTo(event.id);
    } else if (event.type === 'agent') {
      agentStore.rollbackTo(event.id);
    }
    
    setIsReplaying(false);
  };

  const handleVeto = (event: DebugEvent) => {
    // Implement veto logic
    if (event.type === 'command') {
      commandStore.vetoCommand(event.id);
    }
  };

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Semantic Debugger</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setEvents([])}
            disabled={isReplaying}
          >
            Clear History
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Timeline>
          {events.map((event) => (
            <Timeline.Item
              key={event.id}
              className={`cursor-pointer ${
                selectedEvent?.id === event.id ? 'bg-accent' : ''
              }`}
              onClick={() => handleTimeTravel(event)}
            >
              <div className="flex items-start space-x-4">
                <Badge variant={event.type === 'command' ? 'default' : 'secondary'}>
                  {event.type}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(event.timestamp, 'HH:mm:ss.SSS')}
                  </p>
                  {event.metadata && (
                    <pre className="text-xs mt-1 bg-muted p-1 rounded">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                {event.type === 'command' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVeto(event);
                    }}
                  >
                    Veto
                  </Button>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </ScrollArea>
    </Card>
  );
}; 