import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// Sweets API
export const sweetsAPI = {
  getAll: () => api.get('/sweets'),
  
  search: (params: { name?: string; category?: string; minPrice?: number; maxPrice?: number }) =>
    api.get('/sweets/search', { params }),
  
  getById: (id: string) => api.get(`/sweets/${id}`),
  
  create: (data: { name: string; category: string; price: number; quantity: number }) =>
    api.post('/sweets', data),
  
  update: (id: string, data: Partial<{ name: string; category: string; price: number; quantity: number }>) =>
    api.put(`/sweets/${id}`, data),
  
  delete: (id: string) => api.delete(`/sweets/${id}`),
  
  purchase: (id: string, quantity: number) =>
    api.post(`/sweets/${id}/purchase`, { quantity }),
  
  restock: (id: string, quantity: number) =>
    api.post(`/sweets/${id}/restock`, { quantity }),
};

export default api;
