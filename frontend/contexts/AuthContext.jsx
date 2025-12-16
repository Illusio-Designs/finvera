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
      console.log('Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      console.log('Login response:', response);
      
      // Handle different response structures
      const responseData = response.data?.data || response.data;
      const { user: userData, accessToken, refreshToken, jti } = responseData;
      
      if (!userData || !accessToken) {
        console.error('Invalid response structure:', responseData);
        return {
          success: false,
          message: 'Invalid response from server',
        };
      }
      
      // Normalize user data to ensure name field is set
      const normalizedUser = {
        ...userData,
        name: userData.name || userData.full_name || userData.email?.split('@')[0] || 'User',
        full_name: userData.full_name || userData.name || userData.email?.split('@')[0] || 'User',
      };
      
      // Store tokens and user data with proper cookie settings
      // Note: For localhost subdomains, cookies work without domain setting
      const cookieOptions = { 
        expires: 7,
        sameSite: 'lax'
      };
      
      Cookies.set('token', accessToken, cookieOptions);
      if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 });
      }
      if (jti) {
        Cookies.set('jti', jti, cookieOptions);
      }
      Cookies.set('user', JSON.stringify(normalizedUser), cookieOptions);
      
      setUser(normalizedUser);
      console.log('Login successful for user:', normalizedUser);
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { user: userData, accessToken, refreshToken, jti } = response.data;
      
      // Store tokens and user data with proper cookie settings
      const cookieOptions = { 
        expires: 7,
        sameSite: 'lax'
      };
      
      Cookies.set('token', accessToken, cookieOptions);
      if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 });
      }
      if (jti) {
        Cookies.set('jti', jti, cookieOptions);
      }
      Cookies.set('user', JSON.stringify(userData), cookieOptions);
      
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
      
      const cookieOptions = { 
        expires: 7,
        sameSite: 'lax'
      };
      
      Cookies.set('token', accessToken, cookieOptions);
      if (newRefreshToken) {
        Cookies.set('refreshToken', newRefreshToken, { ...cookieOptions, expires: 30 });
      }
      if (jti) {
        Cookies.set('jti', jti, cookieOptions);
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

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    Cookies.set('user', JSON.stringify(updatedUser), { expires: 7, sameSite: 'lax' });
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
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
