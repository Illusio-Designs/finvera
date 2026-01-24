import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../components/navigation/TopBar';
import { useDrawer } from '../../contexts/DrawerContext.jsx';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    darkMode: false,
    biometric: false,
    autoBackup: true,
    offlineMode: false,
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          key: 'notifications',
          label: 'Push Notifications',
          description: 'Receive push notifications',
          type: 'switch',
          value: settings.notifications,
          icon: 'notifications-outline'
        },
        {
          key: 'emailAlerts',
          label: 'Email Alerts',
          description: 'Receive email notifications',
          type: 'switch',
          value: settings.emailAlerts,
          icon: 'mail-outline'
        },
        {
          key: 'notificationPreferences',
          label: 'Notification Preferences',
          description: 'Manage notification settings',
          type: 'navigation',
          icon: 'notifications-outline',
          onPress: () => navigation.navigate('NotificationPreferences')
        },
      ]
    },
    {
      title: 'Appearance',
      items: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          description: 'Use dark theme',
          type: 'switch',
          value: settings.darkMode,
          icon: 'moon-outline'
        },
      ]
    },
    {
      title: 'Security',
      items: [
        {
          key: 'biometric',
          label: 'Biometric Login',
          description: 'Use fingerprint or face ID',
          type: 'switch',
          value: settings.biometric,
          icon: 'finger-print-outline'
        },
        {
          key: 'changePassword',
          label: 'Change Password',
          description: 'Update your password',
          type: 'navigation',
          icon: 'lock-closed-outline',
          onPress: () => navigation.navigate('ChangePassword')
        },
      ]
    },
    {
      title: 'Data & Storage',
      items: [
        {
          key: 'autoBackup',
          label: 'Auto Backup',
          description: 'Automatically backup data',
          type: 'switch',
          value: settings.autoBackup,
          icon: 'cloud-upload-outline'
        },
        {
          key: 'offlineMode',
          label: 'Offline Mode',
          description: 'Enable offline functionality',
          type: 'switch',
          value: settings.offlineMode,
          icon: 'cloud-offline-outline'
        },
        {
          key: 'clearCache',
          label: 'Clear Cache',
          description: 'Clear app cache data',
          type: 'action',
          icon: 'trash-outline',
          onPress: () => Alert.alert('Cache Cleared', 'App cache has been cleared')
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          key: 'help',
          label: 'Help & Support',
          description: 'Get help and support',
          type: 'navigation',
          icon: 'help-circle-outline',
          onPress: () => navigation.navigate('Support')
        },
        {
          key: 'feedback',
          label: 'Send Feedback',
          description: 'Share your feedback',
          type: 'action',
          icon: 'chatbubbles-outline',
          onPress: () => Alert.alert('Feedback', 'Feedback feature coming soon')
        },
        {
          key: 'about',
          label: 'About',
          description: 'App version and info',
          type: 'navigation',
          icon: 'information-circle-outline',
          onPress: () => Alert.alert('About', 'Finvera Mobile v1.0.0\n© 2024 Finvera Solutions')
        },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Settings" 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="create-outline" size={20} color="#3e60ab" />
          </TouchableOpacity>
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
                      />
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
  editProfileButton: {
    padding: 8,
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