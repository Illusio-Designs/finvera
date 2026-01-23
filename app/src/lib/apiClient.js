import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
  (response) => response,
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
      // Navigate to login screen
    } else if (error.response?.status >= 500) {
      Alert.alert('Server Error', 'Something went wrong on our end. Please try again.');
    } else if (error.code === 'ECONNABORTED') {
      Alert.alert('Timeout', 'Request timed out. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      Alert.alert('Network Error', 'Please check your internet connection and ensure the server is running.');
    } else if (error.code === 'ECONNREFUSED') {
      Alert.alert('Connection Error', 'Cannot connect to server. Please ensure the backend is running on port 3000.');
    }
    return Promise.reject(error);
  }
);

export { apiClient };