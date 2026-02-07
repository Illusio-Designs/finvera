import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showGlobalError } from '../services/globalNotificationService';
import { API_CONFIG, STORAGE_CONFIG, DEBUG_CONFIG, buildStorageKey, isDebugMode } from '../config/env';
import { reset } from '../services/navigationService';
import { findWorkingApiUrl } from '../utils/dynamicApiConfig';

// Flag to prevent multiple logout attempts
let isLoggingOut = false;

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map();
const failedRequests = new Map();
const REQUEST_RETRY_DELAY = 5000; // 5 seconds before allowing retry

// Generate request key for deduplication
const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
};

// Dynamic base URL
let dynamicBaseUrl = API_CONFIG.API_URL;
let isInitialized = false;

const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize dynamic URL on first import
(async () => {
  try {
    const workingUrl = await findWorkingApiUrl();
    dynamicBaseUrl = `${workingUrl}/api`;
    apiClient.defaults.baseURL = dynamicBaseUrl;
    isInitialized = true;
    console.log(`📡 API Client initialized with: ${dynamicBaseUrl}`);
  } catch (error) {
    console.warn('⚠️  Could not detect working API URL, using default:', API_CONFIG.API_URL);
    isInitialized = true;
  }
})();

// Update baseURL dynamically
const updateBaseUrl = async () => {
  try {
    const workingUrl = await findWorkingApiUrl();
    const newBaseUrl = `${workingUrl}/api`;
    if (newBaseUrl !== apiClient.defaults.baseURL) {
      apiClient.defaults.baseURL = newBaseUrl;
      dynamicBaseUrl = newBaseUrl;
      console.log(`📡 API Client baseURL updated to: ${newBaseUrl}`);
    }
  } catch (error) {
    console.warn('⚠️  Could not update API baseURL:', error.message);
  }
};

// Update base URL every 5 minutes
setInterval(updateBaseUrl, 5 * 60 * 1000);

// Log the API URL being used for debugging
if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
  console.log('📡 API Base URL (initial):', API_CONFIG.API_URL);
  console.log('⏱️  API Timeout:', API_CONFIG.TIMEOUT);
  console.log('🔄 Dynamic URL detection enabled');
}

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Wait for initialization to complete
    let attempts = 0;
    while (!isInitialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Check for duplicate requests
    const requestKey = getRequestKey(config);
    
    // Check if this exact request is already pending
    if (pendingRequests.has(requestKey)) {
      if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
        console.log(`⏸️  Duplicate request blocked: ${config.method?.toUpperCase()} ${config.url}`);
      }
      // Return the existing pending request
      return pendingRequests.get(requestKey);
    }
    
    // Check if this request recently failed
    const failedTime = failedRequests.get(requestKey);
    if (failedTime && Date.now() - failedTime < REQUEST_RETRY_DELAY) {
      const remainingTime = Math.ceil((REQUEST_RETRY_DELAY - (Date.now() - failedTime)) / 1000);
      if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
        console.log(`🚫 Request blocked (recently failed): ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`   Retry available in ${remainingTime}s`);
      }
      throw new Error(`Request failed recently. Please wait ${remainingTime} seconds before retrying.`);
    }
    
    // Mark request as pending
    pendingRequests.set(requestKey, config);
    
    const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
    const token = await AsyncStorage.getItem(tokenKey);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls in debug mode
    if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📡 Full URL: ${config.baseURL}${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
      if (config.headers) {
        console.log('📋 Headers:', {
          'Content-Type': config.headers['Content-Type'],
          'Authorization': config.headers.Authorization ? 'Bearer ***' : 'None',
        });
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
    // Remove from pending requests on success
    const requestKey = getRequestKey(response.config);
    pendingRequests.delete(requestKey);
    failedRequests.delete(requestKey); // Clear any previous failure
    
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
    // Remove from pending requests on error
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      pendingRequests.delete(requestKey);
      
      // Mark request as failed with timestamp
      failedRequests.set(requestKey, Date.now());
      
      // Clean up old failed requests (older than retry delay)
      for (const [key, timestamp] of failedRequests.entries()) {
        if (Date.now() - timestamp > REQUEST_RETRY_DELAY) {
          failedRequests.delete(key);
        }
      }
    }
    
    // Log API errors in debug mode
    if (isDebugMode() && DEBUG_CONFIG.DEBUG_API_CALLS) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data, // Add full data for debugging
        url: error.config?.url,
        method: error.config?.method
      });
    }

    // Don't show global errors for auth endpoints - let them handle their own errors
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    if (error.response?.status === 401) {
      // Token expired or unauthenticated, clear storage and redirect to login
      // Prevent multiple simultaneous logout attempts
      if (!isLoggingOut) {
        isLoggingOut = true;
        
        const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
        const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
        await AsyncStorage.multiRemove([tokenKey, userKey]);
        
        if (!isAuthEndpoint) {
          showGlobalError('Session Expired', 'Your session has expired. Please log in again.');
          
          // Navigate to login screen after a short delay to show the error message
          setTimeout(() => {
            reset('Login');
            isLoggingOut = false;
          }, 1500);
        } else {
          isLoggingOut = false;
        }
      }
    } else if (error.response?.status === 403) {
      if (!isAuthEndpoint) {
        showGlobalError('Access Denied', 'You don\'t have permission to access this feature.');
      }
    } else if (error.response?.status === 404) {
      if (!isAuthEndpoint) {
        showGlobalError('Not Found', 'The requested information could not be found.');
      }
    } else if (error.response?.status === 429) {
      // Rate limiting - don't show global error for auth attempts
      if (!isAuthEndpoint) {
        showGlobalError('Too Many Requests', 'You\'re making requests too quickly. Please wait a moment and try again.');
      }
    } else if (error.response?.status >= 500) {
      if (!isAuthEndpoint) {
        showGlobalError('Service Unavailable', 'Our servers are experiencing issues. Please try again in a moment.');
      }
    } else if (error.code === 'ECONNABORTED') {
      if (!isAuthEndpoint) {
        showGlobalError('Request Timeout', 'The request is taking longer than expected. Please check your connection and try again.');
      }
    } else if (error.code === 'ERR_NETWORK') {
      if (!isAuthEndpoint) {
        showGlobalError('Connection Issue', 'Please check your internet connection and try again.');
        
        // Try to find a working API URL
        console.log('🔄 Network error detected, attempting to find working API URL...');
        updateBaseUrl().catch(err => console.warn('Could not update API URL:', err.message));
      }
    } else if (error.code === 'ECONNREFUSED') {
      if (!isAuthEndpoint) {
        showGlobalError('Service Unavailable', 'Unable to connect to our servers. Please try again later.');
      }
    } else if (error.response?.data?.message && !isAuthEndpoint) {
      // Don't show global errors for auth attempts, let the auth screens handle them
      showGlobalError('Error', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export { apiClient };