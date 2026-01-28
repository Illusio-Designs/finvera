import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { buildUploadUrl } from '../../../config/env';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState({
    // App preferences only
    biometric: false,
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        // If biometric is not available, ensure it's disabled
        setPreferences(prev => ({ ...prev, biometric: false }));
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // No API calls needed for local preferences
    setRefreshing(false);
  };

  const toggleSetting = async (key) => {
    if (key === 'biometric') {
      const newValue = !preferences.biometric;
      
      if (newValue) {
        // User wants to enable biometric login - check permissions and availability
        try {
          // Check if biometric hardware is available
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          if (!hasHardware) {
            showNotification({
              type: 'error',
              title: 'Not Available',
              message: 'Biometric authentication is not available on this device'
            });
            return;
          }

          // Check if biometric records are enrolled
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (!isEnrolled) {
            showNotification({
              type: 'error',
              title: 'Setup Required',
              message: 'Please set up fingerprint or face ID in your device settings first'
            });
            return;
          }

          // Test biometric authentication
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verify your identity to enable biometric login',
            cancelLabel: 'Cancel',
            fallbackLabel: 'Use Password',
          });

          if (result.success) {
            setPreferences(prev => ({ ...prev, biometric: true }));
            showNotification({
              type: 'success',
              title: 'Biometric Login Enabled',
              message: 'You can now use fingerprint or face ID to login'
            });
          } else {
            showNotification({
              type: 'info',
              title: 'Authentication Failed',
              message: 'Biometric authentication was not successful'
            });
          }
        } catch (error) {
          console.error('Biometric authentication error:', error);
          showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to setup biometric authentication'
          });
        }
      } else {
        // User wants to disable biometric login
        setPreferences(prev => ({ ...prev, biometric: false }));
        showNotification({
          type: 'info',
          title: 'Biometric Login Disabled',
          message: 'Biometric authentication has been turned off'
        });
      }
    } else {
      // For other settings, just show a message
      const newValue = !preferences[key];
      setPreferences(prev => ({ ...prev, [key]: newValue }));
      showNotification({
        type: 'info',
        title: 'Setting Updated',
        message: `${key} has been ${newValue ? 'enabled' : 'disabled'}`
      });
    }
  };

  const handleLogout = () => {
    showNotification({
      type: 'info',
      title: 'Logging out...',
      message: 'Please wait while we sign you out'
    });
    logout();
  };

  const settingSections = [
    {
      title: 'App Preferences',
      items: [
        {
          key: 'biometric',
          label: 'Biometric Login',
          description: 'Use fingerprint or face ID',
          type: 'switch',
          value: preferences.biometric,
          icon: 'finger-print-outline'
        },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Settings" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            {buildUploadUrl(user?.profile_image) ? (
              <Image 
                source={{ uri: buildUploadUrl(user?.profile_image) }} 
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.userInitial}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.settingItemLast
                  ]}
                  onPress={item.onPress || (item.type === 'switch' ? () => toggleSetting(item.key) : null)}
                  disabled={item.type === 'switch'}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon} size={20} color="#3e60ab" />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      <Text style={styles.settingDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <View style={styles.settingItemRight}>
                    {item.type === 'switch' && (
                      <Switch
                        value={item.value}
                        onValueChange={() => toggleSetting(item.key)}
                        trackColor={{ false: '#e5e7eb', true: '#3e60ab' }}
                        thumbColor={item.value ? '#ffffff' : '#f3f4f6'}
                        disabled={item.disabled}
                      />
                    )}
                    {item.type === 'info' && (
                      <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
                    )}
                    {(item.type === 'navigation' || item.type === 'action') && (
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Finvera Mobile</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2024 Finvera Solutions</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  settingItemRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
    maxWidth: 120,
  },
  infoValue: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    fontFamily: 'Agency',
    marginLeft: 8,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  copyright: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
});