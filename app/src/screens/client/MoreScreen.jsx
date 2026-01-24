import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../components/navigation/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawer } from '../../contexts/DrawerContext.jsx';

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { openDrawer } = useDrawer();

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const menuSections = [
    {
      title: 'Navigation',
      items: [
        { name: 'Dashboard', icon: 'home-outline', color: '#3e60ab', screen: 'Dashboard' },
        { name: 'Vouchers', icon: 'document-text-outline', color: '#10b981', screen: 'Vouchers' },
        { name: 'Reports', icon: 'bar-chart-outline', color: '#f59e0b', screen: 'Reports' },
        { name: 'GST', icon: 'receipt-outline', color: '#8b5cf6', screen: 'GST' },
      ]
    },
    {
      title: 'Business Management',
      items: [
        { name: 'Ledgers', icon: 'folder-outline', color: '#10b981', screen: 'Ledgers' },
        { name: 'Inventory', icon: 'cube-outline', color: '#3e60ab', screen: 'Inventory' },
        { name: 'Companies', icon: 'business-outline', color: '#f59e0b', screen: 'Companies' },
        { name: 'Support', icon: 'help-circle-outline', color: '#ef4444', screen: 'Support' },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { name: 'Profile', icon: 'person-outline', color: '#8b5cf6', screen: 'Profile' },
        { name: 'Notifications', icon: 'notifications-outline', color: '#f59e0b', screen: 'Notifications' },
        { name: 'Settings', icon: 'settings-outline', color: '#6b7280' },
        { name: 'Logout', icon: 'log-out-outline', color: '#ef4444', action: 'logout' },
      ]
    }
  ];

  const handleItemPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else if (item.action === 'logout') {
      logout();
    } else {
      console.log(`${item.name} pressed`);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="More" 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
            <TouchableOpacity style={styles.profileEdit}>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
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
                  <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.menuName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="refresh" size={20} color="#3e60ab" />
              <Text style={styles.actionText}>Sync Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={20} color="#10b981" />
              <Text style={styles.actionText}>Backup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={logout}>
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
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
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