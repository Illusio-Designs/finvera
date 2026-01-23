import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext.jsx';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../../lib/api';
import { apiClient } from '../../../lib/apiClient';
import { findBestApiUrl } from '../../../utils/networkTest';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    gstin: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const navigation = useNavigation();
  const { showSuccess, showError, showWarning } = useNotification();

  // Test API connectivity on component mount
  useEffect(() => {
    testApiConnectivity();
  }, []);

  const testApiConnectivity = async () => {
    console.log('🔍 Testing API connectivity for registration...');
    setApiStatus('checking');
    
    try {
      const bestUrl = await findBestApiUrl();
      
      if (bestUrl) {
        // Update the API client to use the working URL
        apiClient.defaults.baseURL = bestUrl;
        console.log('✅ API client updated to use:', bestUrl);
        setApiStatus('connected');
      } else {
        setApiStatus('failed');
      }
    } catch (error) {
      console.error('❌ Network test failed:', error);
      setApiStatus('failed');
    }
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateGSTIN = (gstin) => {
    // Basic GSTIN validation - 15 alphanumeric characters
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.company_name || !formData.email || !formData.password) {
      showError('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      showError('Invalid Password', 'Password must be at least 8 characters');
      return;
    }

    // Validate GSTIN if provided
    if (formData.gstin && !validateGSTIN(formData.gstin)) {
      showError('Invalid GSTIN', 'GSTIN must be 15 alphanumeric characters.');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting registration process...');
      
      const registerData = {
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name,
        full_name: formData.full_name,
        gstin: formData.gstin || undefined,
      };
      
      console.log('Registration data:', { ...registerData, password: '[HIDDEN]' });
      
      // Call the real registration API
      const response = await authAPI.register(registerData);
      console.log('Registration response:', response.data);
      
      if (response.data) {
        // Registration successful - account created but NO company yet
        // User needs to login first, then create company
        showSuccess(
          'Account Created Successfully!', 
          'Your account has been created. Please sign in to set up your company.',
          {
            duration: 5000,
            actionText: 'Sign In',
            onActionPress: () => navigation.navigate('Login')
          }
        );
        
        // Auto navigate after 3 seconds if user doesn't click the action
        setTimeout(() => {
          navigation.navigate('Login');
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please use a different email or sign in.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your information and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
      console.error('Google register error:', error);
      showError('Error', 'Failed to initiate Google registration');
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
            source={require('../../../../assets/icon.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Finvera</Text>
        <Text style={styles.tagline}>Simplify Your Business</Text>
      </View>

      {/* Registration Form */}
      <View style={styles.formContainer}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>Sign up for your Finvera account</Text>
          
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
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={formData.full_name}
              onChangeText={(value) => handleChange('full_name', value)}
              autoCapitalize="words"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC Company"
              value={formData.company_name}
              onChangeText={(value) => handleChange('company_name', value)}
              autoCapitalize="words"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>GST Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter GST number"
              value={formData.gstin}
              onChangeText={(value) => handleChange('gstin', value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={15}
              placeholderTextColor="#9ca3af"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
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
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
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
            onPress={handleRegister}
            disabled={loading || apiStatus !== 'connected'}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : apiStatus !== 'connected' ? 'Server Disconnected' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleRegister}>
            <View style={styles.googleButtonContent}>
              <Image 
                source={require('../../../../assets/google-logo.png')} 
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text 
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign in
              </Text>
            </Text>
          </View>
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
    paddingBottom: 40,
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
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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
    flexWrap: 'wrap',
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
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  footerLink: {
    color: '#3e60ab',
    fontWeight: '600',
    fontFamily: 'Agency',
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
});