import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Linking, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { findBestApiUrl } from '../../utils/networkTest';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const { login } = useAuth();
  const navigation = useNavigation();
  const { showSuccess, showError } = useNotification();

  // Test API connectivity on component mount
  useEffect(() => {
    testApiConnectivity();
  }, []);

  const testApiConnectivity = async () => {
    console.log('🔍 Testing API connectivity...');
    setApiStatus('checking');
    
    try {
      const bestUrl = await findBestApiUrl();
      
      if (bestUrl) {
        // Update the API client to use the working URL
        apiClient.defaults.baseURL = bestUrl;
        console.log('✅ API client updated to use:', bestUrl);
        setApiStatus('connected');
        showSuccess('Connected', 'Server connection established successfully');
      } else {
        setApiStatus('failed');
        showError(
          'Connection Failed', 
          'Cannot connect to server. Please ensure the backend is running and your device is on the same network.',
          {
            duration: 6000,
            actionText: 'Retry',
            onActionPress: testApiConnectivity
          }
        );
      }
    } catch (error) {
      console.error('❌ Network test failed:', error);
      setApiStatus('failed');
      showError('Network Error', 'Failed to test network connectivity: ' + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const apiUrl = __DEV__ ? 'http://192.168.1.39:3000' : 'https://api.finvera.solutions';
      const googleAuthUrl = `${apiUrl}/auth/google`;
      
      // Open Google OAuth in browser
      const supported = await Linking.canOpenURL(googleAuthUrl);
      if (supported) {
        await Linking.openURL(googleAuthUrl);
      } else {
        showError('Error', 'Unable to open Google authentication');
      }
    } catch (error) {
      console.error('Google login error:', error);
      showError('Error', 'Failed to initiate Google login');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Missing Information', 'Please fill in all fields');
      return;
    }

    console.log('Login attempt:', { email, hasPassword: !!password });
    setLoading(true);
    
    try {
      const result = await login(email, password, 'client');
      console.log('Login result:', { 
        success: result.success, 
        message: result.message
      });
      
      if (result.success) {
        // Successful login - show success message
        // Navigation will happen automatically due to auth state change
        console.log('Login successful, auth state will trigger navigation');
        showSuccess('Welcome Back!', 'Login successful. Loading dashboard...');
        
      } else {
        // Login failed
        console.log('Login failed:', result.message);
        showError('Login Failed', result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Compact Header */}
      <View style={styles.compactHeader}>
        <View style={styles.roundLogo}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Finvera</Text>
        <Text style={styles.tagline}>Simplify Your Business</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign in to your account</Text>
          
          {/* API Status Indicator */}
          <View style={styles.apiStatusContainer}>
            <View style={[styles.statusDot, { backgroundColor: apiStatus === 'connected' ? '#10b981' : apiStatus === 'failed' ? '#ef4444' : '#f59e0b' }]} />
            <Text style={styles.apiStatusText}>
              {apiStatus === 'connected' ? 'Server Connected' : apiStatus === 'failed' ? 'Server Disconnected' : 'Checking Connection...'}
            </Text>
            {apiStatus === 'failed' && (
              <TouchableOpacity onPress={testApiConnectivity} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || apiStatus !== 'connected') && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || apiStatus !== 'connected'}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : apiStatus !== 'connected' ? 'Server Disconnected' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <View style={styles.googleButtonContent}>
              <Image 
                source={require('../../../assets/google-logo.png')} 
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  compactHeader: {
    paddingTop: 80,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  roundLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e60ab',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  tagline: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  apiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  apiStatusText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3e60ab',
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Agency',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#111827',
    fontFamily: 'Agency',
    textAlignVertical: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    textAlignVertical: 'center',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3e60ab',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Agency',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Agency',
  },
});