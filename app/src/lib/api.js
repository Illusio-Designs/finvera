import { apiClient } from './apiClient';

// Authentication APIs
export const authAPI = {
  login: (email, password, portalType, companyId) => apiClient.post('/auth/login', { email, password, company_id: companyId }),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
  verifyToken: () => apiClient.get('/auth/verify'),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

// User Profile APIs
export const profileAPI = {
  get: () => apiClient.get('/profile'),
  update: (data) => apiClient.put('/profile', data),
  changePassword: (data) => apiClient.post('/profile/change-password', data),
};

// Company Management APIs
export const companyAPI = {
  list: () => apiClient.get('/companies'),
  create: (data) => apiClient.post('/companies', data),
  update: (id, data) => apiClient.put(`/companies/${id}`, data),
  delete: (id) => apiClient.delete(`/companies/${id}`),
  get: (id) => apiClient.get(`/companies/${id}`),
};

// Branch Management APIs
export const branchAPI = {
  list: () => apiClient.get('/branches'),
  create: (data) => apiClient.post('/branches', data),
  update: (id, data) => apiClient.put(`/branches/${id}`, data),
  delete: (id) => apiClient.delete(`/branches/${id}`),
  get: (id) => apiClient.get(`/branches/${id}`),
};

// Accounting APIs
export const accountingAPI = {
  dashboard: () => apiClient.get('/accounting/dashboard'),
  ledgers: {
    list: (params) => apiClient.get('/ledgers', { params }),
    create: (data) => apiClient.post('/ledgers', data),
    update: (id, data) => apiClient.put(`/ledgers/${id}`, data),
    delete: (id) => apiClient.delete(`/ledgers/${id}`),
    get: (id) => apiClient.get(`/ledgers/${id}`),
    statement: (id, params) => apiClient.get(`/ledgers/${id}/statement`, { params }),
    transactions: (id, params) => apiClient.get(`/ledgers/${id}/transactions`, { params }),
  },
  outstanding: (params) => apiClient.get('/accounting/outstanding', { params }),
};

// Voucher APIs
export const voucherAPI = {
  list: (params) => apiClient.get('/vouchers', { params }),
  create: (data) => apiClient.post('/vouchers', data),
  update: (id, data) => apiClient.put(`/vouchers/${id}`, data),
  delete: (id) => apiClient.delete(`/vouchers/${id}`),
  get: (id) => apiClient.get(`/vouchers/${id}`),
  types: () => apiClient.get('/voucher-types'),
  salesInvoice: {
    create: (data) => apiClient.post('/vouchers/sales-invoice', data),
    update: (id, data) => apiClient.put(`/vouchers/sales-invoice/${id}`, data),
    get: (id) => apiClient.get(`/vouchers/sales-invoice/${id}`),
  },
  purchaseInvoice: {
    create: (data) => apiClient.post('/vouchers/purchase-invoice', data),
    update: (id, data) => apiClient.put(`/vouchers/purchase-invoice/${id}`, data),
    get: (id) => apiClient.get(`/vouchers/purchase-invoice/${id}`),
  },
  payment: {
    create: (data) => apiClient.post('/vouchers/payment', data),
    update: (id, data) => apiClient.put(`/vouchers/payment/${id}`, data),
  },
  receipt: {
    create: (data) => apiClient.post('/vouchers/receipt', data),
    update: (id, data) => apiClient.put(`/vouchers/receipt/${id}`, data),
  },
};

// Inventory APIs
export const inventoryAPI = {
  items: {
    list: (params) => apiClient.get('/inventory/items', { params }),
    create: (data) => apiClient.post('/inventory/items', data),
    update: (id, data) => apiClient.put(`/inventory/items/${id}`, data),
    delete: (id) => apiClient.delete(`/inventory/items/${id}`),
    get: (id) => apiClient.get(`/inventory/items/${id}`),
  },
  adjustments: {
    list: (params) => apiClient.get('/inventory/adjustments', { params }),
    create: (data) => apiClient.post('/inventory/adjustments', data),
    get: (id) => apiClient.get(`/inventory/adjustments/${id}`),
  },
  transfers: {
    list: (params) => apiClient.get('/inventory/transfers', { params }),
    create: (data) => apiClient.post('/inventory/transfers', data),
    get: (id) => apiClient.get(`/inventory/transfers/${id}`),
  },
  warehouses: {
    list: () => apiClient.get('/warehouses'),
    create: (data) => apiClient.post('/warehouses', data),
    update: (id, data) => apiClient.put(`/warehouses/${id}`, data),
    delete: (id) => apiClient.delete(`/warehouses/${id}`),
  },
  attributes: {
    list: () => apiClient.get('/attributes'),
    create: (data) => apiClient.post('/attributes', data),
    update: (id, data) => apiClient.put(`/attributes/${id}`, data),
    delete: (id) => apiClient.delete(`/attributes/${id}`),
  },
};

// GST APIs
export const gstAPI = {
  gstins: {
    list: () => apiClient.get('/gst/gstins'),
    create: (data) => apiClient.post('/gst/gstins', data),
    update: (id, data) => apiClient.put(`/gst/gstins/${id}`, data),
    delete: (id) => apiClient.delete(`/gst/gstins/${id}`),
    get: (id) => apiClient.get(`/gst/gstins/${id}`),
    setDefault: (id) => apiClient.post(`/gst/gstins/${id}/set-default`),
  },
  rates: {
    list: () => apiClient.get('/gst/rates'),
    create: (data) => apiClient.post('/gst/rates', data),
    update: (id, data) => apiClient.put(`/gst/rates/${id}`, data),
  },
  returns: {
    gstr1: (params) => apiClient.get('/gst/returns/gstr1', { params }),
    gstr3b: (params) => apiClient.get('/gst/returns/gstr3b', { params }),
    file: (type, data) => apiClient.post(`/gst/returns/${type}/file`, data),
  },
  einvoice: {
    generate: (data) => apiClient.post('/gst/einvoice/generate', data),
    cancel: (id) => apiClient.post(`/gst/einvoice/${id}/cancel`),
    list: (params) => apiClient.get('/gst/einvoice', { params }),
  },
  ewaybill: {
    generate: (data) => apiClient.post('/gst/ewaybill/generate', data),
    cancel: (id) => apiClient.post(`/gst/ewaybill/${id}/cancel`),
    list: (params) => apiClient.get('/gst/ewaybill', { params }),
  },
  analytics: (params) => apiClient.get('/gst/analytics', { params }),
};

// Reports APIs
export const reportsAPI = {
  stats: () => apiClient.get('/reports/stats'),
  balanceSheet: (params) => apiClient.get('/reports/balance-sheet', { params }),
  profitLoss: (params) => apiClient.get('/reports/profit-loss', { params }),
  trialBalance: (params) => apiClient.get('/reports/trial-balance', { params }),
  ledgerStatement: (id, params) => apiClient.get(`/reports/ledger-statement/${id}`, { params }),
  stockLedger: (params) => apiClient.get('/reports/stock-ledger', { params }),
  stockSummary: (params) => apiClient.get('/reports/stock-summary', { params }),
  categories: () => apiClient.get('/reports/categories'),
};

// Notification APIs
export const notificationAPI = {
  list: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  preferences: {
    get: () => apiClient.get('/notifications/preferences'),
    update: (data) => apiClient.put('/notifications/preferences', data),
  },
  test: {
    push: () => apiClient.post('/notifications/test/push'),
    email: () => apiClient.post('/notifications/test/email'),
  },
};

// Support APIs
export const clientSupportAPI = {
  tickets: {
    list: (params) => apiClient.get('/support/tickets', { params }),
    create: (data) => apiClient.post('/support/tickets', data),
    update: (id, data) => apiClient.put(`/support/tickets/${id}`, data),
    get: (id) => apiClient.get(`/support/tickets/${id}`),
    messages: (id) => apiClient.get(`/support/tickets/${id}/messages`),
    addMessage: (id, data) => apiClient.post(`/support/tickets/${id}/messages`, data),
  },
};

// Loan APIs (FinBox Integration)
export const finboxAPI = {
  saveConsent: (data) => apiClient.post('/finbox/consent', data),
  checkEligibility: () => apiClient.get('/finbox/eligibility'),
  applyLoan: (data) => apiClient.post('/finbox/apply', data),
  loanStatus: () => apiClient.get('/finbox/status'),
};

// Legacy export for backward compatibility
export { apiClient as api };