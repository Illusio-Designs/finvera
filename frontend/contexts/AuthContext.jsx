import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        Cookies.remove('jti');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, userType = 'client') => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, accessToken, refreshToken, jti } = response.data;
      
      // Store tokens and user data
      Cookies.set('token', accessToken, { expires: 7 });
      if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
      }
      if (jti) {
        Cookies.set('jti', jti, { expires: 7 });
      }
      Cookies.set('user', JSON.stringify(userData), { expires: 7 });
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { user: userData, accessToken, refreshToken, jti } = response.data;
      
      // Store tokens and user data
      Cookies.set('token', accessToken, { expires: 7 });
      if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
      }
      if (jti) {
        Cookies.set('jti', jti, { expires: 7 });
      }
      Cookies.set('user', JSON.stringify(userData), { expires: 7 });
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      const jti = Cookies.get('jti');
      if (jti) {
        await authAPI.logout({ jti });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      Cookies.remove('jti');
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = Cookies.get('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refresh({ refreshToken: refreshTokenValue });
      const { accessToken, refreshToken: newRefreshToken, jti } = response.data.data || response.data;
      
      Cookies.set('token', accessToken, { expires: 7 });
      if (newRefreshToken) {
        Cookies.set('refreshToken', newRefreshToken, { expires: 30 });
      }
      if (jti) {
        Cookies.set('jti', jti, { expires: 7 });
      }
      
      return { success: true, accessToken };
    } catch (error) {
      // Refresh failed - logout user
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      Cookies.remove('jti');
      setUser(null);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
