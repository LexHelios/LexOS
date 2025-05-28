import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Trash2 } from 'lucide-react';

interface WorkflowControlsProps {
  onLayout: () => void;
  onClear: () => void;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  onLayout,
  onClear,
}) => {
  return (
    <div className="flex gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={onLayout}
        title="Auto-layout"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onClear}
        title="Clear connections"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}; 