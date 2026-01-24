import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomDrawer({ visible, onClose }) {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleItemPress = (item) => {
    onClose();
    if (item.screen) {
      navigation.navigate(item.screen);
    } else if (item.action === 'logout') {
      logout();
    }
  };

  const drawerSections = [
    {
      title: 'Main Navigation',
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
      title: 'Account',
      items: [
        { name: 'Profile', icon: 'person-outline', color: '#8b5cf6', screen: 'Profile' },
        { name: 'Settings', icon: 'settings-outline', color: '#6b7280', screen: 'Settings' },
        { name: 'Notifications', icon: 'notifications-outline', color: '#f59e0b', screen: 'Notifications' },
        { name: 'Logout', icon: 'log-out-outline', color: '#ef4444', action: 'logout' },
      ]
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.profileSection}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitial}>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                  <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Items */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {drawerSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.drawerItem}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon} size={20} color="white" />
                    </View>
                    <Text style={styles.itemText}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appName}>Finvera Mobile</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appCopyright}>© 2024 Finvera Solutions</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: 280,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    backgroundColor: '#3e60ab',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileSection: {
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    fontFamily: 'Agency',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Agency',
  },
  appInfo: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  appCopyright: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
});