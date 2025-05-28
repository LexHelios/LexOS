import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface Suggestion {
  id: string;
  type: 'action' | 'insight' | 'warning';
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  metadata?: Record<string, any>;
}

export const CopilotOverlay: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { agentStore } = useStore();

  useEffect(() => {
    // Subscribe to agent events and generate suggestions
    const unsubscribe = agentStore.subscribe((state) => {
      const newSuggestions = generateSuggestions(state);
      setSuggestions((prev) => [...prev, ...newSuggestions]);
    });

    return () => unsubscribe();
  }, [agentStore]);

  const generateSuggestions = (state: any): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // Analyze agent states and generate insights
    state.agentEvents.forEach((event: any) => {
      if (event.type === 'stuck') {
        suggestions.push({
          id: `stuck-${event.id}`,
          type: 'warning',
          content: `Agent ${event.agentId} appears to be stuck on step ${event.step}`,
          priority: 'high',
          timestamp: Date.now(),
          metadata: event,
        });
      }

      if (event.type === 'success') {
        suggestions.push({
          id: `success-${event.id}`,
          type: 'insight',
          content: `Agent ${event.agentId} completed task successfully`,
          priority: 'low',
          timestamp: Date.now(),
          metadata: event,
        });
      }
    });

    return suggestions;
  };

  const handleSuggestionAction = (suggestion: Suggestion) => {
    // Implement suggestion action handling
    console.log('Handling suggestion:', suggestion);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 transition-all duration-300 ${isExpanded ? 'h-96' : 'h-auto'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Co-Pilot</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>

          <ScrollArea className={`${isExpanded ? 'h-80' : 'h-24'}`}>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="mb-2 p-2 rounded-lg border bg-card hover:bg-accent cursor-pointer"
                onClick={() => handleSuggestionAction(suggestion)}
              >
                <div className="flex items-start justify-between">
                  <Badge variant={getPriorityColor(suggestion.priority)}>
                    {suggestion.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(suggestion.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-sm">{suggestion.content}</p>
                {suggestion.metadata && (
                  <pre className="mt-1 text-xs bg-muted p-1 rounded">
                    {JSON.stringify(suggestion.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}; 