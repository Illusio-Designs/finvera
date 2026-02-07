import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../../utils/fonts';
import * as LocalAuthentication from 'expo-local-authentication';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { tenantAPI } from '../../../lib/api';
import { buildUploadUrl } from '../../../config/env';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function SettingsScreen() {
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [preferences, setPreferences] = useState({
    // App preferences only
    biometric: false,
  });
  const [barcodeSettings, setBarcodeSettings] = useState({
    barcode_enabled: false,
    default_barcode_type: 'CODE128',
    default_barcode_prefix: 'FV',
  });
  const [tempBarcodeSettings, setTempBarcodeSettings] = useState({
    default_barcode_type: 'CODE128',
    default_barcode_prefix: 'FV',
  });
  
  // GST & Compliance Settings
  const [gstSettings, setGstSettings] = useState({
    einvoice_enabled: false,
    einvoice_threshold: 0,
    auto_generate_einvoice: false,
    einvoice_username: '',
    einvoice_password: '',
    ewaybill_enabled: false,
    ewaybill_threshold: 50000,
    auto_generate_ewaybill: false,
    ewaybill_username: '',
    ewaybill_password: '',
    tds_enabled: false,
    default_tds_section: '',
  });
  
  // Voucher Numbering Settings
  const [numberingSettings, setNumberingSettings] = useState({
    auto_numbering_enabled: true,
    numbering_prefix: 'FV',
    numbering_start: 1,
    numbering_padding: 4,
  });
  
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [showNumberingModal, setShowNumberingModal] = useState(false);
  const [tempGSTSettings, setTempGSTSettings] = useState({});
  const [tempNumberingSettings, setTempNumberingSettings] = useState({});

  const handleMenuPress = () => {
    openDrawer();
  };

  useEffect(() => {
    checkBiometricAvailability();
    fetchBarcodeSettings();
  }, []);

  const fetchBarcodeSettings = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getProfile();
      const tenant = response?.data?.data || response?.data;
      const settings = tenant?.settings || {};
      
      // Barcode Settings
      setBarcodeSettings({
        barcode_enabled: settings.barcode_enabled === true,
        default_barcode_type: settings.default_barcode_type || 'CODE128',
        default_barcode_prefix: settings.default_barcode_prefix || 'FV',
      });
      
      setTempBarcodeSettings({
        default_barcode_type: settings.default_barcode_type || 'CODE128',
        default_barcode_prefix: settings.default_barcode_prefix || 'FV',
      });
      
      // GST & Compliance Settings
      setGstSettings({
        einvoice_enabled: settings.einvoice_enabled === true,
        einvoice_threshold: settings.einvoice_threshold || 0,
        auto_generate_einvoice: settings.auto_generate_einvoice === true,
        einvoice_username: settings.einvoice_username || '',
        einvoice_password: settings.einvoice_password || '',
        ewaybill_enabled: settings.ewaybill_enabled === true,
        ewaybill_threshold: settings.ewaybill_threshold || 50000,
        auto_generate_ewaybill: settings.auto_generate_ewaybill === true,
        ewaybill_username: settings.ewaybill_username || '',
        ewaybill_password: settings.ewaybill_password || '',
        tds_enabled: settings.tds_enabled === true,
        default_tds_section: settings.default_tds_section || '',
      });
      
      setTempGSTSettings({
        einvoice_threshold: settings.einvoice_threshold || 0,
        auto_generate_einvoice: settings.auto_generate_einvoice === true,
        einvoice_username: settings.einvoice_username || '',
        einvoice_password: settings.einvoice_password || '',
        ewaybill_threshold: settings.ewaybill_threshold || 50000,
        auto_generate_ewaybill: settings.auto_generate_ewaybill === true,
        ewaybill_username: settings.ewaybill_username || '',
        ewaybill_password: settings.ewaybill_password || '',
        default_tds_section: settings.default_tds_section || '',
      });
      
      // Voucher Numbering Settings
      setNumberingSettings({
        auto_numbering_enabled: settings.auto_numbering_enabled !== false,
        numbering_prefix: settings.numbering_prefix || 'FV',
        numbering_start: settings.numbering_start || 1,
        numbering_padding: settings.numbering_padding || 4,
      });
      
      setTempNumberingSettings({
        numbering_prefix: settings.numbering_prefix || 'FV',
        numbering_start: settings.numbering_start || 1,
        numbering_padding: settings.numbering_padding || 4,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBarcodeSettings = async (newSettings) => {
    try {
      setLoading(true);
      await tenantAPI.updateProfile({
        settings: {
          ...barcodeSettings,
          ...newSettings,
        }
      });
      
      setBarcodeSettings(prev => ({ ...prev, ...newSettings }));
      
      showNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Barcode settings have been saved successfully'
      });
    } catch (error) {
      console.error('Error updating barcode settings:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update barcode settings'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateGSTSettings = async (newSettings) => {
    try {
      setLoading(true);
      await tenantAPI.updateProfile({
        settings: {
          ...gstSettings,
          ...newSettings,
        }
      });
      
      setGstSettings(prev => ({ ...prev, ...newSettings }));
      
      showNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'GST & Compliance settings have been saved successfully'
      });
    } catch (error) {
      console.error('Error updating GST settings:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update GST settings'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateNumberingSettings = async (newSettings) => {
    try {
      setLoading(true);
      await tenantAPI.updateProfile({
        settings: {
          ...numberingSettings,
          ...newSettings,
        }
      });
      
      setNumberingSettings(prev => ({ ...prev, ...newSettings }));
      
      showNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Voucher numbering settings have been saved successfully'
      });
    } catch (error) {
      console.error('Error updating numbering settings:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update numbering settings'
      });
    } finally {
      setLoading(false);
    }
  };

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
    await fetchBarcodeSettings();
    setRefreshing(false);
  };

  const toggleSetting = async (key) => {
    if (key === 'barcode_enabled') {
      const newValue = !barcodeSettings.barcode_enabled;
      await updateBarcodeSettings({ barcode_enabled: newValue });
    } else if (key === 'einvoice_enabled') {
      const newValue = !gstSettings.einvoice_enabled;
      await updateGSTSettings({ einvoice_enabled: newValue });
    } else if (key === 'ewaybill_enabled') {
      const newValue = !gstSettings.ewaybill_enabled;
      await updateGSTSettings({ ewaybill_enabled: newValue });
    } else if (key === 'tds_enabled') {
      const newValue = !gstSettings.tds_enabled;
      await updateGSTSettings({ tds_enabled: newValue });
    } else if (key === 'auto_numbering_enabled') {
      const newValue = !numberingSettings.auto_numbering_enabled;
      await updateNumberingSettings({ auto_numbering_enabled: newValue });
    } else if (key === 'biometric') {
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

  const handleBarcodeConfig = () => {
    setTempBarcodeSettings({
      default_barcode_type: barcodeSettings.default_barcode_type,
      default_barcode_prefix: barcodeSettings.default_barcode_prefix,
    });
    setShowBarcodeModal(true);
  };

  const saveBarcodeConfig = async () => {
    await updateBarcodeSettings(tempBarcodeSettings);
    setShowBarcodeModal(false);
  };
  
  const handleGSTConfig = () => {
    setTempGSTSettings({
      einvoice_threshold: gstSettings.einvoice_threshold,
      auto_generate_einvoice: gstSettings.auto_generate_einvoice,
      einvoice_username: gstSettings.einvoice_username,
      einvoice_password: gstSettings.einvoice_password,
      ewaybill_threshold: gstSettings.ewaybill_threshold,
      auto_generate_ewaybill: gstSettings.auto_generate_ewaybill,
      ewaybill_username: gstSettings.ewaybill_username,
      ewaybill_password: gstSettings.ewaybill_password,
      default_tds_section: gstSettings.default_tds_section,
    });
    setShowGSTModal(true);
  };

  const saveGSTConfig = async () => {
    await updateGSTSettings(tempGSTSettings);
    setShowGSTModal(false);
  };
  
  const handleNumberingConfig = () => {
    setTempNumberingSettings({
      numbering_prefix: numberingSettings.numbering_prefix,
      numbering_start: numberingSettings.numbering_start,
      numbering_padding: numberingSettings.numbering_padding,
    });
    setShowNumberingModal(true);
  };

  const saveNumberingConfig = async () => {
    await updateNumberingSettings(tempNumberingSettings);
    setShowNumberingModal(false);
  };

  const settingSections = [
    {
      title: 'GST & Compliance',
      items: [
        {
          key: 'einvoice_enabled',
          label: 'E-Invoice',
          description: 'Enable electronic invoicing',
          type: 'switch',
          value: gstSettings.einvoice_enabled,
          icon: 'document-text-outline'
        },
        {
          key: 'einvoice_config',
          label: 'E-Invoice Configuration',
          description: `Threshold: ₹${gstSettings.einvoice_threshold}, User: ${gstSettings.einvoice_username || 'Not Set'}`,
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleGSTConfig,
          disabled: !gstSettings.einvoice_enabled
        },
        {
          key: 'ewaybill_enabled',
          label: 'E-Way Bill',
          description: 'Enable electronic way bill',
          type: 'switch',
          value: gstSettings.ewaybill_enabled,
          icon: 'car-outline'
        },
        {
          key: 'ewaybill_config',
          label: 'E-Way Bill Configuration',
          description: `Threshold: ₹${gstSettings.ewaybill_threshold}, User: ${gstSettings.ewaybill_username || 'Not Set'}`,
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleGSTConfig,
          disabled: !gstSettings.ewaybill_enabled
        },
        {
          key: 'tds_enabled',
          label: 'TDS',
          description: 'Enable Tax Deducted at Source',
          type: 'switch',
          value: gstSettings.tds_enabled,
          icon: 'calculator-outline'
        },
        {
          key: 'tds_config',
          label: 'TDS Configuration',
          description: `Default Section: ${gstSettings.default_tds_section || 'Not Set'}`,
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleGSTConfig,
          disabled: !gstSettings.tds_enabled
        },
      ]
    },
    {
      title: 'Voucher Numbering',
      items: [
        {
          key: 'auto_numbering_enabled',
          label: 'Auto Numbering',
          description: 'Automatically generate voucher numbers',
          type: 'switch',
          value: numberingSettings.auto_numbering_enabled,
          icon: 'list-outline'
        },
        {
          key: 'numbering_config',
          label: 'Numbering Configuration',
          description: `Format: ${numberingSettings.numbering_prefix}${String(numberingSettings.numbering_start).padStart(numberingSettings.numbering_padding, '0')}`,
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleNumberingConfig,
          disabled: !numberingSettings.auto_numbering_enabled
        },
      ]
    },
    {
      title: 'Barcode Settings',
      items: [
        {
          key: 'barcode_enabled',
          label: 'Enable Barcode',
          description: 'Use barcodes in purchase and sales',
          type: 'switch',
          value: barcodeSettings.barcode_enabled,
          icon: 'barcode-outline'
        },
        {
          key: 'barcode_config',
          label: 'Barcode Configuration',
          description: `Type: ${barcodeSettings.default_barcode_type}, Prefix: ${barcodeSettings.default_barcode_prefix}`,
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleBarcodeConfig,
          disabled: !barcodeSettings.barcode_enabled
        },
      ]
    },
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

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Settings" 
          onMenuPress={handleMenuPress}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#e5e7eb' }} />
            </View>
            <View style={styles.userInfo}>
              <View style={{ width: 120, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
              <View style={{ width: 180, height: 14, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
            </View>
          </View>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </ScrollView>
      </View>
    );
  }

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
                    itemIndex === section.items.length - 1 && styles.settingItemLast,
                    item.disabled && styles.settingItemDisabled
                  ]}
                  onPress={item.onPress || (item.type === 'switch' ? () => toggleSetting(item.key) : null)}
                  disabled={item.type === 'switch' || item.disabled}
                  activeOpacity={item.disabled ? 1 : 0.7}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={[styles.settingIcon, item.disabled && styles.settingIconDisabled]}>
                      <Ionicons name={item.icon} size={20} color={item.disabled ? '#9ca3af' : '#3e60ab'} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, item.disabled && styles.settingLabelDisabled]}>{item.label}</Text>
                      <Text style={[styles.settingDescription, item.disabled && styles.settingDescriptionDisabled]}>{item.description}</Text>
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

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Finvera Mobile</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2024 Finvera Solutions</Text>
        </View>
      </ScrollView>

      {/* Barcode Configuration Modal */}
      <Modal
        visible={showBarcodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Barcode Configuration</Text>
            <TouchableOpacity 
              onPress={() => setShowBarcodeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Barcode Type</Text>
              <View style={styles.radioGroup}>
                {['CODE128', 'CODE39', 'EAN13', 'EAN8'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setTempBarcodeSettings(prev => ({ ...prev, default_barcode_type: type }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      tempBarcodeSettings.default_barcode_type === type && styles.radioCircleSelected
                    ]}>
                      {tempBarcodeSettings.default_barcode_type === type && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Barcode Prefix</Text>
              <TextInput
                style={styles.input}
                value={tempBarcodeSettings.default_barcode_prefix}
                onChangeText={(text) => setTempBarcodeSettings(prev => ({ ...prev, default_barcode_prefix: text }))}
                placeholder="Enter prefix (e.g., FV)"
                placeholderTextColor="#9ca3af"
                maxLength={10}
              />
              <Text style={styles.helpText}>
                This prefix will be added to auto-generated barcodes
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowBarcodeModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveBarcodeConfig}
                disabled={loading}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* GST & Compliance Configuration Modal */}
      <Modal
        visible={showGSTModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGSTModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>GST & Compliance Configuration</Text>
            <TouchableOpacity 
              onPress={() => setShowGSTModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* E-Invoice Settings */}
            {gstSettings.einvoice_enabled && (
              <>
                <Text style={styles.sectionHeader}>E-Invoice Settings</Text>
                <Text style={styles.infoText}>
                  Create API credentials on IRP Portal (einvoice1.gst.gov.in) using your GSTIN
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>E-Invoice Username</Text>
                  <TextInput
                    style={styles.input}
                    value={tempGSTSettings.einvoice_username}
                    onChangeText={(text) => setTempGSTSettings(prev => ({ ...prev, einvoice_username: text }))}
                    placeholder="Enter E-Invoice API Username"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                  />
                  <Text style={styles.helpText}>
                    API Username created on IRP Portal
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>E-Invoice Password</Text>
                  <TextInput
                    style={styles.input}
                    value={tempGSTSettings.einvoice_password}
                    onChangeText={(text) => setTempGSTSettings(prev => ({ ...prev, einvoice_password: text }))}
                    placeholder="Enter E-Invoice API Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.helpText}>
                    API Password created on IRP Portal
                  </Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Invoice Threshold (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(tempGSTSettings.einvoice_threshold || 0)}
                    onChangeText={(text) => setTempGSTSettings(prev => ({ ...prev, einvoice_threshold: parseInt(text) || 0 }))}
                    placeholder="Enter threshold amount"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                  <Text style={styles.helpText}>
                    E-Invoice will be generated for invoices above this amount
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchInfo}>
                      <Text style={styles.label}>Auto Generate E-Invoice</Text>
                      <Text style={styles.helpText}>
                        Automatically generate e-invoice when posting voucher
                      </Text>
                    </View>
                    <Switch
                      value={tempGSTSettings.auto_generate_einvoice}
                      onValueChange={(value) => setTempGSTSettings(prev => ({ ...prev, auto_generate_einvoice: value }))}
                      trackColor={{ false: '#e5e7eb', true: '#3e60ab' }}
                      thumbColor={tempGSTSettings.auto_generate_einvoice ? '#ffffff' : '#f3f4f6'}
                    />
                  </View>
                </View>
              </>
            )}

            {/* E-Way Bill Settings */}
            {gstSettings.ewaybill_enabled && (
              <>
                <Text style={styles.sectionHeader}>E-Way Bill Settings</Text>
                <Text style={styles.infoText}>
                  Create API credentials on E-Way Bill Portal (ewaybillgst.gov.in) using your GSTIN
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>E-Way Bill Username</Text>
                  <TextInput
                    style={styles.input}
                    value={tempGSTSettings.ewaybill_username}
                    onChangeText={(text) => setTempGSTSettings(prev => ({ ...prev, ewaybill_username: text }))}
                    placeholder="Enter E-Way Bill API Username"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                  />
                  <Text style={styles.helpText}>
                    API Username created on E-Way Bill Portal
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>E-Way Bill Password</Text>
                  <TextInput
                    style={styles.input}
                    value={tempGSTSettings.ewaybill_password}
                    onChangeText={(text) => setTempGSTSettings(prev => ({ ...prev, ewaybill_password: text }))}
                    placeholder="Enter E-Way Bill API Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.helpText}>
                    API Password created on E-Way Bill Portal
                  </Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>E-Way Bill Threshold (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(tempGSTSettings.ewaybill_threshold || 50000)}
                    onChangeText={(text) => setTempGSTSettings(prev => ({ ...prev, ewaybill_threshold: parseInt(text) || 50000 }))}
                    placeholder="Enter threshold amount"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                  <Text style={styles.helpText}>
                    E-Way Bill will be generated for invoices above this amount
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchInfo}>
                      <Text style={styles.label}>Auto Generate E-Way Bill</Text>
                      <Text style={styles.helpText}>
                        Automatically generate e-way bill when posting voucher
                      </Text>
                    </View>
                    <Switch
                      value={tempGSTSettings.auto_generate_ewaybill}
                      onValueChange={(value) => setTempGSTSettings(prev => ({ ...prev, auto_generate_ewaybill: value }))}
                      trackColor={{ false: '#e5e7eb', true: '#3e60ab' }}
                      thumbColor={tempGSTSettings.auto_generate_ewaybill ? '#ffffff' : '#f3f4f6'}
                    />
                  </View>
                </View>
              </>
            )}

            {/* TDS Settings */}
            {gstSettings.tds_enabled && (
              <>
                <Text style={styles.sectionHeader}>TDS Settings</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Default TDS Section</Text>
                  <View style={styles.radioGroup}>
                    {['194C', '194J', '194I', '194H', '194A'].map((section) => (
                      <TouchableOpacity
                        key={section}
                        style={styles.radioOption}
                        onPress={() => setTempGSTSettings(prev => ({ ...prev, default_tds_section: section }))}
                      >
                        <View style={[
                          styles.radioCircle,
                          tempGSTSettings.default_tds_section === section && styles.radioCircleSelected
                        ]}>
                          {tempGSTSettings.default_tds_section === section && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <Text style={styles.radioLabel}>Section {section}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.helpText}>
                    This section will be pre-selected in TDS calculations
                  </Text>
                </View>
              </>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowGSTModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveGSTConfig}
                disabled={loading}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Voucher Numbering Configuration Modal */}
      <Modal
        visible={showNumberingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNumberingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voucher Numbering Configuration</Text>
            <TouchableOpacity 
              onPress={() => setShowNumberingModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Numbering Prefix</Text>
              <TextInput
                style={styles.input}
                value={tempNumberingSettings.numbering_prefix}
                onChangeText={(text) => setTempNumberingSettings(prev => ({ ...prev, numbering_prefix: text }))}
                placeholder="Enter prefix (e.g., FV)"
                placeholderTextColor="#9ca3af"
                maxLength={10}
              />
              <Text style={styles.helpText}>
                This prefix will be added to all voucher numbers
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Starting Number</Text>
              <TextInput
                style={styles.input}
                value={String(tempNumberingSettings.numbering_start)}
                onChangeText={(text) => setTempNumberingSettings(prev => ({ ...prev, numbering_start: parseInt(text) || 1 }))}
                placeholder="Enter starting number"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                Voucher numbering will start from this number
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Number Padding</Text>
              <View style={styles.radioGroup}>
                {[3, 4, 5, 6].map((padding) => (
                  <TouchableOpacity
                    key={padding}
                    style={styles.radioOption}
                    onPress={() => setTempNumberingSettings(prev => ({ ...prev, numbering_padding: padding }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      tempNumberingSettings.numbering_padding === padding && styles.radioCircleSelected
                    ]}>
                      {tempNumberingSettings.numbering_padding === padding && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{padding} digits (e.g., {String(1).padStart(padding, '0')})</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helpText}>
                Preview: {tempNumberingSettings.numbering_prefix}{String(tempNumberingSettings.numbering_start).padStart(tempNumberingSettings.numbering_padding, '0')}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowNumberingModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveNumberingConfig}
                disabled={loading}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    ...FONT_STYLES.h2,
    color: 'white'
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  userEmail: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 20
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
  settingItemDisabled: {
    opacity: 0.5,
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
  settingIconDisabled: {
    backgroundColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 2
  },
  settingLabelDisabled: {
    color: '#9ca3af',
  },
  settingDescription: {
    ...FONT_STYLES.caption,
    color: '#6b7280'
  },
  settingDescriptionDisabled: {
    color: '#d1d5db',
  },
  settingItemRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
    maxWidth: 120,
  },
  infoValue: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'right'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#3e60ab',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3e60ab',
  },
  radioLabel: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  input: {
    ...FONT_STYLES.h5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: 'white'
  },
  helpText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  saveButton: {
    backgroundColor: '#3e60ab',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginBottom: 4
  },
  versionNumber: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 2
  },
  copyright: {
    ...FONT_STYLES.captionSmall,
    color: '#9ca3af'
  },
  sectionHeader: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    backgroundColor: '#f0f4fc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
});