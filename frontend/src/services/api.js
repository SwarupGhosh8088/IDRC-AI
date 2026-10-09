import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('http://localhost:5000/api/v1/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('resq_token', res.data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('resq_token');
        localStorage.removeItem('resq_user');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
