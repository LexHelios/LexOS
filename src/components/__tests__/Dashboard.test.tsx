import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';

// Mock the useRealtimeUpdates hook
jest.mock('../../hooks/useRealtimeUpdates');

describe('Dashboard Component', () => {
  const mockRealtimeData = {
    agents: [
      { id: 1, name: 'Agent 1', status: 'active' },
      { id: 2, name: 'Agent 2', status: 'inactive' },
    ],
    systemStatus: {
      cpu: 45,
      memory: 60,
      disk: 75,
    },
  };

  beforeEach(() => {
    (useRealtimeUpdates as jest.Mock).mockReturnValue({
      data: mockRealtimeData,
      error: null,
      loading: false,
    });
  });

  it('renders dashboard with agent list', () => {
    render(<Dashboard />);
    expect(screen.getByText('Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Agent 2')).toBeInTheDocument();
  });

  it('displays system status metrics', () => {
    render(<Dashboard />);
    expect(screen.getByText('CPU: 45%')).toBeInTheDocument();
    expect(screen.getByText('Memory: 60%')).toBeInTheDocument();
    expect(screen.getByText('Disk: 75%')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    (useRealtimeUpdates as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      loading: true,
    });

    render(<Dashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    (useRealtimeUpdates as jest.Mock).mockReturnValue({
      data: null,
      error: 'Failed to fetch data',
      loading: false,
    });

    render(<Dashboard />);
    expect(screen.getByText('Error: Failed to fetch data')).toBeInTheDocument();
  });

  it('updates agent status on click', async () => {
    render(<Dashboard />);
    const agent1 = screen.getByText('Agent 1');
    fireEvent.click(agent1);

    await waitFor(() => {
      expect(screen.getByText('Status: active')).toBeInTheDocument();
    });
  });
}); 