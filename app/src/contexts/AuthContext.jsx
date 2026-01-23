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
      
      // Handle other response scenarios
      return { 
        success: false, 
        message: response.data?.message || 'Login failed',
        requireCompany: response.data?.require_company,
        companies: response.data?.companies,
        needsCompanyCreation: response.data?.needs_company_creation
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error responses from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Special handling for company creation requirement (409 status)
        if (error.response.status === 409 && errorData.needs_company_creation) {
          console.log('Company creation required - storing partial auth data');
          
          // Store partial user data and token for company creation flow
          if (errorData.user && errorData.accessToken) {
            await AsyncStorage.setItem('token', errorData.accessToken);
            await AsyncStorage.setItem('user', JSON.stringify(errorData.user));
            setToken(errorData.accessToken);
            setUser(errorData.user);
          }
          
          return { 
            success: false, 
            message: errorData.message || 'Company setup required',
            requireCompany: errorData.require_company,
            companies: errorData.companies,
            needsCompanyCreation: true,
            user: errorData.user
          };
        }
        
        // Handle company selection requirement (400 status)
        if (error.response.status === 400 && errorData.require_company) {
          return { 
            success: false, 
            message: errorData.message || 'Company selection required',
            requireCompany: true,
            companies: errorData.companies,
            needsCompanyCreation: false
          };
        }
        
        // Handle other error responses
        return { 
          success: false, 
          message: errorData.message || 'Login failed',
          requireCompany: errorData.require_company,
          companies: errorData.companies,
          needsCompanyCreation: errorData.needs_company_creation
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