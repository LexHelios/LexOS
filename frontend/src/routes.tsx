import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InsightLogbook } from './components/InsightLogbook';
import { AgentTracePanel } from './components/AgentTracePanel';
import { SankeyFlow } from './components/SankeyFlow';
import { HeatmapGrid } from './components/HeatmapGrid';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/insights" element={<InsightLogbook />} />
        <Route path="/trace" element={<AgentTracePanel />} />
        <Route path="/flow" element={<SankeyFlow />} />
        <Route path="/heatmap" element={<HeatmapGrid />} />
      </Route>
    </Routes>
  );
}; 