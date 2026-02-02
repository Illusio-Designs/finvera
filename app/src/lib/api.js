import { apiClient } from './apiClient';

// Authentication APIs
export const authAPI = {
  authenticate: (email, password) => apiClient.post('/auth/authenticate', { email, password }),
  login: (email, password, portalType, companyId, authenticatedUserId) => 
    apiClient.post('/auth/login', { 
      email, 
      password, 
      company_id: companyId,
      authenticated_user_id: authenticatedUserId 
    }),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
  verifyToken: () => apiClient.get('/auth/verify'),
  refreshToken: () => apiClient.post('/auth/refresh'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  uploadProfileImage: (formData) => apiClient.post('/auth/profile/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  switchCompany: (companyId) => apiClient.post('/auth/switch-company', { company_id: companyId }),
};

// User Profile APIs (using auth endpoints as per backend)
export const profileAPI = {
  get: () => apiClient.get('/auth/profile'),
  update: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
};

// Company Management APIs
export const companyAPI = {
  list: () => apiClient.get('/companies'),
  create: (data) => apiClient.post('/companies', data),
  update: (id, data) => apiClient.put(`/companies/${id}`, data),
  delete: (id) => apiClient.delete(`/companies/${id}`),
  get: (id) => apiClient.get(`/companies/${id}`),
};

// Tenant Management APIs
export const tenantAPI = {
  getProfile: () => apiClient.get('/tenants/profile'),
  updateProfile: (data) => apiClient.put('/tenants/profile', data),
};

// Branch Management APIs (fixed to match backend structure)
export const branchAPI = {
  list: (companyId) => apiClient.get(`/branches/company/${companyId}`),
  create: (data) => apiClient.post('/branches', data),
  update: (id, data) => apiClient.put(`/branches/${id}`, data),
  delete: (id) => apiClient.delete(`/branches/${id}`),
  get: (id) => apiClient.get(`/branches/${id}`),
};

// Accounting APIs
export const accountingAPI = {
  dashboard: () => apiClient.get('/accounting/dashboard'),
  accountGroups: {
    list: () => apiClient.get('/accounting/groups'),
    tree: () => apiClient.get('/accounting/groups/tree'),
    get: (id) => apiClient.get(`/accounting/groups/${id}`),
  },
  ledgers: {
    list: (params) => apiClient.get('/accounting/ledgers', { params }),
    create: (data) => apiClient.post('/accounting/ledgers', data),
    update: (id, data) => apiClient.put(`/accounting/ledgers/${id}`, data),
    delete: (id) => apiClient.delete(`/accounting/ledgers/${id}`),
    get: (id) => apiClient.get(`/accounting/ledgers/${id}`),
    balance: (id, params) => apiClient.get(`/accounting/ledgers/${id}/balance`, { params }),
    statement: (id, params) => apiClient.get('/reports/ledger-statement', { 
      params: { ...params, ledger_id: id } 
    }),
    transactions: (id, params) => apiClient.get(`/accounting/ledgers/${id}/transactions`, { params }),
  },
  outstanding: (params) => apiClient.get('/accounting/outstanding', { params }),
  // Tally Import
  tallyImport: {
    getTemplate: () => apiClient.get('/accounting/tally-import/template'),
    import: (formData, onProgress) => {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        };
      }
      return apiClient.post('/accounting/tally-import', formData, config);
    },
  },
};

// Voucher APIs
export const voucherAPI = {
  list: (params) => apiClient.get('/accounting/vouchers', { params }),
  create: (data) => apiClient.post('/accounting/vouchers', data),
  update: (id, data) => apiClient.put(`/accounting/vouchers/${id}`, data),
  delete: (id) => apiClient.delete(`/accounting/vouchers/${id}`),
  get: (id) => apiClient.get(`/accounting/vouchers/${id}`),
  types: () => apiClient.get('/accounting/voucher-types'),
  salesInvoice: {
    create: (data) => apiClient.post('/accounting/invoices/sales', data),
    update: (id, data) => apiClient.put(`/accounting/vouchers/sales-invoice/${id}`, data),
    get: (id) => apiClient.get(`/accounting/vouchers/sales-invoice/${id}`),
  },
  purchaseInvoice: {
    create: (data) => apiClient.post('/accounting/invoices/purchase', data),
    update: (id, data) => apiClient.put(`/accounting/vouchers/purchase-invoice/${id}`, data),
    get: (id) => apiClient.get(`/accounting/vouchers/purchase-invoice/${id}`),
  },
  payment: {
    create: (data) => apiClient.post('/accounting/vouchers/payment', data),
    update: (id, data) => apiClient.put(`/accounting/vouchers/payment/${id}`, data),
  },
  receipt: {
    create: (data) => apiClient.post('/accounting/vouchers/receipt', data),
    update: (id, data) => apiClient.put(`/accounting/vouchers/receipt/${id}`, data),
  },
};

// Inventory APIs
export const inventoryAPI = {
  items: {
    list: (params) => apiClient.get('/accounting/inventory/items', { params }),
    create: (data) => apiClient.post('/accounting/inventory/items', data),
    update: (id, data) => apiClient.put(`/accounting/inventory/items/${id}`, data),
    delete: (id) => apiClient.delete(`/accounting/inventory/items/${id}`),
    get: (id) => apiClient.get(`/accounting/inventory/items/${id}`),
  },
  adjustments: {
    list: (params) => apiClient.get('/accounting/stock-adjustments', { params }),
    create: (data) => apiClient.post('/accounting/stock-adjustments', data),
    get: (id) => apiClient.get(`/accounting/stock-adjustments/${id}`),
  },
  transfers: {
    list: (params) => apiClient.get('/accounting/stock-transfers', { params }),
    create: (data) => apiClient.post('/accounting/stock-transfers', data),
    get: (id) => apiClient.get(`/accounting/stock-transfers/${id}`),
  },
  warehouses: {
    list: () => apiClient.get('/accounting/warehouses'),
    create: (data) => apiClient.post('/accounting/warehouses', data),
    update: (id, data) => apiClient.put(`/accounting/warehouses/${id}`, data),
    delete: (id) => apiClient.delete(`/accounting/warehouses/${id}`),
  },
  attributes: {
    list: () => apiClient.get('/attributes'),
    create: (data) => apiClient.post('/attributes', data),
    update: (id, data) => apiClient.put(`/attributes/${id}`, data),
    delete: (id) => apiClient.delete(`/attributes/${id}`),
  },
};

// GST APIs (fixed analytics endpoint)
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
    get: (hsn) => apiClient.get(`/gst/rate?hsn=${hsn}`),
  },
  returns: {
    list: () => apiClient.get('/gst/returns'),
    gstr1: (data) => apiClient.post('/gst/returns/gstr1', data),
    gstr3b: (data) => apiClient.post('/gst/returns/gstr3b', data),
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
  validate: (gstin) => apiClient.post('/gst/validate', { gstin }),
  details: (gstin) => apiClient.get(`/gst/details/${gstin}`),
  analytics: {
    gstr2aReconciliation: (data) => apiClient.post('/gst/analytics/gstr2a-reconciliation', data),
    getReconciliationStatus: (jobId) => apiClient.get(`/gst/analytics/gstr2a-reconciliation/${jobId}`),
    uploadPurchaseLedger: (data) => apiClient.post('/gst/analytics/upload-purchase-ledger', data),
  },
};

// Reports APIs (removed non-existent stats endpoint)
export const reportsAPI = {
  balanceSheet: (params) => apiClient.get('/reports/balance-sheet', { params }),
  profitLoss: (params) => apiClient.get('/reports/profit-loss', { params }),
  trialBalance: (params) => apiClient.get('/reports/trial-balance', { params }),
  ledgerStatement: (params) => apiClient.get('/reports/ledger-statement', { params }),
  stockLedger: (params) => apiClient.get('/reports/stock-ledger', { params }),
  stockSummary: (params) => apiClient.get('/reports/stock-summary', { params }),
};

// Notification APIs (removed non-existent test endpoints)
export const notificationAPI = {
  list: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
  preferences: {
    get: () => apiClient.get('/notifications/preferences'),
    update: (data) => apiClient.put('/notifications/preferences', data),
  },
};

// Support APIs
export const clientSupportAPI = {
  tickets: {
    list: (params) => apiClient.get('/support/my-tickets', { params }),
    create: (data) => apiClient.post('/support/tickets', data),
    update: (id, data) => apiClient.put(`/support/my-tickets/${id}`, data),
    get: (id) => apiClient.get(`/support/my-tickets/${id}`),
    messages: (id) => apiClient.get(`/support/tickets/${id}/messages`),
    addMessage: (id, data) => apiClient.post(`/support/tickets/${id}/messages`, data),
  },
};

// Loan APIs (FinBox Integration)
export const finboxAPI = {
  // Consent management
  saveConsent: (data) => apiClient.post('/finbox/consent', data),
  getConsent: () => apiClient.get('/finbox/consent'),
  
  // Credit scoring
  getCreditScore: (data) => apiClient.post('/finbox/credit-score', data),
  getInclusionScore: (customerId) => apiClient.get(`/finbox/inclusion-score/${customerId}`),
  
  // Loan eligibility and application
  checkEligibility: (data) => apiClient.post('/finbox/eligibility', data),
  
  // User management
  createUser: (data) => apiClient.post('/finbox/user', data),
  
  // Bank statement integration
  initiateBankStatement: (data) => apiClient.post('/finbox/bank-statement/initiate', data),
  getBankStatementStatus: (customerId) => apiClient.get(`/finbox/bank-statement/${customerId}/status`),
  getBankStatementAnalysis: (customerId) => apiClient.get(`/finbox/bank-statement/${customerId}/analysis`),
  
  // Device insights
  getDeviceInsights: (data) => apiClient.post('/finbox/device-insights', data),
  
  // Session management
  generateSessionToken: (data) => apiClient.post('/finbox/session', data),
};

// Search APIs (simplified to match backend universal search)
export const searchAPI = {
  universal: (params) => apiClient.get('/search', { params }),
};

// Tax APIs (TDS, TCS, Income Tax)
export const taxAPI = {
  tds: {
    list: (params) => apiClient.get('/tds', { params }),
    calculate: (data) => apiClient.post('/tds/calculate', data),
    generateReturn: (data) => apiClient.post('/tds/generate-return', data),
    generateCertificate: (id) => apiClient.post(`/tds/${id}/generate-certificate`),
    getReturnStatus: (returnId) => apiClient.get(`/tds/return-status/${returnId}`),
    // Analytics APIs
    createPotentialNoticeJob: (data) => apiClient.post('/tds/analytics/potential-notice', data),
    getAnalyticsJobStatus: (jobId) => apiClient.get(`/tds/analytics/job-status/${jobId}`),
    // Calculator APIs
    calculateNonSalary: (data) => apiClient.post('/tds/calculator/non-salary', data),
    // Compliance APIs
    check206AB: (data) => apiClient.post('/tds/compliance/206ab', data),
    generateCSIOTP: (data) => apiClient.post('/tds/compliance/csi-otp', data),
    downloadCSI: (data) => apiClient.post('/tds/compliance/download-csi', data),
    // Reports APIs
    submitTCSReport: (data) => apiClient.post('/tds/reports/tcs-report', data),
    getTCSReportStatus: (jobId) => apiClient.get(`/tds/reports/tcs-report/${jobId}`),
    searchTCSReports: (data) => apiClient.post('/tds/reports/search-tcs', data),
  },
  incomeTax: {
    calculate: (data) => apiClient.post('/income-tax/calculate', data),
    getSlabs: (params) => apiClient.get('/income-tax/slabs', { params }),
    generateReturn: (data) => apiClient.post('/income-tax/generate-return', data),
  },
};

// Subscription APIs
export const subscriptionAPI = {
  getCurrentSubscription: () => apiClient.get('/subscriptions/current'),
  createSubscription: (data) => apiClient.post('/subscriptions', data),
  updateSubscription: (id, data) => apiClient.put(`/subscriptions/${id}`, data),
  cancelSubscription: (data) => apiClient.post('/subscriptions/cancel', data),
  verifyPayment: (data) => apiClient.post('/subscriptions/verify-payment', data),
  getPaymentHistory: () => apiClient.get('/subscriptions/payment-history'),
};

// Pricing APIs
export const pricingAPI = {
  list: (params) => apiClient.get('/pricing', { params }),
  get: (id) => apiClient.get(`/pricing/${id}`),
};

// Review APIs
export const reviewAPI = {
  getPublic: (params) => apiClient.get('/reviews/public', { params }),
  getMy: () => apiClient.get('/reviews/my'),
  submit: (data) => apiClient.post('/reviews', data),
  update: (id, data) => apiClient.put(`/reviews/my/${id}`, data),
};

// Tools APIs (for backward compatibility with existing backend)
export const toolsAPI = {
  tallyImport: {
    upload: (data) => apiClient.post('/accounting/tally-import', data),
    history: () => {
      // Since backend doesn't have history endpoint, return empty array
      return Promise.resolve({ data: { data: [] } });
    },
    status: (id) => {
      // Since backend doesn't have status endpoint, return completed status
      return Promise.resolve({ data: { status: 'completed' } });
    },
  },
};

// Referral APIs (Simplified)
export const referralAPI = {
  // Get user's referral code
  getMyCode: () => apiClient.get('/referrals/my-code'),
  
  // Verify a referral code (public endpoint for registration)
  verifyCode: (code) => apiClient.post('/referrals/verify', { code }),
  
  // Get current discount configuration
  getCurrentDiscountConfig: () => apiClient.get('/referrals/discount-config/current'),
  
  // Admin-only endpoints
  getAnalytics: (params) => apiClient.get('/referrals/analytics', { params }),
  getAllCodes: (params) => apiClient.get('/referrals', { params }),
};

// Legacy export for backward compatibility
export { apiClient as api };