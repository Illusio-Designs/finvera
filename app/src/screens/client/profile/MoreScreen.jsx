import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useAuth } from '../../../contexts/AuthContext';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext.jsx';
import { companyAPI, notificationAPI } from '../../../lib/api';

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const { openDrawer } = useDrawer();
  
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMenuPress = () => {
    openDrawer();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchCompanyInfo(),
      fetchUnreadNotifications()
    ]);
  };

  const fetchCompanyInfo = async () => {
    if (!user?.company_id) return;
    
    try {
      const response = await companyAPI.get(user.company_id);
      const companyData = response.data?.data || response.data;
      setCompany(companyData);
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const count = response.data?.count || response.data?.unread_count || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSyncData = async () => {
    showNotification({
      type: 'info',
      title: 'Syncing...',
      message: 'Refreshing your data'
    });
    
    await onRefresh();
    
    showNotification({
      type: 'success',
      title: 'Sync Complete',
      message: 'Your data has been refreshed'
    });
  };

  const handleBackup = () => {
    showNotification({
      type: 'info',
      title: 'Backup',
      message: 'Data backup feature coming soon'
    });
  };

  const menuSections = [
    {
      title: 'Main Features',
      items: [
        { name: 'Dashboard', icon: 'home-outline', color: '#3e60ab', screen: 'Dashboard', description: 'Overview & insights' },
        { name: 'Vouchers', icon: 'document-text-outline', color: '#10b981', screen: 'Vouchers', description: 'Create invoices & transactions' },
        { name: 'Reports', icon: 'bar-chart-outline', color: '#f59e0b', screen: 'Reports', description: 'Financial reports' },
        { name: 'GST', icon: 'receipt-outline', color: '#8b5cf6', screen: 'GST', description: 'GST management' },
      ]
    },
    {
      title: 'Business Tools',
      items: [
        { name: 'Ledgers', icon: 'folder-outline', color: '#10b981', screen: 'Ledgers', description: 'Create account ledgers' },
        { name: 'Inventory', icon: 'cube-outline', color: '#3e60ab', screen: 'Inventory', description: 'Create & manage stock' },
        { name: 'Companies', icon: 'business-outline', color: '#f59e0b', screen: 'Companies', description: 'Switch companies (view only)' },
        { name: 'Support', icon: 'help-circle-outline', color: '#ef4444', screen: 'Support', description: 'Help & tickets' },
      ]
    },
    {
      title: 'Business Services',
      items: [
        { name: 'Plans', icon: 'diamond-outline', color: '#3e60ab', screen: 'Plans', description: 'Subscription plans' },
        { name: 'Subscribe', icon: 'card-outline', color: '#10b981', screen: 'Subscribe', description: 'My subscription' },
        { name: 'Review', icon: 'star-outline', color: '#f59e0b', screen: 'Review', description: 'Reviews & feedback' },
        { name: 'Loan', icon: 'business-outline', color: '#8b5cf6', screen: 'Loan', description: 'Business loan' },
      ]
    },
    {
      title: 'Account & Settings',
      items: [
        { name: 'Profile', icon: 'person-outline', color: '#8b5cf6', screen: 'Profile', description: 'Personal info' },
        { 
          name: 'Notifications', 
          icon: 'notifications-outline', 
          color: '#f59e0b', 
          screen: 'Notifications', 
          description: 'Messages & alerts',
          badge: unreadCount > 0 ? unreadCount : null
        },
        { name: 'Settings', icon: 'settings-outline', color: '#6b7280', screen: 'Settings', description: 'App preferences' },
      ]
    }
  ];

  const handleItemPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else if (item.action === 'logout') {
      handleLogout();
    } else {
      console.log(`${item.name} pressed`);
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

  // Get user profile image or first letter
  const getUserAvatar = () => {
    if (user?.profile_image || user?.avatar) {
      return (
        <Image 
          source={{ uri: user.profile_image || user.avatar }} 
          style={styles.profileImage}
          onError={() => {
            console.log('Profile image failed to load');
          }}
        />
      );
    } else {
      return (
        <Text style={styles.profileInitial}>
          {(user?.name || user?.first_name || 'U').charAt(0).toUpperCase()}
        </Text>
      );
    }
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="More" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileAvatar}>
              {getUserAvatar()}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || user?.first_name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
              {company && (
                <Text style={styles.companyName}>{company.company_name}</Text>
              )}
            </View>
            <View style={styles.profileEdit}>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuGrid}>
              {section.items.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.menuCard}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.menuCardHeader}>
                    <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon} size={24} color="white" />
                    </View>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSyncData}>
              <Ionicons name="refresh" size={20} color="#3e60ab" />
              <Text style={styles.actionText}>Sync Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleBackup}>
              <Ionicons name="cloud-download" size={20} color="#10b981" />
              <Text style={styles.actionText}>Backup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Finvera Mobile v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Finvera Solutions</Text>
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
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  profileSection: {
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Agency',
  },
  companyName: {
    fontSize: 12,
    color: '#3e60ab',
    marginTop: 2,
    fontFamily: 'Agency',
    fontWeight: '600',
  },
  profileEdit: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 100,
  },
  menuCardHeader: {
    position: 'relative',
    marginBottom: 12,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
  },
  menuName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    fontFamily: 'Agency',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
});