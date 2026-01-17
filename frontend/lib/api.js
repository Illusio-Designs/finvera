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

// ... (existing interceptors)

// --- Product Attributes API ---
export const attributeAPI = {
  list: () => api.get('/attributes'),
  create: (name) => api.post('/attributes', { name }),
  update: (id, name) => api.put(`/attributes/${id}`, { name }),
  delete: (id) => api.delete(`/attributes/${id}`),
  addValue: (attributeId, value) => api.post(`/attributes/${attributeId}/values`, { value }),
  removeValue: (valueId) => api.delete(`/attributes/values/${valueId}`),
};

// ... (the rest of the existing api.js file)

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  // ... (rest of authAPI)
};