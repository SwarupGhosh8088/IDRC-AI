import api from './api.js';

export const networkService = {
  getNetworkNodes: async () => {
    const response = await api.get('/dashboard/network');
    return response.data.data.nodes;
  },

  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  }
};
