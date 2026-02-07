import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_CONFIG, buildStorageKey } from '../../config/env';
import { FONT_STYLES } from '../../utils/fonts';

/**
 * OAuthCallbackScreen
 * 
 * Handles OAuth callback from Google authentication
 * Extracts tokens from URL parameters and logs user in
 */
export default function OAuthCallbackScreen({ route, navigation }) {
  const { setToken, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    console.log('🔄 OAuthCallbackScreen mounted');
    console.log('📦 Route params:', route.params);
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      console.log('🔐 Starting OAuth callback handling...');
      
      // Extract parameters from route
      const params = route.params || {};
      
      console.log('📋 Extracted params:', params);
      
      const {
        token,
        refreshToken,
        jti,
        userId,
        email,
        name,
        needsCompany
      } = params;

      if (!token || !userId) {
        console.error('❌ Missing required parameters:', { token: !!token, userId: !!userId });
        showError('Authentication Failed', 'Invalid authentication response');
        navigation.replace('Login');
        return;
      }

      console.log('✅ Valid OAuth response received');
      console.log('👤 User:', { userId, email, name });

      // Store tokens
      const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
      const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);

      await AsyncStorage.setItem(tokenKey, token);
      
      // Create user object
      const userData = {
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        google_id: userId,
      };

      await AsyncStorage.setItem(userKey, JSON.stringify(userData));

      // Update auth context
      setToken(token);
      setUser(userData);

      console.log('💾 Tokens and user data stored');

      // Show success message
      showSuccess('Welcome!', `Signed in as ${email}`);

      // Navigate based on whether company creation is needed
      if (needsCompany === 'true') {
        console.log('🏢 User needs to create a company');
        // User needs to create a company
        navigation.replace('CompanyBranchSelection');
      } else {
        console.log('🎉 User is fully authenticated, navigating to dashboard');
        // User is fully authenticated, go to dashboard
        navigation.replace('Dashboard');
      }

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      showError('Authentication Error', 'Failed to complete authentication');
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3e60ab" />
      <Text style={styles.text}>Completing authentication...</Text>
      <Text style={styles.subtext}>Please wait</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    ...FONT_STYLES.body,
    marginTop: 16,
    color: '#6b7280',
  },
  subtext: {
    ...FONT_STYLES.caption,
    marginTop: 8,
    color: '#9ca3af',
  },
});
