import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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
  // Vouchers
  vouchers: {
    list: (params) => api.get("/accounting/vouchers", { params }),
    post: (id) => api.post(`/accounting/vouchers/${id}/post`),
  },
  // Ledgers
  ledgers: {
    create: (data) => api.post("/accounting/ledgers", data),
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
    create: (data) => api.post("/gst/gstins", data),
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
  calculate: (data) => api.post("/tds/calculate", data),
  generateReturn: (data) => api.post("/tds/return", data),
  generateCertificate: (id) => api.get(`/tds/certificate/${id}`),
};

// E-Invoice API
export const eInvoiceAPI = {
  list: (params) => api.get("/einvoice", { params }),
  generate: (data) => api.post("/einvoice/generate", data),
  get: (voucherId) => api.get(`/einvoice/voucher/${voucherId}`),
  cancel: (voucherId, data) => api.post(`/einvoice/cancel/${voucherId}`, data),
};

// E-Way Bill API
export const eWayBillAPI = {
  list: (params) => api.get("/ewaybill", { params }),
  generate: (data) => api.post("/ewaybill/generate", data),
  get: (voucherId) => api.get(`/ewaybill/voucher/${voucherId}`),
  cancel: (voucherId, data) => api.post(`/ewaybill/cancel/${voucherId}`, data),
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
};

export const pricingAPI = {
  list: (params) => api.get("/pricing", { params }),
  get: (id) => api.get(`/pricing/${id}`),
  create: (data) => api.post("/pricing", data),
  update: (id, data) => api.put(`/pricing/${id}`, data),
  delete: (id) => api.delete(`/pricing/${id}`),
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

// Legacy Client API (for backward compatibility)
export const clientAPI = {
  dashboard: () => tenantAPI.getProfile(),
  vouchers: accountingAPI.vouchers,
  ledgers: accountingAPI.ledgers,
  reports: reportsAPI,
  // Note: Some methods may need to be updated to match new accountingAPI structure
};

export default api;
