import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Linking, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { authAPI } from '../../lib/api.js';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_CONFIG, buildStorageKey, API_CONFIG } from '../../config/env';

/**
 * LoginScreen with integrated company selection
 * 
 * Flow:
 * 1. User enters email/password
 * 2. System checks if user has multiple companies (via checkUserCompanies API)
 * 3. If multiple companies: Show company selection UI
 * 4. If single company: Proceed directly with login
 * 5. User selects company and login completes
 * 
 * This provides a seamless login experience without requiring post-login navigation.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCompanySelection, setShowCompanySelection] = useState(false);
  const [userCompanies, setUserCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null);
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Check biometric availability on component mount
  useEffect(() => {
    checkBiometricAvailability();
    checkSavedCredentials();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const available = hasHardware && isEnrolled && supportedTypes.length > 0;
      setBiometricAvailable(available);
    } catch (error) {
      console.error('Biometric check error:', error);
      setBiometricAvailable(false);
    }
  };

  const checkSavedCredentials = async () => {
    try {
      const credentialsKey = buildStorageKey('biometric_credentials');
      const saved = await AsyncStorage.getItem(credentialsKey);
      
      if (saved) {
        const credentials = JSON.parse(saved);
        setSavedCredentials(credentials);
        setEmail(credentials.email || '');
      }
    } catch (error) {
      console.error('Error checking saved credentials:', error);
    }
  };

  const saveBiometricCredentials = async (email, password) => {
    try {
      const credentialsKey = buildStorageKey('biometric_credentials');
      await AsyncStorage.setItem(credentialsKey, JSON.stringify({
        email,
        password,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable || !savedCredentials) {
      showError('Biometric Login', 'Biometric authentication is not available or no credentials saved');
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login to Finvera',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        setEmail(savedCredentials.email);
        setPassword(savedCredentials.password);
        // Proceed with login using saved credentials
        await handleLoginWithCredentials(savedCredentials.email, savedCredentials.password);
      } else {
        showError('Authentication Failed', 'Biometric authentication was cancelled or failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      showError('Authentication Error', 'Failed to authenticate with biometrics');
    }
  };

  const handleLoginWithCredentials = async (emailParam, passwordParam) => {
    const loginEmail = emailParam || email;
    const loginPassword = passwordParam || password;

    if (!loginEmail || !loginPassword) {
      showError('Missing Information', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Add a small delay to prevent rapid successive API calls during development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 1: Authenticate user and get companies
      const authResult = await authAPI.authenticate(loginEmail, loginPassword);
      
      if (authResult.data.success) {
        const { user, companies, requiresCompanySelection, needsCompanyCreation } = authResult.data;
        
        if (needsCompanyCreation) {
          showError('No Company Found', 'Please create your company first');
          setLoading(false);
          return;
        }
        
        if (requiresCompanySelection && companies.length > 1) {
          // Multiple companies - show selection
          setAuthenticatedUser(user);
          setUserCompanies(companies);
          setShowCompanySelection(true);
          setLoading(false);
          
          // Save credentials for biometric login if not using biometric already
          if (!emailParam && biometricAvailable && !savedCredentials) {
            Alert.alert(
              'Save for Biometric Login?',
              'Would you like to save your credentials for quick biometric login next time?',
              [
                { text: 'No', style: 'cancel' },
                { 
                  text: 'Yes', 
                  onPress: () => saveBiometricCredentials(loginEmail, loginPassword)
                }
              ]
            );
          }
          return;
        } else if (companies.length === 1) {
          // Single company - proceed with login
          await completeLogin(user.id, companies[0].id, loginEmail, loginPassword);
          return;
        } else {
          // No companies but no creation needed - proceed with regular login
          await completeLogin(user.id, null, loginEmail, loginPassword);
          return;
        }
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (userId, companyId, loginEmail, loginPassword) => {
    try {
      setLoading(true);
      
      // Add a small delay to avoid rate limiting from rapid authentication calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Complete login with selected company
      const result = await login(loginEmail, loginPassword, 'client', companyId, userId);
      
      if (result.success) {
        showSuccess('Welcome Back!', 'Login successful. Loading dashboard...');
        
        // Save credentials for biometric login if successful and not already saved
        if (biometricAvailable && !savedCredentials) {
          Alert.alert(
            'Save for Biometric Login?',
            'Would you like to save your credentials for quick biometric login next time?',
            [
              { text: 'No', style: 'cancel' },
              { 
                text: 'Yes', 
                onPress: () => saveBiometricCredentials(loginEmail, loginPassword)
              }
            ]
          );
        }
        
        // Navigation will happen automatically through AppNavigator's isAuthenticated check
        // But we can add a small delay to ensure state is updated
        setTimeout(() => {
          // Reset any local state that might interfere with navigation
          setShowCompanySelection(false);
          setUserCompanies([]);
          setSelectedCompany(null);
          setAuthenticatedUser(null);
        }, 100);
        
      } else {
        handleLoginError({ response: { data: { message: result.message } } });
      }
    } catch (error) {
      console.error('Login completion error:', error);
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const apiUrl = API_CONFIG.BASE_URL;
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
    await handleLoginWithCredentials();
  };

  const handleLoginError = (error) => {
    // Handle specific error responses from backend
    if (error.response?.status === 429) {
      showError('Rate Limited', 'Too many login attempts. Please wait a few minutes before trying again.');
    } else if (error.response?.status === 401) {
      showError('Invalid Credentials', 'Invalid email or password. Please check your credentials.');
    } else if (error.response?.status === 403) {
      showError('Account Restricted', 'Account access is restricted. Please contact support.');
    } else if (error.response?.status >= 500) {
      showError('Server Error', 'Server error. Please try again in a few minutes.');
    } else if (error.response?.data) {
      const errorData = error.response.data;
      showError('Login Failed', errorData.message || 'Please check your credentials and try again.');
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      showError('Connection Error', 'Network error. Please check your internet connection and try again.');
    } else {
      showError('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleCompanySelect = async (company) => {
    if (!authenticatedUser) {
      showError('Session Error', 'Please try logging in again');
      handleBackToLogin();
      return;
    }
    
    setSelectedCompany(company);
    await completeLogin(authenticatedUser.id, company.id, email, password);
  };

  const clearBiometricCredentials = async () => {
    try {
      const credentialsKey = buildStorageKey('biometric_credentials');
      await AsyncStorage.removeItem(credentialsKey);
      setSavedCredentials(null);
      setEmail('');
      showSuccess('Cleared', 'Biometric credentials cleared successfully');
    } catch (error) {
      console.error('Error clearing biometric credentials:', error);
      showError('Error', 'Failed to clear biometric credentials');
    }
  };

  const handleBackToLogin = () => {
    setShowCompanySelection(false);
    setUserCompanies([]);
    setSelectedCompany(null);
    setAuthenticatedUser(null);
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
        
        {/* Biometric Settings */}
        {savedCredentials && (
          <TouchableOpacity 
            style={styles.clearBiometricButton}
            onPress={() => {
              Alert.alert(
                'Clear Biometric Login',
                'Are you sure you want to clear saved biometric credentials?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearBiometricCredentials }
                ]
              );
            }}
          >
            <Ionicons name="settings-outline" size={16} color="#6b7280" />
            <Text style={styles.clearBiometricText}>Clear Biometric</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conditional Content */}
      {showCompanySelection ? (
        /* Company Selection Form */
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={20} color="#3e60ab" />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
            
            <Text style={styles.formTitle}>Select Your Company</Text>
            <Text style={styles.companySubtitle}>
              Choose which company you'd like to access
            </Text>
            
            <View style={styles.companiesContainer}>
              {userCompanies.map((company, index) => (
                <TouchableOpacity
                  key={company.id || index}
                  style={[
                    styles.companyCard,
                    selectedCompany?.id === company.id && styles.selectedCompanyCard
                  ]}
                  onPress={() => handleCompanySelect(company)}
                  disabled={loading}
                >
                  <View style={styles.companyIcon}>
                    <Ionicons 
                      name="business" 
                      size={24} 
                      color={selectedCompany?.id === company.id ? '#3e60ab' : '#6b7280'} 
                    />
                  </View>
                  <View style={styles.companyInfo}>
                    <Text style={[
                      styles.companyName,
                      selectedCompany?.id === company.id && styles.selectedCompanyName
                    ]}>
                      {company.company_name || company.name}
                    </Text>
                    <Text style={styles.companyType}>
                      {company.company_type?.replace('_', ' ').toUpperCase() || 'BUSINESS'}
                    </Text>
                  </View>
                  {selectedCompany?.id === company.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#3e60ab" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Login Form */
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign in to your account</Text>
            
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
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            {/* Biometric Login Button */}
            {biometricAvailable && savedCredentials && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <View style={styles.biometricButtonContent}>
                  <Ionicons name="finger-print" size={24} color="#3e60ab" />
                  <Text style={styles.biometricButtonText}>
                    Login with Biometrics
                  </Text>
                </View>
              </TouchableOpacity>
            )}

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
      )}
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
  clearBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  clearBiometricText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginLeft: 4,
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
    marginBottom: 16,
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
  biometricButton: {
    borderWidth: 1,
    borderColor: '#3e60ab',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  biometricButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButtonText: {
    color: '#3e60ab',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Agency',
    marginLeft: 8,
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
  // Company Selection Styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3e60ab',
    fontWeight: '600',
    fontFamily: 'Agency',
  },
  companySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Agency',
  },
  companiesContainer: {
    marginBottom: 20,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  selectedCompanyCard: {
    borderColor: '#3e60ab',
    backgroundColor: '#eff6ff',
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  selectedCompanyName: {
    color: '#3e60ab',
  },
  companyType: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
});