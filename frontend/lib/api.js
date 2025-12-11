import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
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
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else if (path.startsWith('/client')) {
          window.location.href = '/client/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Admin API
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  tenants: {
    list: (params) => api.get('/admin/tenants', { params }),
    get: (id) => api.get(`/admin/tenants/${id}`),
    create: (data) => api.post('/admin/tenants', data),
    update: (id, data) => api.put(`/admin/tenants/${id}`, data),
    delete: (id) => api.delete(`/admin/tenants/${id}`),
  },
  distributors: {
    list: (params) => api.get('/admin/distributors', { params }),
    get: (id) => api.get(`/admin/distributors/${id}`),
    create: (data) => api.post('/admin/distributors', data),
    update: (id, data) => api.put(`/admin/distributors/${id}`, data),
    delete: (id) => api.delete(`/admin/distributors/${id}`),
  },
  salesmen: {
    list: (params) => api.get('/admin/salesmen', { params }),
    get: (id) => api.get(`/admin/salesmen/${id}`),
    create: (data) => api.post('/admin/salesmen', data),
    update: (id, data) => api.put(`/admin/salesmen/${id}`, data),
    delete: (id) => api.delete(`/admin/salesmen/${id}`),
  },
};

// Client API
export const clientAPI = {
  dashboard: () => api.get('/tenants/profile'),
  vouchers: {
    list: (params) => api.get('/accounting/vouchers', { params }),
    get: (id) => api.get(`/accounting/vouchers/${id}`),
    create: (data) => api.post('/accounting/vouchers', data),
    update: (id, data) => api.put(`/accounting/vouchers/${id}`, data),
    delete: (id) => api.delete(`/accounting/vouchers/${id}`),
  },
  ledgers: {
    list: (params) => api.get('/accounting/ledgers', { params }),
    get: (id) => api.get(`/accounting/ledgers/${id}`),
    create: (data) => api.post('/accounting/ledgers', data),
    update: (id, data) => api.put(`/accounting/ledgers/${id}`, data),
  },
  reports: {
    trialBalance: (params) => api.get('/reports/trial-balance', { params }),
    balanceSheet: (params) => api.get('/reports/balance-sheet', { params }),
    profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  },
};

export default api;

