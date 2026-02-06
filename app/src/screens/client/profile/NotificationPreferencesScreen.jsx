import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { notificationAPI } from '../../../lib/api';

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  
  const [preferences, setPreferences] = useState({
    // General Notifications
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    
    // Business Notifications
    voucher_created: true,
    voucher_updated: true,
    payment_received: true,
    payment_due: true,
    
    // GST Notifications
    gst_return_due: true,
    gst_return_filed: true,
    einvoice_generated: true,
    ewaybill_generated: true,
    
    // Inventory Notifications
    low_stock_alert: true,
    out_of_stock_alert: true,
    stock_adjustment: false,
    stock_transfer: false,
    
    // System Notifications
    system_maintenance: true,
    security_alerts: true,
    feature_updates: false,
    promotional: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await notificationAPI.preferences.get();
      const data = response.data?.data || response.data || {};
      setPreferences(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      setSaving(true);
      await notificationAPI.preferences.update(newPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(preferences);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update notification preferences'
      });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type) => {
    // Test functionality not available in backend
    showNotification({
      type: 'info',
      title: 'Test Feature',
      message: 'Test notification feature is not available yet'
    });
  };

  const notificationSections = [
    {
      title: 'General Notifications',
      description: 'Control how you receive notifications',
      items: [
        {
          key: 'push_notifications',
          label: 'Push Notifications',
          description: 'Receive push notifications on your device',
          icon: 'notifications-outline',
          testable: true,
        },
        {
          key: 'email_notifications',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: 'mail-outline',
          testable: true,
        },
        {
          key: 'sms_notifications',
          label: 'SMS Notifications',
          description: 'Receive notifications via SMS',
          icon: 'chatbubble-outline',
        },
      ]
    },
    {
      title: 'Business Activities',
      description: 'Get notified about important business events',
      items: [
        {
          key: 'voucher_created',
          label: 'Voucher Created',
          description: 'When a new voucher is created',
          icon: 'document-text-outline',
        },
        {
          key: 'voucher_updated',
          label: 'Voucher Updated',
          description: 'When a voucher is modified',
          icon: 'create-outline',
        },
        {
          key: 'payment_received',
          label: 'Payment Received',
          description: 'When a payment is received',
          icon: 'card-outline',
        },
        {
          key: 'payment_due',
          label: 'Payment Due',
          description: 'When a payment is due',
          icon: 'time-outline',
        },
      ]
    },
    {
      title: 'GST & Compliance',
      description: 'Stay updated on GST and compliance matters',
      items: [
        {
          key: 'gst_return_due',
          label: 'GST Return Due',
          description: 'When GST return filing is due',
          icon: 'receipt-outline',
        },
        {
          key: 'gst_return_filed',
          label: 'GST Return Filed',
          description: 'When GST return is successfully filed',
          icon: 'checkmark-circle-outline',
        },
        {
          key: 'einvoice_generated',
          label: 'E-Invoice Generated',
          description: 'When an e-invoice is generated',
          icon: 'document-outline',
        },
        {
          key: 'ewaybill_generated',
          label: 'E-Way Bill Generated',
          description: 'When an e-way bill is generated',
          icon: 'car-outline',
        },
      ]
    },
    {
      title: 'Inventory Management',
      description: 'Monitor your inventory levels',
      items: [
        {
          key: 'low_stock_alert',
          label: 'Low Stock Alert',
          description: 'When inventory is running low',
          icon: 'warning-outline',
        },
        {
          key: 'out_of_stock_alert',
          label: 'Out of Stock Alert',
          description: 'When items are out of stock',
          icon: 'alert-circle-outline',
        },
        {
          key: 'stock_adjustment',
          label: 'Stock Adjustments',
          description: 'When stock is adjusted',
          icon: 'swap-horizontal-outline',
        },
        {
          key: 'stock_transfer',
          label: 'Stock Transfers',
          description: 'When stock is transferred',
          icon: 'arrow-forward-outline',
        },
      ]
    },
    {
      title: 'System & Updates',
      description: 'System notifications and updates',
      items: [
        {
          key: 'system_maintenance',
          label: 'System Maintenance',
          description: 'Scheduled maintenance notifications',
          icon: 'construct-outline',
        },
        {
          key: 'security_alerts',
          label: 'Security Alerts',
          description: 'Important security notifications',
          icon: 'shield-outline',
        },
        {
          key: 'feature_updates',
          label: 'Feature Updates',
          description: 'New features and improvements',
          icon: 'rocket-outline',
        },
        {
          key: 'promotional',
          label: 'Promotional',
          description: 'Marketing and promotional content',
          icon: 'megaphone-outline',
        },
      ]
    }
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Notification Preferences" 
          onMenuPress={handleMenuPress}
          onSearchPress={handleSearchPress}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Notification Preferences" 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {notificationSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>{section.description}</Text>
            </View>
            
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.preferenceItem,
                    itemIndex === section.items.length - 1 && styles.preferenceItemLast
                  ]}
                >
                  <View style={styles.preferenceItemLeft}>
                    <View style={styles.preferenceIcon}>
                      <Ionicons name={item.icon} size={20} color="#3e60ab" />
                    </View>
                    <View style={styles.preferenceInfo}>
                      <Text style={styles.preferenceLabel}>{item.label}</Text>
                      <Text style={styles.preferenceDescription}>{item.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.preferenceItemRight}>
                    {item.testable && preferences[item.key] && (
                      <TouchableOpacity
                        style={styles.testButton}
                        onPress={() => testNotification(item.key === 'push_notifications' ? 'push' : 'email')}
                      >
                        <Text style={styles.testButtonText}>Test</Text>
                      </TouchableOpacity>
                    )}
                    <Switch
                      value={preferences[item.key]}
                      onValueChange={(value) => updatePreference(item.key, value)}
                      trackColor={{ false: '#e5e7eb', true: '#3e60ab' }}
                      thumbColor={preferences[item.key] ? '#ffffff' : '#f3f4f6'}
                      disabled={saving}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Save Status */}
        {saving && (
          <View style={styles.savingIndicator}>
            <Text style={styles.savingText}>Saving preferences...</Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  sectionDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280'
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
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  preferenceItemLast: {
    borderBottomWidth: 0,
  },
  preferenceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceLabel: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 2
  },
  preferenceDescription: {
    ...FONT_STYLES.caption,
    color: '#6b7280'
  },
  preferenceItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  testButton: {
    backgroundColor: '#f0f4fc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  testButtonText: {
    ...FONT_STYLES.caption,
    color: '#3e60ab'
  },
  savingIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  savingText: {
    ...FONT_STYLES.label,
    color: '#3e60ab'
  },
});