import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { authAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter your email address'
      });
      return;
    }

    if (!isValidEmail(email)) {
      showNotification({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address'
      });
      return;
    }

    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      showNotification({
        type: 'success',
        title: 'Email Sent',
        message: 'Password reset instructions have been sent to your email address'
      });
      navigation.goBack();
    } catch (error) {
      console.error('Forgot password error:', error);
      showNotification(error.response?.data?.message || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3e60ab" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.brandName}>Fintranzact</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Forgot your password?</Text>
          <Text style={styles.instructionsText}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.goBack()}>
          <Text style={styles.backToLoginText}>
            Remember your password? <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    ...FONT_STYLES.h1,
    color: 'white',
  },
  brandName: {
    ...FONT_STYLES.h2,
    color: '#3e60ab',
  },
  instructionsContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  instructionsTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    ...FONT_STYLES.body,
    flex: 1,
    color: '#111827',
  },
  resetButton: {
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  loginLink: {
    color: '#3e60ab',
    fontWeight: 'bold',
  },
});