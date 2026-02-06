import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../utils/fonts';;
import { useAuth } from '../../contexts/AuthContext';

export default function DrawerContent() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'Dashboard', icon: 'home-outline', screen: 'Dashboard' },
    { label: 'Profile', icon: 'person-outline', screen: 'Profile' },
    { label: 'Companies', icon: 'business-outline', screen: 'Companies' },
    { label: 'Branches', icon: 'git-branch-outline', screen: 'Branches' },
    { label: 'Ledgers', icon: 'folder-outline', screen: 'Ledgers' },
    { label: 'Inventory', icon: 'cube-outline', screen: 'Inventory' },
    { label: 'Vouchers', icon: 'document-text-outline', screen: 'Vouchers' },
    { label: 'Reports', icon: 'bar-chart-outline', screen: 'Reports' },
    { label: 'GST Management', icon: 'receipt-outline', screen: 'GST' },
    { label: 'TDS Management', icon: 'calculator-outline', screen: 'TDS' },
    { label: 'Settings', icon: 'settings-outline', screen: 'Settings' },
    { label: 'Support', icon: 'help-circle-outline', screen: 'Support' },
  ];

  const handleMenuPress = (screen) => {
    navigation.navigate(screen);
    navigation.closeDrawer();
  };

  const handleLogout = () => {
    navigation.closeDrawer();
    logout();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Finvera</Text>
        <Text style={styles.tagline}>Simplify Your Business</Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.screen)}
          >
            <Ionicons name={item.icon} size={24} color="#6b7280" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Finvera Mobile v1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#3e60ab',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  appName: {
    ...FONT_STYLES.h2,
    color: 'white',
    marginBottom: 4
  },
  tagline: {
    ...FONT_STYLES.label,
    color: '#e0e7ff',
    marginBottom: 16
  },
  userInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4f46e5',
    width: '100%',
  },
  userName: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
  userEmail: {
    ...FONT_STYLES.label,
    color: '#e0e7ff',
    marginTop: 2
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLabel: {
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#374151',
    marginLeft: 16
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  logoutText: {
    ...FONT_STYLES.h5,
    color: '#ef4444',
    marginLeft: 16
  },
  versionInfo: {
    alignItems: 'center',
  },
  versionText: {
    ...FONT_STYLES.caption,
    color: '#9ca3af'
  },
});