import { fetchAgents, updateAgentStatus, getSystemMetrics } from '../api';

// Mock fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchAgents', () => {
    const mockAgents = [
      { id: 1, name: 'Agent 1', status: 'active' },
      { id: 2, name: 'Agent 2', status: 'inactive' },
    ];

    it('fetches agents successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgents),
      });

      const result = await fetchAgents();
      expect(result).toEqual(mockAgents);
      expect(global.fetch).toHaveBeenCalledWith('/api/agents');
    });

    it('handles fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAgents()).rejects.toThrow('Network error');
    });
  });

  describe('updateAgentStatus', () => {
    it('updates agent status successfully', async () => {
      const agentId = 1;
      const newStatus = 'active';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await updateAgentStatus(agentId, newStatus);
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(`/api/agents/${agentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    });

    it('handles update error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      await expect(updateAgentStatus(1, 'active')).rejects.toThrow('Update failed');
    });
  });

  describe('getSystemMetrics', () => {
    const mockMetrics = {
      cpu: 45,
      memory: 60,
      disk: 75,
    };

    it('fetches system metrics successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetrics),
      });

      const result = await getSystemMetrics();
      expect(result).toEqual(mockMetrics);
      expect(global.fetch).toHaveBeenCalledWith('/api/metrics/system');
    });

    it('handles metrics fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Metrics fetch failed'));

      await expect(getSystemMetrics()).rejects.toThrow('Metrics fetch failed');
    });
  });
}); 