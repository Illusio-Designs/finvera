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
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
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
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
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
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
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

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    updateProfile,
    uploadProfileImage,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};