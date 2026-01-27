import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showGlobalError } from '../services/globalNotificationService';
import { API_CONFIG, STORAGE_CONFIG, DEBUG_CONFIG, buildStorageKey, isDebugMode } from '../config/env';

const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API URL being used for debugging
if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
  console.log('📡 API Base URL:', API_CONFIG.API_URL);
  console.log('⏱️  API Timeout:', API_CONFIG.TIMEOUT);
}

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
    const token = await AsyncStorage.getItem(tokenKey);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls in debug mode
    if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
    }
    
    return config;
  },
  (error) => {
    if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log API responses in debug mode
    if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
      console.log(`✅ API Response: ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
      console.log('📥 Response Status:', response.status);
    }
    
    // Ensure response always has a data property with proper structure
    if (response && response.data) {
      // If the response data doesn't have the expected structure, normalize it
      if (!response.data.data && !response.data.items && !response.data.transfers && !response.data.tds && !response.data.tdsDetails && !response.data.pagination) {
        // If it's an array, wrap it in the expected structure
        if (Array.isArray(response.data)) {
          response.data = {
            data: response.data,
            pagination: {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              totalPages: 1
            }
          };
        }
        // Handle legacy TDS response format
        else if (response.data.tdsDetails && Array.isArray(response.data.tdsDetails)) {
          response.data = {
            data: response.data.tdsDetails,
            pagination: {
              page: 1,
              limit: response.data.tdsDetails.length,
              total: response.data.tdsDetails.length,
              totalPages: 1
            }
          };
        }
      }
    } else {
      // If no response data, provide empty structure
      response.data = {
        data: [],
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 0
        }
      };
    }
    return response;
  },
  async (error) => {
    // Log API errors in debug mode
    if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    if (error.response?.status === 401) {
      // Token expired, redirect to login
      const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
      const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
      await AsyncStorage.multiRemove([tokenKey, userKey]);
      showGlobalError('Session Expired', 'Please log in again to continue.');
    } else if (error.response?.status === 403) {
      showGlobalError('Access Denied', 'You don\'t have permission to access this feature.');
    } else if (error.response?.status === 404) {
      showGlobalError('Not Found', 'The requested information could not be found.');
    } else if (error.response?.status === 429) {
      // Rate limiting - don't show global error for login attempts, let the login screen handle it
      if (!error.config?.url?.includes('/auth/login')) {
        showGlobalError('Too Many Requests', 'You\'re making requests too quickly. Please wait a moment and try again.');
      }
    } else if (error.response?.status >= 500) {
      showGlobalError('Service Unavailable', 'Our servers are experiencing issues. Please try again in a moment.');
    } else if (error.code === 'ECONNABORTED') {
      showGlobalError('Request Timeout', 'The request is taking longer than expected. Please check your connection and try again.');
    } else if (error.code === 'ERR_NETWORK') {
      showGlobalError('Connection Issue', 'Please check your internet connection and try again.');
    } else if (error.code === 'ECONNREFUSED') {
      showGlobalError('Service Unavailable', 'Unable to connect to our servers. Please try again later.');
    } else if (error.response?.data?.message && !error.config?.url?.includes('/auth/login')) {
      // Don't show global errors for login attempts, let the login screen handle them
      showGlobalError('Error', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export { apiClient };