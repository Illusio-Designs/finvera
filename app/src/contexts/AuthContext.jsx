import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../lib/api';

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
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
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

  const login = async (email, password, portalType = 'client', companyId = null) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password, portalType, companyId);
      
      // Handle successful login with user data
      if (response.data && response.data.user) {
        const { accessToken, refreshToken, jti, user } = response.data;
        
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setToken(accessToken);
        setUser(user);
        
        return { success: true, user };
      }
      
      // Handle other response scenarios - but always treat as login failure
      return { 
        success: false, 
        message: response.data?.message || 'Login failed. Please check your credentials.'
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error responses from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // For any backend error, just show the error message
        return { 
          success: false, 
          message: errorData.message || 'Login failed. Please check your credentials.'
        };
      }
      
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};