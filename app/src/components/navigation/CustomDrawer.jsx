import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomDrawer({ visible, onClose }) {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState({});

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
    if (user?.profile_image || user?.avatar) {
      return (
        <Image 
          source={{ uri: user.profile_image || user.avatar }} 
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
          {(user?.name || user?.first_name || 'U').charAt(0).toUpperCase()}
        </Text>
      );
    }
  };

  const drawerSections = [
    {
      title: 'Main Navigation',
      items: [
        { name: 'Dashboard', icon: 'home-outline', color: '#3e60ab', screen: 'Dashboard' },
        { name: 'Vouchers & Invoices', icon: 'document-text-outline', color: '#10b981', screen: 'Vouchers' },
        { name: 'Reports & Analytics', icon: 'bar-chart-outline', color: '#f59e0b', screen: 'Reports' },
        { name: 'Inventory Management', icon: 'cube-outline', color: '#3e60ab', screen: 'Inventory' },
        { name: 'GST Management', icon: 'receipt-outline', color: '#8b5cf6', screen: 'GST' },
      ]
    },
    {
      title: 'Quick Create',
      items: [
        { name: 'Create Voucher', icon: 'add-circle-outline', color: '#10b981', screen: 'Vouchers', description: 'New voucher/invoice' },
        { name: 'Create Item', icon: 'cube-outline', color: '#3e60ab', screen: 'InventoryItems', params: { mode: 'create' }, description: 'New inventory item' },
        { name: 'Create Ledger', icon: 'folder-outline', color: '#f59e0b', screen: 'Ledgers', params: { mode: 'create' }, description: 'New account ledger' },
        { name: 'Create Adjustment', icon: 'swap-horizontal-outline', color: '#8b5cf6', screen: 'InventoryAdjustment', params: { mode: 'create' }, description: 'Stock adjustment' },
      ]
    },
    {
      title: 'Accounting & Finance',
      expandable: true,
      items: [
        { name: 'Account Ledgers', icon: 'folder-outline', color: '#10b981', screen: 'Ledgers' },
        { name: 'Payment Vouchers', icon: 'card-outline', color: '#3e60ab', screen: 'Payment' },
        { name: 'Receipt Vouchers', icon: 'receipt-outline', color: '#10b981', screen: 'Receipt' },
        { name: 'Journal Entries', icon: 'journal-outline', color: '#8b5cf6', screen: 'Journal' },
        { name: 'Contra Entries', icon: 'swap-horizontal-outline', color: '#f59e0b', screen: 'Contra' },
        { name: 'Debit Notes', icon: 'remove-circle-outline', color: '#ef4444', screen: 'DebitNote' },
        { name: 'Credit Notes', icon: 'add-circle-outline', color: '#10b981', screen: 'CreditNote' },
      ]
    },
    {
      title: 'Inventory & Stock',
      expandable: true,
      items: [
        { name: 'Inventory Items', icon: 'list-outline', color: '#10b981', screen: 'InventoryItems' },
        { name: 'Stock Adjustments', icon: 'swap-horizontal-outline', color: '#f59e0b', screen: 'InventoryAdjustment' },
        { name: 'Stock Transfers', icon: 'arrow-forward-outline', color: '#3b82f6', screen: 'InventoryTransfer' },
        { name: 'Warehouses', icon: 'storefront-outline', color: '#8b5cf6', screen: 'Warehouses' },
        { name: 'Product Attributes', icon: 'pricetag-outline', color: '#ef4444', screen: 'Attributes' },
      ]
    },
    {
      title: 'GST & Compliance',
      expandable: true,
      items: [
        { name: 'GSTIN Records', icon: 'card-outline', color: '#10b981', screen: 'GSTINs' },
        { name: 'GST Rates', icon: 'calculator-outline', color: '#f59e0b', screen: 'GSTRates' },
        { name: 'E-Invoice', icon: 'document-text-outline', color: '#3b82f6', screen: 'EInvoice' },
        { name: 'E-Way Bill', icon: 'car-outline', color: '#ef4444', screen: 'EWayBill' },
      ]
    },
    {
      title: 'Tax Management',
      expandable: true,
      items: [
        { name: 'Income Tax', icon: 'document-text-outline', color: '#3e60ab', screen: 'IncomeTax' },
        { name: 'Tax Calculator', icon: 'calculator-outline', color: '#10b981', screen: 'TaxCalculator' },
        { name: 'TDS Management', icon: 'receipt-outline', color: '#f59e0b', screen: 'TDS' },
      ]
    },
    {
      title: 'Financial Reports',
      expandable: true,
      items: [
        { name: 'Balance Sheet', icon: 'document-text-outline', color: '#3e60ab', screen: 'BalanceSheet' },
        { name: 'Profit & Loss', icon: 'trending-up-outline', color: '#10b981', screen: 'ProfitLoss' },
      ]
    },
    {
      title: 'Business Services',
      expandable: true,
      items: [
        { name: 'Subscription Plans', icon: 'diamond-outline', color: '#3e60ab', screen: 'Plans' },
        { name: 'My Subscription', icon: 'card-outline', color: '#10b981', screen: 'Subscribe' },
        { name: 'Reviews & Feedback', icon: 'star-outline', color: '#f59e0b', screen: 'Review' },
        { name: 'Business Loan', icon: 'business-outline', color: '#8b5cf6', screen: 'Loan' },
        { name: 'Referral Program', icon: 'people-outline', color: '#ef4444', screen: 'Referral' },
      ]
    },
    {
      title: 'Tools & Utilities',
      expandable: true,
      items: [
        { name: 'Tally Import', icon: 'cloud-upload-outline', color: '#3e60ab', screen: 'TallyImport' },
        { name: 'Notifications', icon: 'notifications-outline', color: '#f59e0b', screen: 'Notifications' },
        { name: 'Companies', icon: 'business-outline', color: '#f59e0b', screen: 'Companies' },
        { name: 'Help & Support', icon: 'help-circle-outline', color: '#ef4444', screen: 'Support' },
      ]
    },
    {
      title: 'Your Account',
      items: [
        { name: 'Profile', icon: 'person-outline', color: '#8b5cf6', screen: 'Profile' },
        { name: 'Settings', icon: 'settings-outline', color: '#6b7280', screen: 'Settings' },
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
          style={styles.sectionHeader}
          onPress={() => section.expandable && toggleSection(section.title)}
          activeOpacity={section.expandable ? 0.7 : 1}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.expandable && (
            <View style={styles.expandIcon}>
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={18} 
                color="#64748b" 
              />
            </View>
          )}
        </TouchableOpacity>
        
        {showItems && section.items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.drawerItem,
              { backgroundColor: 'rgba(255, 255, 255, 0.7)' }
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={22} color="white" />
            </View>
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ))}
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
                    {user?.name || user?.first_name || 'User'}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {user?.email || 'user@example.com'}
                  </Text>
                  {user?.company_name && (
                    <Text style={styles.profileCompany}>
                      {user.company_name}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  profileSection: {
    flex: 1,
    paddingRight: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImage: {
    width: 74,
    height: 74,
    borderRadius: 21,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Agency',
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Agency',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  profileCompany: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Agency',
    fontStyle: 'italic',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingVertical: 24,
    backgroundColor: '#fafbfc',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'Agency',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'Agency',
    letterSpacing: 0.3,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  appVersion: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'Agency',
  },
});