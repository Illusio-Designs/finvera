import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showGlobalError } from '../services/globalNotificationService';

// Get the correct API URL for development
const getDevApiUrl = () => {
  // Priority order for development URLs:
  // 1. Environment variable override
  // 2. Computer's IP address (for physical devices)
  // 3. Localhost (for iOS Simulator)
  // 4. Expo tunnel URL (if using tunnel)
  
  const expoUrl = process.env.EXPO_PUBLIC_API_URL;
  if (expoUrl) {
    console.log('Using API URL from environment:', expoUrl);
    return expoUrl;
  }
  
  // Your computer's IP address on the local network
  const computerIP = '192.168.1.39';
  const ipUrl = `http://${computerIP}:3000/api`;
  
  console.log('Using computer IP for API:', ipUrl);
  return ipUrl;
};

const API_BASE_URL = __DEV__ 
  ? getDevApiUrl()
  : 'https://api.finvera.solutions/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API URL being used for debugging
console.log('API Base URL:', API_BASE_URL);

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
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
    console.log('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method
    });

    if (error.response?.status === 401) {
      // Token expired, redirect to login
      await AsyncStorage.multiRemove(['token', 'user']);
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