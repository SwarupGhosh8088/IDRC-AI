import api from './api.js';

export const allocationService = {
  getAllocations: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/allocations?${params.toString()}`);
    return response.data.data;
  },

  generateRecommendations: async (incidentId) => {
    const response = await api.post('/allocations/generate', { incidentId });
    return response.data.data;
  },

  updateStatus: async (id, status, reason) => {
    const response = await api.patch(`/allocations/${id}/status`, { status, reason });
    return response.data.data;
  }
};
