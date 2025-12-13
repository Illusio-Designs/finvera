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
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        Cookies.remove("user");
        Cookies.remove("jti");
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          if (path.startsWith("/admin")) {
            window.location.href = "/admin/login";
          } else if (path.startsWith("/client")) {
            window.location.href = "/client/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      Cookies.remove("user");
      Cookies.remove("jti");
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else if (path.startsWith("/client")) {
          window.location.href = "/client/login";
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
};

// Tenant API (not in backend docs, keeping for backward compatibility)
export const tenantAPI = {
  getProfile: () => api.get("/tenants/profile"),
  updateProfile: (data) => api.put("/tenants/profile", data),
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
  },
  distributors: {
    list: (params) => api.get("/admin/distributors", { params }),
    get: (id) => api.get(`/admin/distributors/${id}`),
    create: (data) => api.post("/admin/distributors", data),
    update: (id, data) => api.put(`/admin/distributors/${id}`, data),
    delete: (id) => api.delete(`/admin/distributors/${id}`),
  },
  salesmen: {
    list: (params) => api.get("/admin/salesmen", { params }),
    get: (id) => api.get(`/admin/salesmen/${id}`),
    create: (data) => api.post("/admin/salesmen", data),
    update: (id, data) => api.put(`/admin/salesmen/${id}`, data),
    delete: (id) => api.delete(`/admin/salesmen/${id}`),
    getPerformance: (id, params) => api.get(`/admin/salesmen/${id}/performance`, { params }),
    getLeads: (id, params) => api.get(`/admin/salesmen/${id}/leads`, { params }),
  },
  commissions: {
    list: (params) => api.get("/admin/commissions", { params }),
    get: (id) => api.get(`/admin/commissions/${id}`),
    summary: (params) => api.get("/admin/commissions/summary", { params }),
  },
  payouts: {
    list: (params) => api.get("/admin/payouts", { params }),
    get: (id) => api.get(`/admin/payouts/${id}`),
    generate: (data) => api.post("/admin/payouts/generate", data),
  },
  referrals: {
    list: (params) => api.get("/admin/referrals", { params }),
    create: (data) => api.post("/admin/referrals", data),
    rewards: (params) => api.get("/admin/referrals/rewards", { params }),
  },
};

// Accounting API
export const accountingAPI = {
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
};

// GST API
export const gstAPI = {
  gstins: {
    create: (data) => api.post("/gst/gstins", data),
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

// Additional APIs (not in backend docs, keeping for backward compatibility)
export const referralAPI = {
  verifyCode: (code) => api.post("/referrals/verify", { code }),
  getMyCode: () => api.get("/referrals/my-code"),
  createCode: (data) => api.post("/referrals", data),
  listCodes: (params) => api.get("/referrals", { params }),
  getRewards: (params) => api.get("/referrals/rewards", { params }),
};

export const commissionAPI = {
  list: (params) => api.get("/commissions", { params }),
  get: (id) => api.get(`/commissions/${id}`),
};

export const payoutAPI = {
  list: (params) => api.get("/payouts", { params }),
  get: (id) => api.get(`/payouts/${id}`),
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
