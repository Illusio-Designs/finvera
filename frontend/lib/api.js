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

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          Cookies.set('token', accessToken, { expires: 7 });
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        Cookies.remove('jti');
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else if (path.startsWith('/client')) {
            window.location.href = '/client/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      Cookies.remove('jti');
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
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Tenant API
export const tenantAPI = {
  getProfile: () => api.get('/tenants/profile'),
  updateProfile: (data) => api.put('/tenants/profile', data),
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
    getPerformance: (id, params) => api.get(`/admin/salesmen/${id}/performance`, { params }),
    getLeads: (id, params) => api.get(`/admin/salesmen/${id}/leads`, { params }),
  },
  commissions: {
    list: (params) => api.get('/admin/commissions', { params }),
    get: (id) => api.get(`/admin/commissions/${id}`),
    calculate: (data) => api.post('/admin/commissions/calculate', data),
    update: (id, data) => api.put(`/admin/commissions/${id}`, data),
  },
  payouts: {
    list: (params) => api.get('/admin/payouts', { params }),
    get: (id) => api.get(`/admin/payouts/${id}`),
    create: (data) => api.post('/admin/payouts', data),
    update: (id, data) => api.put(`/admin/payouts/${id}`, data),
    process: (id, data) => api.post(`/admin/payouts/${id}/process`, data),
  },
};

// Accounting API
export const accountingAPI = {
  // Account Groups
  accountGroups: {
    list: (params) => api.get('/accounting/groups', { params }),
    getTree: () => api.get('/accounting/groups/tree'),
    get: (id) => api.get(`/accounting/groups/${id}`),
    create: (data) => api.post('/accounting/groups', data),
    update: (id, data) => api.put(`/accounting/groups/${id}`, data),
  },
  // Ledgers
  ledgers: {
    list: (params) => api.get('/accounting/ledgers', { params }),
    get: (id) => api.get(`/accounting/ledgers/${id}`),
    create: (data) => api.post('/accounting/ledgers', data),
    update: (id, data) => api.put(`/accounting/ledgers/${id}`, data),
    getBalance: (id, params) => api.get(`/accounting/ledgers/${id}/balance`, { params }),
  },
  // Voucher Types
  voucherTypes: {
    list: (params) => api.get('/accounting/voucher-types', { params }),
    get: (id) => api.get(`/accounting/voucher-types/${id}`),
    create: (data) => api.post('/accounting/voucher-types', data),
    update: (id, data) => api.put(`/accounting/voucher-types/${id}`, data),
  },
  // Vouchers
  vouchers: {
    list: (params) => api.get('/accounting/vouchers', { params }),
    get: (id) => api.get(`/accounting/vouchers/${id}`),
    create: (data) => api.post('/accounting/vouchers', data),
    update: (id, data) => api.put(`/accounting/vouchers/${id}`, data),
    post: (id) => api.post(`/accounting/vouchers/${id}/post`),
    cancel: (id, data) => api.post(`/accounting/vouchers/${id}/cancel`, data),
  },
  // Transactions
  transactions: {
    createSalesInvoice: (data) => api.post('/accounting/invoices/sales', data),
    createPurchaseInvoice: (data) => api.post('/accounting/invoices/purchase', data),
    createPayment: (data) => api.post('/accounting/payments', data),
    createReceipt: (data) => api.post('/accounting/receipts', data),
    createJournal: (data) => api.post('/accounting/journals', data),
    createContra: (data) => api.post('/accounting/contra', data),
  },
  // Bill-wise
  bills: {
    getOutstanding: (params) => api.get('/accounting/outstanding', { params }),
    allocate: (data) => api.post('/accounting/bills/allocate', data),
    getAging: (params) => api.get('/accounting/bills/aging', { params }),
  },
};

// Reports API
export const reportsAPI = {
  trialBalance: (params) => api.get('/reports/trial-balance', { params }),
  balanceSheet: (params) => api.get('/reports/balance-sheet', { params }),
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  ledgerStatement: (params) => api.get('/reports/ledger-statement', { params }),
};

// GST API
export const gstAPI = {
  gstins: {
    list: (params) => api.get('/gst/gstins', { params }),
    create: (data) => api.post('/gst/gstins', data),
    update: (id, data) => api.put(`/gst/gstins/${id}`, data),
  },
  rates: {
    list: (params) => api.get('/gst/rates', { params }),
    create: (data) => api.post('/gst/rates', data),
  },
  returns: {
    list: (params) => api.get('/gst/returns', { params }),
    generateGSTR1: (data) => api.post('/gst/returns/gstr1', data),
    generateGSTR3B: (data) => api.post('/gst/returns/gstr3b', data),
  },
};

// TDS API
export const tdsAPI = {
  list: (params) => api.get('/tds', { params }),
  calculate: (data) => api.post('/tds/calculate', data),
  generateReturn: (data) => api.post('/tds/return', data),
  generateCertificate: (id) => api.get(`/tds/certificate/${id}`),
};

// E-Invoice API
export const eInvoiceAPI = {
  list: (params) => api.get('/einvoice', { params }),
  generate: (data) => api.post('/einvoice/generate', data),
  get: (voucherId) => api.get(`/einvoice/voucher/${voucherId}`),
  cancel: (voucherId, data) => api.post(`/einvoice/cancel/${voucherId}`, data),
};

// Referral API
export const referralAPI = {
  verifyCode: (code) => api.post('/referrals/verify', { code }),
  getMyCode: () => api.get('/referrals/my-code'),
  createCode: (data) => api.post('/referrals', data),
  listCodes: (params) => api.get('/referrals', { params }),
  getRewards: (params) => api.get('/referrals/rewards', { params }),
};

// Commission API (for salesmen/distributors)
export const commissionAPI = {
  list: (params) => api.get('/commissions', { params }),
  get: (id) => api.get(`/commissions/${id}`),
};

// Payout API (for salesmen/distributors)
export const payoutAPI = {
  list: (params) => api.get('/payouts', { params }),
  get: (id) => api.get(`/payouts/${id}`),
};

// Pricing API
export const pricingAPI = {
  listPlans: (params) => api.get('/pricing', { params }),
  createPlan: (data) => api.post('/pricing', data),
  updatePlan: (id, data) => api.put(`/pricing/${id}`, data),
  getPlan: (id) => api.get(`/pricing/${id}`),
};

// File API
export const fileAPI = {
  upload: (formData) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  download: (filePath) => {
    return api.get(`/files/${filePath}`, {
      responseType: 'blob',
    });
  },
};

// Legacy Client API (for backward compatibility)
export const clientAPI = {
  dashboard: () => tenantAPI.getProfile(),
  vouchers: accountingAPI.vouchers,
  ledgers: accountingAPI.ledgers,
  reports: reportsAPI,
};

export default api;
