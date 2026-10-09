import api from './api.js';

export const incidentService = {
  getIncidents: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/incidents?${params.toString()}`);
    return response.data.data; // Note: Also pagination data is in response.data.pagination
  },
  
  getIncidentById: async (id) => {
    const response = await api.get(`/incidents/${id}`);
    return response.data.data;
  },

  createIncident: async (data) => {
    const response = await api.post('/incidents', data);
    return response.data.data;
  },

  updateIncidentStatus: async (id, status, summary) => {
    const response = await api.patch(`/incidents/${id}/status`, { status, summary });
    return response.data.data;
  },
  
  generateActionPlan: async (id) => {
    const response = await api.post(`/incidents/${id}/action-plan`);
    return response.data.data;
  },
  
  deleteIncident: async (id) => {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  }
};
