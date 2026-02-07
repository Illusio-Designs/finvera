import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../utils/fonts';;
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../lib/api';
import { buildUploadUrl } from '../../config/env';

export default function CustomDrawer({ visible, onClose }) {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState({});
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data when drawer becomes visible
  useEffect(() => {
    if (visible && !profileData) {
      fetchProfileData();
    }
  }, [visible]);

  const fetchProfileData = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response?.data?.data || response?.data;
      
      // Debug logging for profile response
      if (__DEV__) {
        console.log('📥 Drawer Profile API Response:', {
          fullResponse: response.data,
          userData: userData,
          profileImage: userData?.profile_image
        });
      }
      
      setProfileData({
        id: userData.id || '',
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || '',
        profile_image: userData.profile_image || null,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        last_login: userData.last_login || null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to auth context data if API fails
      if (user) {
        setProfileData({
          id: user.id || '',
          name: user.name || user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || '',
          profile_image: user.profile_image || null,
          is_active: user.is_active !== undefined ? user.is_active : true,
          last_login: user.last_login || null,
        });
      }
    }
  };

  const handleItemPress = (item) => {
    onClose();
    if (item.screen) {
      if (item.params) {
        navigation.navigate(item.screen, item.params);
      } else {
        navigation.navigate(item.screen);
      }
    } else if (item.action === 'logout') {
      logout();
    }
  };

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  // Get user profile image or first letter
  const getUserAvatar = () => {
    const currentUser = profileData || user;
    
    // Build proper image URL using the same approach as ProfileScreen
    const imageUrl = buildUploadUrl(currentUser?.profile_image) || buildUploadUrl(user?.profile_image);
    
    if (imageUrl) {
      return (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.profileImage}
          onError={() => {
            // Fallback to initial if image fails to load
            console.log('Profile image failed to load');
          }}
        />
      );
    } else {
      return (
        <Text style={styles.profileInitial}>
          {(currentUser?.name || currentUser?.first_name || 'U').charAt(0).toUpperCase()}
        </Text>
      );
    }
  };

  const drawerSections = [
    {
      title: 'Main Navigation',
      items: [
        { name: 'Dashboard', icon: 'home-outline', color: '#3e60ab', screen: 'Dashboard' },
        { name: 'Reports & Analytics', icon: 'bar-chart-outline', color: '#f59e0b', screen: 'Reports' },
      ]
    },
    {
      title: 'Quick Actions',
      items: [
        { name: 'Create Voucher', icon: 'add-circle-outline', color: '#10b981', screen: 'CreateVoucher', description: 'New voucher/invoice' },
        { name: 'Quick Entry', icon: 'flash-outline', color: '#3e60ab', screen: 'QuickEntry', description: 'Fast data entry' },
      ]
    },
    {
      title: 'Accounting & Finance',
      expandable: true,
      items: [
        { name: 'Vouchers & Invoices', icon: 'document-text-outline', color: '#10b981', screen: 'Vouchers' },
        { name: 'Account Ledgers', icon: 'folder-outline', color: '#059669', screen: 'Ledgers' },
        { name: 'Payment Vouchers', icon: 'card-outline', color: '#3b82f6', screen: 'PaymentVouchers' },
        { name: 'Receipt Vouchers', icon: 'wallet-outline', color: '#10b981', screen: 'ReceiptVouchers' },
        { name: 'Journal Entries', icon: 'book-outline', color: '#8b5cf6', screen: 'JournalEntries' },
        { name: 'Stock Transfers', icon: 'swap-horizontal-outline', color: '#3b82f6', screen: 'InventoryTransfer' },
      ]
    },
    {
      title: 'Inventory Management',
      expandable: true,
      items: [
        { name: 'Inventory Items', icon: 'cube-outline', color: '#10b981', screen: 'InventoryItems' },
        { name: 'Stock Adjustments', icon: 'swap-horizontal-outline', color: '#f59e0b', screen: 'InventoryAdjustment' },
        { name: 'Warehouses', icon: 'storefront-outline', color: '#8b5cf6', screen: 'Warehouses' },
      ]
    },
    {
      title: 'GST & Compliance',
      expandable: true,
      items: [
        { name: 'GST Management', icon: 'receipt-outline', color: '#8b5cf6', screen: 'GST' },
        { name: 'GSTIN Records', icon: 'card-outline', color: '#059669', screen: 'GSTINs' },
        { name: 'GST Rates', icon: 'calculator-outline', color: '#f59e0b', screen: 'GSTRates' },
        { name: 'E-Invoice', icon: 'document-text-outline', color: '#3b82f6', screen: 'EInvoice' },
        { name: 'E-Way Bill', icon: 'car-outline', color: '#ef4444', screen: 'EWayBill' },
      ]
    },
    {
      title: 'Financial Reports',
      expandable: true,
      items: [
        { name: 'Balance Sheet', icon: 'document-text-outline', color: '#3e60ab', screen: 'BalanceSheet' },
        { name: 'Profit & Loss', icon: 'trending-up-outline', color: '#10b981', screen: 'ProfitLoss' },
        { name: 'Trial Balance', icon: 'list-outline', color: '#8b5cf6', screen: 'TrialBalance' },
        { name: 'Cash Flow', icon: 'water-outline', color: '#06b6d4', screen: 'CashFlow' },
      ]
    },
    {
      title: 'Tax Management',
      expandable: true,
      items: [
        { name: 'Income Tax', icon: 'document-text-outline', color: '#3e60ab', screen: 'IncomeTax' },
        { name: 'TDS Management', icon: 'receipt-outline', color: '#f59e0b', screen: 'TDS' },
      ]
    },
    {
      title: 'Business Services',
      expandable: true,
      items: [
        { name: 'Subscription Plans', icon: 'diamond-outline', color: '#3e60ab', screen: 'Plans' },
        { name: 'Business Loan', icon: 'business-outline', color: '#8b5cf6', screen: 'Loan' },
        { name: 'Referral Program', icon: 'people-outline', color: '#ef4444', screen: 'Referral' },
        { name: 'Reviews & Feedback', icon: 'star-outline', color: '#f59e0b', screen: 'Review' },
      ]
    },
    {
      title: 'Tools & Settings',
      expandable: true,
      items: [
        { name: 'Companies', icon: 'business-outline', color: '#059669', screen: 'Companies' },
        { name: 'Tally Import', icon: 'cloud-upload-outline', color: '#3e60ab', screen: 'TallyImport' },
        { name: 'Notifications', icon: 'notifications-outline', color: '#f59e0b', screen: 'Notifications' },
        { name: 'Settings', icon: 'settings-outline', color: '#6b7280', screen: 'Settings' },
        { name: 'Help & Support', icon: 'help-circle-outline', color: '#ef4444', screen: 'Support' },
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'Profile', icon: 'person-outline', color: '#8b5cf6', screen: 'Profile' },
        { name: 'Sign Out', icon: 'log-out-outline', color: '#ef4444', action: 'logout' },
      ]
    }
  ];

  const renderSection = (section, sectionIndex) => {
    const isExpanded = expandedSections[section.title];
    const showItems = !section.expandable || isExpanded;

    return (
      <View key={sectionIndex} style={styles.section}>
        <TouchableOpacity 
          style={[
            styles.sectionHeader,
            section.expandable && styles.expandableSectionHeader
          ]}
          onPress={() => section.expandable && toggleSection(section.title)}
          activeOpacity={section.expandable ? 0.7 : 1}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.expandable && (
            <View style={[
              styles.expandIcon,
              isExpanded && styles.expandIconActive
            ]}>
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={isExpanded ? '#3e60ab' : '#64748b'} 
              />
            </View>
          )}
        </TouchableOpacity>
        
        {showItems && (
          <View style={styles.sectionItems}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.drawerItem,
                  index === section.items.length - 1 && styles.lastItem
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={20} color="white" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemText}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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
            {/* Gradient Background Effect */}
            <View style={styles.headerGradient} />
            <View style={styles.headerPattern} />
            
            <View style={styles.headerContent}>
              <View style={styles.profileSection}>
                <View style={styles.profileAvatar}>
                  {getUserAvatar()}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {(profileData?.name || profileData?.first_name || user?.name || user?.first_name || 'User')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Items */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {drawerSections.map((section, sectionIndex) => renderSection(section, sectionIndex))}

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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: 320,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    backgroundColor: '#3e60ab',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#243a75',
    opacity: 0.3,
  },
  headerPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  profileInitial: {
    ...FONT_STYLES.h3,
    color: 'white',
    letterSpacing: 0.3
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    ...FONT_STYLES.h4,
    color: 'white',
    letterSpacing: 0.3
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  expandableSectionHeader: {
    backgroundColor: 'rgba(62, 96, 171, 0.05)',
    marginHorizontal: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    ...FONT_STYLES.label,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sectionItems: {
    paddingHorizontal: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lastItem: {
    marginBottom: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    ...FONT_STYLES.body,
    color: '#1e293b',
    letterSpacing: 0.2
  },
  itemDescription: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginTop: 2
  },
  chevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  expandIconActive: {
    backgroundColor: 'rgba(62, 96, 171, 0.15)',
  },
  appInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  appName: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginBottom: 4,
    letterSpacing: 0.3
  },
  appVersion: {
    ...FONT_STYLES.caption,
    color: '#64748b',
    marginBottom: 2
  },
  appCopyright: {
    ...FONT_STYLES.captionSmall,
    color: '#94a3b8'
  },
});