import api from './api.js';

export const syncService = {
  syncBatch: async (operations) => {
    const response = await api.post('/sync/batch', { operations });
    return response.data.data;
  },

  getSyncStatus: async () => {
    const response = await api.get('/sync/status');
    return response.data.data;
  }
};
