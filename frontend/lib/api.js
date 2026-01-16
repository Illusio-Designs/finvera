import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const companyId = Cookies.get("companyId");
    if (companyId) {
      config.headers["X-Company-Id"] = companyId;
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
        const refreshToken = Cookies.get("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          Cookies.set("token", accessToken, { expires: 7 });
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        // BUT: Don't redirect if we're already on the login page (to prevent refresh loop)
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        Cookies.remove("user");
        Cookies.remove("jti");
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          // Only redirect if NOT already on login page
          if (!path.includes("/login")) {
            if (path.startsWith("/admin")) {
              window.location.href = "/admin/login";
            } else if (path.startsWith("/client")) {
              window.location.href = "/client/login";
            }
          }
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // BUT: Don't redirect if we're already on the login page (to prevent refresh loop)
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      Cookies.remove("user");
      Cookies.remove("jti");
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        // Only redirect if NOT already on login page
        if (!path.includes("/login")) {
          if (path.startsWith("/admin")) {
            window.location.href = "/admin/login";
          } else if (path.startsWith("/client")) {
            window.location.href = "/client/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: (data) => api.post("/auth/logout", data),
  refresh: (data) => api.post("/auth/refresh", data),
  switchCompany: (company_id) => api.post("/auth/switch-company", { company_id }),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  uploadProfileImage: (formData) => {
    return api.post("/auth/profile/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
};

// Tenant API (not in backend docs, keeping for backward compatibility)
export const tenantAPI = {
  getProfile: () => api.get("/tenants/profile"),
  updateProfile: (data) => api.put("/tenants/profile", data),
};

// Company API (tenant-side)
export const companyAPI = {
  list: () => api.get("/companies"),
  status: () => api.get("/companies/status"),
  create: (data) => api.post("/companies", data),
  get: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  uploadLogo: (id, formData) => {
    return api.post(`/companies/${id}/upload-logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadSignature: (id, formData) => {
    return api.post(`/companies/${id}/upload-signature`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadDSCCertificate: (id, formData) => {
    return api.post(`/companies/${id}/upload-dsc-certificate`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateDSCConfig: (id, data) => {
    return api.put(`/companies/${id}/dsc-config`, data);
  },
};

export const hsnAPI = {
  search: (q, params = {}) => api.get("/hsn/search", { params: { q, ...params } }),
  get: (code) => api.get(`/hsn/${code}`),
};

// Admin API
export const adminAPI = {
  dashboard: () => api.get("/admin/dashboard"),
  analytics: {
    revenue: (params) => api.get("/admin/analytics/revenue", { params }),
  },
  tenants: {
    list: (params) => api.get("/admin/tenants", { params }),
    get: (id) => api.get(`/admin/tenants/${id}`),
    create: (data) => api.post("/admin/tenants", data),
    update: (id, data) => api.put(`/admin/tenants/${id}`, data),
    delete: (id) => api.delete(`/admin/tenants/${id}`),
    provision: (id) => api.post(`/admin/tenants/${id}/provision`),
  },
  users: {
    list: (params) => api.get("/admin/users", { params }),
    get: (id) => api.get(`/admin/users/${id}`),
    create: (data) => api.post("/admin/users", data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`),
  },
  distributors: {
    list: (params) => api.get("/admin/distributors", { params }),
    get: (id) => api.get(`/admin/distributors/${id}`),
    create: (data) => api.post("/admin/distributors", data),
    update: (id, data) => api.put(`/admin/distributors/${id}`, data),
    delete: (id) => api.delete(`/admin/distributors/${id}`),
    dashboard: () => api.get("/admin/distributors/dashboard"),
  },
  salesmen: {
    list: (params) => api.get("/admin/salesmen", { params }),
    get: (id) => api.get(`/admin/salesmen/${id}`),
    create: (data) => api.post("/admin/salesmen", data),
    update: (id, data) => api.put(`/admin/salesmen/${id}`, data),
    delete: (id) => api.delete(`/admin/salesmen/${id}`),
    getPerformance: (id, params) => api.get(`/admin/salesmen/${id}/performance`, { params }),
    getLeads: (id, params) => api.get(`/admin/salesmen/${id}/leads`, { params }),
    dashboard: () => api.get("/admin/salesmen/dashboard"),
  },
  commissions: {
    list: (params) => api.get("/admin/commissions", { params }),
    get: (id) => api.get(`/admin/commissions/${id}`),
    summary: (params) => api.get("/admin/commissions/summary", { params }),
  },
  payouts: {
    list: (params) => api.get("/admin/payouts", { params }),
    get: (id) => api.get(`/admin/payouts/${id}`),
    create: (data) => api.post("/admin/payouts", data),
    process: (id, data) => api.post(`/admin/payouts/${id}/process`, data),
    generate: (data) => api.post("/admin/payouts/generate", data),
  },
  commissionPayouts: {
    summary: (params) => api.get("/admin/commissions-payouts/summary", { params }),
    updateStatus: (role, userId, data) => api.put(`/admin/commissions-payouts/${role}/${userId}/status`, data),
  },
  referrals: {
    list: (params) => api.get("/admin/referrals", { params }),
    get: (id) => api.get(`/admin/referrals/${id}`),
    create: (data) => api.post("/admin/referrals", data),
    update: (id, data) => api.put(`/admin/referrals/${id}`, data),
    delete: (id) => api.delete(`/admin/referrals/${id}`),
    rewards: (params) => api.get("/admin/referrals/rewards", { params }),
  },
  targets: {
    list: (params) => api.get("/admin/targets", { params }),
    get: (id) => api.get(`/admin/targets/${id}`),
    create: (data) => api.post("/admin/targets", data),
    update: (id, data) => api.put(`/admin/targets/${id}`, data),
    delete: (id) => api.delete(`/admin/targets/${id}`),
    getDistributorTargets: (id) => api.get(`/admin/targets/distributor/${id}`),
    getSalesmanTargets: (id) => api.get(`/admin/targets/salesman/${id}`),
    recalculate: (id) => api.post(`/admin/targets/${id}/recalculate`),
    recalculateAll: (params) => api.post("/admin/targets/recalculate/all", null, { params }),
  },
  support: {
    tickets: {
      list: (params) => api.get("/support/tickets", { params }),
      get: (id) => api.get(`/support/tickets/${id}`),
      assign: (id, data) => api.put(`/support/tickets/${id}/assign`, data),
      updateStatus: (id, data) => api.put(`/support/tickets/${id}/status`, data),
      addMessage: (id, data) => api.post(`/support/tickets/${id}/messages`, data),
    },
    agents: {
      getReviews: (agentId) => api.get(`/support/agents/${agentId}/reviews`),
    },
  },
  reports: {
    revenue: {
      total: (params) => api.get("/admin/reports/revenue/total", { params }),
      comparison: (params) => api.get("/admin/reports/revenue/comparison", { params }),
      byType: (params) => api.get("/admin/reports/revenue/by-type", { params }),
      trend: (params) => api.get("/admin/reports/revenue/trend", { params }),
    },
    commission: {
      summary: (params) => api.get("/admin/reports/commission/summary", { params }),
      distribution: (params) => api.get("/admin/reports/commission/distribution", { params }),
    },
    performance: {
      distributor: (params) => api.get("/admin/reports/performance/distributor", { params }),
      salesman: (params) => api.get("/admin/reports/performance/salesman", { params }),
      targets: (params) => api.get("/admin/reports/performance/targets", { params }),
    },
    categorization: {
      distributor: (params) => api.get("/admin/reports/categorization/distributor", { params }),
      salesman: (params) => api.get("/admin/reports/categorization/salesman", { params }),
    },
    tenant: {
      acquisition: (params) => api.get("/admin/reports/tenant/acquisition", { params }),
    },
    summary: {
      executive: (params) => api.get("/admin/reports/summary/executive", { params }),
      financial: (params) => api.get("/admin/reports/summary/financial", { params }),
    },
  },
};

// Accounting API
export const accountingAPI = {
  // Dashboard
  dashboard: () => api.get("/accounting/dashboard"),
  // Account Groups
  accountGroups: {
    list: (params) => api.get("/accounting/groups", { params }),
    get: (id) => api.get(`/accounting/groups/${id}`),
    create: (data) => api.post("/accounting/groups", data),
    update: (id, data) => api.put(`/accounting/groups/${id}`, data),
    delete: (id) => api.delete(`/accounting/groups/${id}`),
    getTree: () => api.get("/accounting/groups/tree"),
  },
  // Invoices
  invoices: {
    createSales: (data) => api.post("/accounting/invoices/sales", data),
    createPurchase: (data) => api.post("/accounting/invoices/purchase", data),
  },
  // Payments & Receipts
  payments: {
    create: (data) => api.post("/accounting/payments", data),
  },
  receipts: {
    create: (data) => api.post("/accounting/receipts", data),
  },
  // Journals
  journals: {
    create: (data) => api.post("/accounting/journals", data),
  },
  // Contra
  contra: {
    create: (data) => api.post("/accounting/contra", data),
  },
  // Vouchers
  vouchers: {
    list: (params) => api.get("/accounting/vouchers", { params }),
    get: (id) => api.get(`/accounting/vouchers/${id}`),
    create: (data) => api.post("/accounting/vouchers", data),
    update: (id, data) => api.put(`/accounting/vouchers/${id}`, data),
    delete: (id) => api.delete(`/accounting/vouchers/${id}`),
    post: (id) => api.post(`/accounting/vouchers/${id}/post`),
    cancel: (id) => api.post(`/accounting/vouchers/${id}/cancel`),
  },
  // Ledgers
  ledgers: {
    list: (params) => api.get("/accounting/ledgers", { params }),
    get: (id) => api.get(`/accounting/ledgers/${id}`),
    create: (data) => api.post("/accounting/ledgers", data),
    update: (id, data) => api.put(`/accounting/ledgers/${id}`, data),
    delete: (id) => api.delete(`/accounting/ledgers/${id}`),
    getBalance: (id, params) =>
      api.get(`/accounting/ledgers/${id}/balance`, { params }),
  },
  // Outstanding & Bills
  outstanding: {
    get: (params) => api.get("/accounting/outstanding", { params }),
  },
  bills: {
    allocate: (data) => api.post("/accounting/bills/allocate", data),
    getAging: (params) => api.get("/accounting/bills/aging", { params }),
  },
  // Inventory Items
  inventory: {
    items: {
      list: (params) => api.get("/accounting/inventory/items", { params }),
      get: (id) => api.get(`/accounting/inventory/items/${id}`),
      create: (data) => api.post("/accounting/inventory/items", data),
      update: (id, data) => api.put(`/accounting/inventory/items/${id}`, data),
      delete: (id) => api.delete(`/accounting/inventory/items/${id}`),
      setOpeningStock: (id, data) => api.post(`/accounting/inventory/items/${id}/opening-stock`, data),
      getWarehouseStock: (id, params) => api.get(`/accounting/inventory/items/${id}/warehouse-stock`, { params }),
      generateBarcode: (id, data) => api.post(`/accounting/inventory/items/${id}/generate-barcode`, data),
      bulkGenerateBarcodes: (data) => api.post("/accounting/inventory/items/bulk-generate-barcodes", data),
    },
  },
  // Warehouses
  warehouses: {
    list: (params) => api.get("/accounting/warehouses", { params }),
    getAll: (params) => api.get("/accounting/warehouses/all", { params }),
    get: (id) => api.get(`/accounting/warehouses/${id}`),
    create: (data) => api.post("/accounting/warehouses", data),
    update: (id, data) => api.put(`/accounting/warehouses/${id}`, data),
    delete: (id) => api.delete(`/accounting/warehouses/${id}`),
  },
  // Stock Adjustments
  stockAdjustments: {
    list: (params) => api.get("/accounting/stock-adjustments", { params }),
    create: (data) => api.post("/accounting/stock-adjustments", data),
  },
  // Stock Transfers
  stockTransfers: {
    list: (params) => api.get("/accounting/stock-transfers", { params }),
    create: (data) => api.post("/accounting/stock-transfers", data),
  },
  // Tally Import
  tallyImport: {
    getTemplate: () => api.get("/accounting/tally-import/template"),
    import: (formData, onUploadProgress) => {
      // Create a new axios instance for file uploads to avoid Content-Type override
      const token = Cookies.get("token");
      const companyId = Cookies.get("companyId");
      
      const uploadApi = axios.create({
        baseURL: API_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(companyId && { 'X-Company-Id': companyId }),
        },
      });
      
      return uploadApi.post("/accounting/tally-import", formData, {
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percentCompleted);
          }
        },
      });
    },
  },
};

// Reports API
export const reportsAPI = {
  trialBalance: (params) => api.get("/reports/trial-balance", { params }),
  balanceSheet: (params) => api.get("/reports/balance-sheet", { params }),
  profitLoss: (params) => api.get("/reports/profit-loss", { params }),
  ledgerStatement: (params) => api.get("/reports/ledger-statement", { params }),
  stockSummary: (params) => api.get("/reports/stock-summary", { params }),
  stockLedger: (params) => api.get("/reports/stock-ledger", { params }),
};

// GST API
export const gstAPI = {
  gstins: {
    list: (params) => api.get("/gst/gstins", { params }),
    get: (id) => api.get(`/gst/gstins/${id}`),
    create: (data) => api.post("/gst/gstins", data),
    update: (id, data) => api.put(`/gst/gstins/${id}`, data),
    delete: (id) => api.delete(`/gst/gstins/${id}`),
  },
  rates: {
    list: (params) => api.get("/gst/rates", { params }),
    create: (data) => api.post("/gst/rates", data),
  },
  returns: {
    generateGSTR1: (data) => api.post("/gst/returns/gstr1", data),
    generateGSTR3B: (data) => api.post("/gst/returns/gstr3b", data),
  },
};

// TDS API
export const tdsAPI = {
  list: (params) => api.get("/tds", { params }),
  calculate: (data) => api.post("/tds/calculate", data),
  generateReturn: (data) => api.post("/tds/return", data),
  getReturnStatus: (returnId, formType = '24Q') => api.get(`/tds/return/${returnId}/status`, { params: { form_type: formType } }),
  generateCertificate: (id) => api.get(`/tds/certificate/${id}`),
};

// E-Invoice API
export const eInvoiceAPI = {
  list: (params) => api.get("/einvoice", { params }),
  generate: (data) => api.post("/einvoice/generate", data),
  get: (voucherId) => api.get(`/einvoice/voucher/${voucherId}`),
  cancel: (voucherId, data) => api.post(`/einvoice/cancel/${voucherId}`, data),
  getIRNStatus: (irn) => api.get(`/einvoice/irn/${irn}/status`),
};

// E-Way Bill API
export const eWayBillAPI = {
  list: (params) => api.get("/ewaybill", { params }),
  generate: (data) => api.post("/ewaybill/generate", data),
  get: (voucherId) => api.get(`/ewaybill/voucher/${voucherId}`),
  cancel: (voucherId, data) => api.post(`/ewaybill/cancel/${voucherId}`, data),
  update: (ewayBillNo, data) => api.put(`/ewaybill/${ewayBillNo}`, data),
  extend: (ewayBillNo, data) => api.post(`/ewaybill/${ewayBillNo}/extend`, data),
  getStatus: (ewayBillNo) => api.get(`/ewaybill/${ewayBillNo}/status`),
};

// Additional APIs (not in backend docs, keeping for backward compatibility)
export const referralAPI = {
  verifyCode: (code) => api.post("/referrals/verify", { code }),
  getMyCode: () => api.get("/referrals/my-code"),
  createCode: (data) => api.post("/referrals", data),
  listCodes: (params) => api.get("/referrals", { params }),
  getRewards: (params) => api.get("/referrals/rewards", { params }),
  discountConfig: {
    getCurrent: () => api.get("/referrals/discount-config/current"),
    list: () => api.get("/referrals/discount-config"),
    create: (data) => api.post("/referrals/discount-config", data),
    update: (id, data) => api.put(`/referrals/discount-config/${id}`, data),
    delete: (id) => api.delete(`/referrals/discount-config/${id}`),
  },
};

export const commissionAPI = {
  list: (params) => api.get("/commissions", { params }),
  get: (id) => api.get(`/commissions/${id}`),
};

export const payoutAPI = {
  list: (params) => api.get("/payouts", { params }),
  get: (id) => api.get(`/payouts/${id}`),
};

// Blog API
export const blogAPI = {
  list: (params) => api.get("/blogs", { params }),
  get: (id) => api.get(`/blogs/${id}`),
  create: (data) => api.post("/blogs", data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
  categories: {
    list: () => api.get("/blog-categories"),
    create: (data) => api.post("/blog-categories", data),
  },
};

// SEO API
export const seoAPI = {
  list: (params) => api.get("/seo", { params }),
  get: (path) => api.get(`/seo/${path}`),
  create: (data) => api.post("/seo", data),
  update: (id, data) => api.put(`/seo/${id}`, data),
  delete: (id) => api.delete(`/seo/${id}`),
};

// Notification API
export const notificationAPI = {
  list: (params) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get("/notifications/preferences"),
  updatePreferences: (data) => api.put("/notifications/preferences", data),
};

export const pricingAPI = {
  list: (params) => api.get("/pricing", { params }),
  get: (id) => api.get(`/pricing/${id}`),
  create: (data) => api.post("/pricing", data),
  update: (id, data) => api.put(`/pricing/${id}`, data),
  delete: (id) => api.delete(`/pricing/${id}`),
};

// Subscription API
export const subscriptionAPI = {
  create: (data) => api.post("/subscriptions", data),
  getCurrent: () => api.get("/subscriptions/current"),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  cancel: (data) => api.post("/subscriptions/cancel", data),
  verifyPayment: (data) => api.post("/payments/verify", data),
  getPaymentHistory: () => api.get("/payments/history"),
};

// Branch API
export const branchAPI = {
  create: (data) => api.post("/branches", data),
  list: (companyId) => api.get(`/branches/company/${companyId}`),
  get: (id) => api.get(`/branches/${id}`),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

export const fileAPI = {
  upload: (formData) => {
    return api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  download: (filePath) => {
    return api.get(`/files/${filePath}`, {
      responseType: "blob",
    });
  },
};

// Client Support API
export const clientSupportAPI = {
  tickets: {
    create: (data) => api.post("/support/tickets", data),
    list: (params) => api.get("/support/my-tickets", { params }),
    get: (id) => api.get(`/support/my-tickets/${id}`),
    addMessage: (id, data) => api.post(`/support/tickets/${id}/messages`, data),
    submitReview: (ticketId, data) => api.post(`/support/tickets/${ticketId}/review`, data),
  },
};

// Review API
export const reviewAPI = {
  // Public - get approved reviews for website
  getPublic: (params) => api.get("/reviews/public", { params }),
  // Tenant - submit/update their own review
  submit: (data) => api.post("/reviews", data),
  getMy: () => api.get("/reviews/my"),
  update: (id, data) => api.put(`/reviews/my/${id}`, data),
  // Admin - manage all reviews
  list: (params) => api.get("/reviews", { params }),
  approve: (id, data) => api.put(`/reviews/${id}/approve`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Income Tax API
export const incomeTaxAPI = {
  calculateTax: (data) => api.post("/income-tax/calculate", data),
  prepareITR: (data) => api.post("/income-tax/itr/prepare", data),
  fileITR: (data) => api.post("/income-tax/itr/file", data),
  getITRStatus: (returnId) => api.get(`/income-tax/itr/${returnId}/status`),
  getForm26AS: (pan) => api.get(`/income-tax/form26as/${pan}`),
  parseForm16: (data) => api.post("/income-tax/form16/parse", data),
};

// FinBox API
export const finboxAPI = {
  // Credit Score
  getCreditScore: (data) => api.post("/finbox/credit-score", data),
  getInclusionScore: (customerId) => api.get(`/finbox/inclusion-score/${customerId}`),
  
  // Loan Eligibility
  checkEligibility: (data) => api.post("/finbox/eligibility", data),
  
  // User Management
  createUser: (data) => api.post("/finbox/user", data),
  
  // Bank Statement
  initiateBankStatement: (data) => api.post("/finbox/bank-statement/initiate", data),
  getBankStatementStatus: (customerId) => api.get(`/finbox/bank-statement/${customerId}/status`),
  getBankStatementAnalysis: (customerId) => api.get(`/finbox/bank-statement/${customerId}/analysis`),
  
  // Device Insights
  getDeviceInsights: (data) => api.post("/finbox/device-insights", data),
  
  // Session Token
  generateSessionToken: (data) => api.post("/finbox/session", data),
  
  // Consent
  saveConsent: (data) => api.post("/finbox/consent", data),
  getConsent: () => api.get("/finbox/consent"),
};

// Legacy Client API (for backward compatibility)
// Search API
export const searchAPI = {
  universal: (params) => api.get("/search", { params }),
};

export const clientAPI = {
  dashboard: () => tenantAPI.getProfile(),
  vouchers: accountingAPI.vouchers,
  ledgers: accountingAPI.ledgers,
  reports: reportsAPI,
  support: clientSupportAPI.tickets,
  // Note: Some methods may need to be updated to match new accountingAPI structure
};

export default api;
