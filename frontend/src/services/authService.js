import api from './api.js';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.data?.accessToken) {
      localStorage.setItem('resq_token', response.data.data.accessToken);
      localStorage.setItem('resq_user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data?.data?.accessToken) {
      localStorage.setItem('resq_token', response.data.data.accessToken);
      localStorage.setItem('resq_user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('resq_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
