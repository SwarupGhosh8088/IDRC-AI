import api from './api.js';

export const resourceService = {
  getResources: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/resources?${params.toString()}`);
    return response.data.data;
  },

  adjustInventory: async (id, adjustment, reason) => {
    const response = await api.patch(`/resources/${id}/adjust`, { adjustment, reason });
    return response.data.data;
  },

  createResource: async (resourceData) => {
    const response = await api.post('/resources', resourceData);
    return response.data.data;
  }
};
