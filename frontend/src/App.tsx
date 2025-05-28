import React from 'react';
import { StoreProvider } from './contexts/StoreContext';
import { SemanticDebuggerPanel } from './components/SemanticDebuggerPanel';
import { CopilotOverlay } from './components/CopilotOverlay';
import { GlobalControlPanel } from './components/GlobalControlPanel';
import { ImageUploadPanel } from './components/ImageUploadPanel';

function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <GlobalControlPanel />
              <ImageUploadPanel />
            </div>
            <div>
              <SemanticDebuggerPanel />
            </div>
          </div>
        </div>
        <CopilotOverlay />
      </div>
    </StoreProvider>
  );
}

export default App; 