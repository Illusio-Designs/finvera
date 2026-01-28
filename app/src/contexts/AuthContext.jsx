import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../lib/api';
import { STORAGE_CONFIG, buildStorageKey } from '../config/env';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true to check stored auth
  const [token, setToken] = useState(null);

  // Check for stored authentication on app startup
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
      const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
      
      const storedToken = await AsyncStorage.getItem(tokenKey);
      const storedUser = await AsyncStorage.getItem(userKey);
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, portalType = 'client', companyId = null, authenticatedUserId = null) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password, portalType, companyId, authenticatedUserId);
      
      // Handle successful login with user data
      if (response.data && response.data.user) {
        const { accessToken, refreshToken, jti, user } = response.data;
        
        const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
        const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
        
        // Debug logging in development
        if (__DEV__) {
          console.log('🔐 Login Success - Storing tokens:');
          console.log('  Token Key:', tokenKey);
          console.log('  User Key:', userKey);
          console.log('  Token Preview:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
        }
        
        await AsyncStorage.setItem(tokenKey, accessToken);
        await AsyncStorage.setItem(userKey, JSON.stringify(user));
        
        setToken(accessToken);
        setUser(user);
        
        return { 
          success: true, 
          user,
          requiresSelection: response.data.requiresSelection || false // Backend can indicate if selection is needed
        };
      }
      
      // Handle other response scenarios - but always treat as login failure
      return { 
        success: false, 
        message: response.data?.message || 'Login failed. Please check your credentials.'
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle company selection requirement
      if (error.response?.status === 400 && error.response?.data?.require_company) {
        return {
          success: false,
          message: error.response.data.message || 'Company selection required',
          companies: error.response.data.companies || [],
          requiresCompanySelection: true
        };
      }
      
      // Handle specific error responses from backend
      if (error.response?.status === 429) {
        return { 
          success: false, 
          message: 'Too many login attempts. Please wait a few minutes before trying again.'
        };
      } else if (error.response?.status === 401) {
        return { 
          success: false, 
          message: 'Invalid email or password. Please check your credentials.'
        };
      } else if (error.response?.status === 403) {
        return { 
          success: false, 
          message: 'Account access is restricted. Please contact support.'
        };
      } else if (error.response?.status >= 500) {
        return { 
          success: false, 
          message: 'Server error. Please try again in a few minutes.'
        };
      } else if (error.response?.data) {
        const errorData = error.response.data;
        
        // For any other backend error, show the error message
        return { 
          success: false, 
          message: errorData.message || 'Login failed. Please check your credentials.'
        };
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        return { 
          success: false, 
          message: 'Network error. Please check your internet connection and try again.' 
        };
      }
      
      return { 
        success: false, 
        message: 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
      const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
      
      await AsyncStorage.removeItem(tokenKey);
      await AsyncStorage.removeItem(userKey);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.data?.user) {
        const updatedUser = response.data.user;
        const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
        
        setUser(updatedUser);
        await AsyncStorage.setItem(userKey, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, message: 'Failed to update profile' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await authAPI.uploadProfileImage(formData);
      if (response.data?.user) {
        const updatedUser = response.data.user;
        const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
        
        setUser(updatedUser);
        await AsyncStorage.setItem(userKey, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, message: 'Failed to upload image' };
    } catch (error) {
      console.error('Image upload error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to upload image' 
      };
    }
  };

  const switchCompany = async (companyId) => {
    try {
      setLoading(true);
      
      // Try to call the backend API first
      try {
        const response = await authAPI.switchCompany(companyId);
        
        if (response.data && response.data.user) {
          const updatedUser = response.data.user;
          const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
          
          await AsyncStorage.setItem(userKey, JSON.stringify(updatedUser));
          setUser(updatedUser);
          
          return { success: true, user: updatedUser };
        }
      } catch (apiError) {
        console.log('API switch company not available, using local update:', apiError.message);
        
        // Fallback: Update locally if API endpoint doesn't exist
        if (user?.email) {
          const updatedUser = { ...user, company_id: companyId };
          
          const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
          await AsyncStorage.setItem(userKey, JSON.stringify(updatedUser));
          
          setUser(updatedUser);
          
          return { success: true, user: updatedUser };
        }
      }
      
      return { success: false, message: 'No user found to switch company' };
    } catch (error) {
      console.error('Switch company error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to switch company' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check token storage (development only)
  const debugTokenStorage = async () => {
    if (__DEV__) {
      try {
        const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
        const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);
        
        const storedToken = await AsyncStorage.getItem(tokenKey);
        const storedUser = await AsyncStorage.getItem(userKey);
        
        console.log('🔍 Token Storage Debug:');
        console.log('  Token Key:', tokenKey);
        console.log('  User Key:', userKey);
        console.log('  Token Exists:', !!storedToken);
        console.log('  User Exists:', !!storedUser);
        console.log('  Token Preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'null');
        
        return { tokenKey, userKey, hasToken: !!storedToken, hasUser: !!storedUser };
      } catch (error) {
        console.error('Debug token storage error:', error);
        return null;
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    updateProfile,
    uploadProfileImage,
    switchCompany, // Add switchCompany to the context value
    debugTokenStorage, // Only available in development
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};