import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { socketService } from '@/services/socket';

const App: React.FC = () => {
  React.useEffect(() => {
    // Initialize WebSocket connection
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Layout />
    </div>
  );
};

export default App; 