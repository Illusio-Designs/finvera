import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../../utils/fonts';
import * as LocalAuthentication from 'expo-local-authentication';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { tenantAPI, companyAPI } from '../../../lib/api';
import { buildUploadUrl } from '../../../config/env';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [showTDSConfigModal, setShowTDSConfigModal] = useState(false);
  const [showGSTINModal, setShowGSTINModal] = useState(false);
  
  const [companyInfo, setCompanyInfo] = useState({
    id: null,
    business_type: 'trader',
  });
  
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
  
  // GST & Compliance Settings (from Company)
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
    tds_tcs_enabled: false,
  });
  
  const [tempGSTSettings, setTempGSTSettings] = useState({});
  
  // Voucher Numbering Settings (from Tenant)
  const [numberingSettings, setNumberingSettings] = useState({
    auto_numbering_enabled: true,
    use_advanced_numbering: false, // Whether to use NumberingSeries or simple numbering
  });
  
  const [tempNumberingSettings, setTempNumberingSettings] = useState({});
  
  // TDS/TCS Configuration (from Company)
  const [tdsConfig, setTdsConfig] = useState({
    tan_number: '',
    tds_circle: '',
    tds_ao_code: '',
    tds_deductor_type: 'company',
    tds_responsible_person: '',
    tds_responsible_designation: '',
    default_tds_section: '',
    default_tcs_section: '',
  });
  
  const [tempTDSConfig, setTempTDSConfig] = useState({
    tan_number: '',
    tds_circle: '',
    tds_ao_code: '',
    tds_deductor_type: 'company',
    tds_responsible_person: '',
    tds_responsible_designation: '',
    default_tds_section: '',
    default_tcs_section: '',
  });
  
  // GSTIN Configuration (from Company)
  const [gstinConfig, setGstinConfig] = useState({
    gstin: '',
    legal_name: '',
    trade_name: '',
    state_code: '',
    state_name: '',
  });
  
  const [tempGSTINConfig, setTempGSTINConfig] = useState({
    gstin: '',
    legal_name: '',
    trade_name: '',
    state_code: '',
    state_name: '',
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  useEffect(() => {
    checkBiometricAvailability();
    if (user?.company_id) {
      fetchBarcodeSettings();
    }
  }, [user?.company_id]);

  const fetchBarcodeSettings = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getProfile();
      const tenant = response?.data?.data || response?.data;
      const settings = tenant?.settings || {};
      
      // Get company ID from user context
      const companyId = user?.company_id;
      
      if (!companyId) {
        console.warn('No company_id found in user context');
        setLoading(false);
        return;
      }
      
      // Fetch company configuration
      try {
        const companyResponse = await companyAPI.get(companyId);
        const company = companyResponse?.data?.data || companyResponse?.data;
        
        if (company) {
          // Store company info
          setCompanyInfo({
            id: company.id,
            business_type: company.business_type || 'trader',
          });
          
          // GST & Compliance Settings (from Company compliance JSON)
          const compliance = company.compliance || {};
          setGstSettings({
            einvoice_enabled: compliance.einvoice_enabled === true,
            einvoice_threshold: compliance.einvoice_threshold || 0,
            auto_generate_einvoice: compliance.auto_generate_einvoice === true,
            einvoice_username: compliance.einvoice_username || '',
            einvoice_password: compliance.einvoice_password || '',
            ewaybill_enabled: compliance.ewaybill_enabled === true,
            ewaybill_threshold: compliance.ewaybill_threshold || 50000,
            auto_generate_ewaybill: compliance.auto_generate_ewaybill === true,
            ewaybill_username: compliance.ewaybill_username || '',
            ewaybill_password: compliance.ewaybill_password || '',
            tds_tcs_enabled: company.is_tds_enabled === true || company.is_tcs_enabled === true,
          });
          
          setTempGSTSettings({
            einvoice_threshold: compliance.einvoice_threshold || 0,
            auto_generate_einvoice: compliance.auto_generate_einvoice === true,
            einvoice_username: compliance.einvoice_username || '',
            einvoice_password: compliance.einvoice_password || '',
            ewaybill_threshold: compliance.ewaybill_threshold || 50000,
            auto_generate_ewaybill: compliance.auto_generate_ewaybill === true,
            ewaybill_username: compliance.ewaybill_username || '',
            ewaybill_password: compliance.ewaybill_password || '',
          });
          
          // TDS/TCS Configuration (from Company)
          setTdsConfig({
            tan_number: company.tan_number || '',
            tds_circle: company.tds_circle || '',
            tds_ao_code: company.tds_ao_code || '',
            tds_deductor_type: company.tds_deductor_type || 'company',
            tds_responsible_person: company.tds_responsible_person || '',
            tds_responsible_designation: company.tds_responsible_designation || '',
            default_tds_section: compliance.default_tds_section || '',
            default_tcs_section: compliance.default_tcs_section || '',
          });
          
          setTempTDSConfig({
            tan_number: company.tan_number || '',
            tds_circle: company.tds_circle || '',
            tds_ao_code: company.tds_ao_code || '',
            tds_deductor_type: company.tds_deductor_type || 'company',
            tds_responsible_person: company.tds_responsible_person || '',
            tds_responsible_designation: company.tds_responsible_designation || '',
            default_tds_section: compliance.default_tds_section || '',
            default_tcs_section: compliance.default_tcs_section || '',
          });
          
          // GSTIN Configuration (from Company)
          setGstinConfig({
            gstin: company.gstin || '',
            legal_name: company.legal_name || '',
            trade_name: company.trade_name || '',
            state_code: company.state_code || '',
            state_name: company.state_name || '',
          });
          
          setTempGSTINConfig({
            gstin: company.gstin || '',
            legal_name: company.legal_name || '',
            trade_name: company.trade_name || '',
            state_code: company.state_code || '',
            state_name: company.state_name || '',
          });
        }
      } catch (companyError) {
        console.error('Error fetching company config:', companyError);
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load company settings'
        });
      }
      
      // Barcode Settings (from Tenant)
      setBarcodeSettings({
        barcode_enabled: settings.barcode_enabled === true,
        default_barcode_type: settings.default_barcode_type || 'CODE128',
        default_barcode_prefix: settings.default_barcode_prefix || 'FV',
      });
      
      setTempBarcodeSettings({
        default_barcode_type: settings.default_barcode_type || 'CODE128',
        default_barcode_prefix: settings.default_barcode_prefix || 'FV',
      });
      
      // Voucher Numbering Settings (from Tenant)
      setNumberingSettings({
        auto_numbering_enabled: settings.auto_numbering_enabled !== false,
        use_advanced_numbering: settings.use_advanced_numbering === true,
      });
      
      setTempNumberingSettings({
        auto_numbering_enabled: settings.auto_numbering_enabled !== false,
        use_advanced_numbering: settings.use_advanced_numbering === true,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load settings'
      });
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
      
      if (!companyInfo.id) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Company information not loaded'
        });
        return;
      }
      
      // Fetch current company to get existing compliance data
      const companyResponse = await companyAPI.get(companyInfo.id);
      const company = companyResponse?.data?.data || companyResponse?.data;
      const existingCompliance = company?.compliance || {};
      
      // Prepare company update data
      const companyUpdateData = {};
      const complianceUpdateData = { ...existingCompliance };
      
      // E-Invoice settings
      if (newSettings.einvoice_enabled !== undefined) {
        complianceUpdateData.einvoice_enabled = newSettings.einvoice_enabled;
      }
      if (newSettings.einvoice_threshold !== undefined) {
        complianceUpdateData.einvoice_threshold = newSettings.einvoice_threshold;
      }
      if (newSettings.auto_generate_einvoice !== undefined) {
        complianceUpdateData.auto_generate_einvoice = newSettings.auto_generate_einvoice;
      }
      if (newSettings.einvoice_username !== undefined) {
        complianceUpdateData.einvoice_username = newSettings.einvoice_username;
      }
      if (newSettings.einvoice_password !== undefined) {
        complianceUpdateData.einvoice_password = newSettings.einvoice_password;
      }
      
      // E-Way Bill settings
      if (newSettings.ewaybill_enabled !== undefined) {
        complianceUpdateData.ewaybill_enabled = newSettings.ewaybill_enabled;
      }
      if (newSettings.ewaybill_threshold !== undefined) {
        complianceUpdateData.ewaybill_threshold = newSettings.ewaybill_threshold;
      }
      if (newSettings.auto_generate_ewaybill !== undefined) {
        complianceUpdateData.auto_generate_ewaybill = newSettings.auto_generate_ewaybill;
      }
      if (newSettings.ewaybill_username !== undefined) {
        complianceUpdateData.ewaybill_username = newSettings.ewaybill_username;
      }
      if (newSettings.ewaybill_password !== undefined) {
        complianceUpdateData.ewaybill_password = newSettings.ewaybill_password;
      }
      
      // TDS/TCS settings
      if (newSettings.tds_enabled !== undefined) {
        companyUpdateData.is_tds_enabled = newSettings.tds_enabled;
      }
      if (newSettings.tcs_enabled !== undefined) {
        companyUpdateData.is_tcs_enabled = newSettings.tcs_enabled;
      }
      if (newSettings.default_tds_section !== undefined) {
        complianceUpdateData.default_tds_section = newSettings.default_tds_section;
      }
      if (newSettings.default_tcs_section !== undefined) {
        complianceUpdateData.default_tcs_section = newSettings.default_tcs_section;
      }
      
      // Always update compliance JSON
      companyUpdateData.compliance = complianceUpdateData;
      
      // Update company
      await companyAPI.update(companyInfo.id, companyUpdateData);
      
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
        message: error.response?.data?.message || 'Failed to update GST settings'
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
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (!hasHardware || !isEnrolled) {
        // If biometric is not available, ensure it's disabled
        setPreferences(prev => ({ ...prev, biometric: false }));
      }

      // Store biometric type for better messaging
      if (hasHardware && isEnrolled && supportedTypes.length > 0) {
        let biometricName = 'Biometric';
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricName = 'Face ID';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricName = 'Touch ID/Fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometricName = 'Iris';
        }
        // Store for use in messages
        global.biometricName = biometricName;
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
    } else if (key === 'tds_tcs_enabled') {
      const newValue = !gstSettings.tds_tcs_enabled;
      // Update both TDS and TCS together
      await updateGSTSettings({ 
        tds_enabled: newValue,
        tcs_enabled: newValue 
      });
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
              message: 'Please set up Face ID, Touch ID, or fingerprint in your device settings first'
            });
            return;
          }

          // Get biometric type for better messaging
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          let biometricName = 'Biometric';
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            biometricName = 'Face ID';
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            biometricName = 'Touch ID/Fingerprint';
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            biometricName = 'Iris';
          }

          // Test biometric authentication
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: `Verify your identity with ${biometricName} to enable biometric login`,
            cancelLabel: 'Cancel',
            fallbackLabel: 'Use Password',
            disableDeviceFallback: false,
          });

          if (result.success) {
            setPreferences(prev => ({ ...prev, biometric: true }));
            showNotification({
              type: 'success',
              title: `${biometricName} Login Enabled`,
              message: `You can now use ${biometricName} to login quickly and securely`
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
      default_tds_section: tdsConfig.default_tds_section,
      default_tcs_section: tdsConfig.default_tcs_section,
    });
    setShowGSTModal(true);
  };
  
  const handleTDSConfig = () => {
    setTempTDSConfig({
      tan_number: tdsConfig.tan_number,
      tds_circle: tdsConfig.tds_circle,
      tds_ao_code: tdsConfig.tds_ao_code,
      tds_deductor_type: tdsConfig.tds_deductor_type,
      tds_responsible_person: tdsConfig.tds_responsible_person,
      tds_responsible_designation: tdsConfig.tds_responsible_designation,
    });
    setShowTDSConfigModal(true);
  };
  
  const handleGSTINConfig = () => {
    setTempGSTINConfig({
      gstin: gstinConfig.gstin,
      legal_name: gstinConfig.legal_name,
      trade_name: gstinConfig.trade_name,
      state_code: gstinConfig.state_code,
      state_name: gstinConfig.state_name,
    });
    setShowGSTINModal(true);
  };
  
  const saveTDSConfig = async () => {
    try {
      setLoading(true);
      
      if (!companyInfo.id) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Company information not loaded'
        });
        return;
      }
      
      // Update company with TDS config
      await companyAPI.update(companyInfo.id, tempTDSConfig);
      
      setTdsConfig(prev => ({ ...prev, ...tempTDSConfig }));
      setShowTDSConfigModal(false);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'TDS/TCS configuration updated successfully'
      });
    } catch (error) {
      console.error('Error saving TDS config:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update TDS configuration'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveGSTINConfig = async () => {
    try {
      setLoading(true);
      
      if (!companyInfo.id) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Company information not loaded'
        });
        return;
      }
      
      // Update company with GSTIN config
      await companyAPI.update(companyInfo.id, tempGSTINConfig);
      
      setGstinConfig(prev => ({ ...prev, ...tempGSTINConfig }));
      setShowGSTINModal(false);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'GSTIN configuration updated successfully'
      });
    } catch (error) {
      console.error('Error saving GSTIN config:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update GSTIN configuration'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGSTConfig = async () => {
    const updateData = {
      ...tempGSTSettings,
      default_tds_section: tempGSTSettings.default_tds_section,
      default_tcs_section: tempGSTSettings.default_tcs_section,
    };
    await updateGSTSettings(updateData);
    setShowGSTModal(false);
  };
  
  const handleNumberingConfig = () => {
    try {
      navigation.navigate('NumberingSeries');
    } catch (error) {
      console.error('Navigation error:', error);
      showNotification({
        type: 'info',
        title: 'Advanced Numbering',
        message: 'Voucher numbering is managed through Numbering Series. Each voucher type can have its own numbering format.'
      });
    }
  };

  const saveNumberingConfig = async () => {
    await updateNumberingSettings(tempNumberingSettings);
    setShowNumberingModal(false);
  };

  const settingSections = [
    {
      title: 'Company Information',
      items: [
        {
          key: 'gstin_config',
          label: 'GSTIN Configuration',
          description: gstinConfig.gstin ? `GSTIN: ${gstinConfig.gstin}` : 'Not configured',
          type: 'navigation',
          icon: 'receipt-outline',
          onPress: handleGSTINConfig,
        },
      ]
    },
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
          key: 'tds_tcs_enabled',
          label: 'TDS/TCS',
          description: 'Enable Tax Deducted/Collected at Source',
          type: 'switch',
          value: gstSettings.tds_tcs_enabled,
          icon: 'calculator-outline'
        },
        {
          key: 'tds_tcs_config',
          label: 'TDS/TCS Configuration',
          description: `TAN: ${tdsConfig.tan_number || 'Not Set'}`,
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleTDSConfig,
          disabled: !gstSettings.tds_tcs_enabled
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
          label: 'Numbering Series',
          description: 'Configure numbering series for different voucher types',
          type: 'navigation',
          icon: 'settings-outline',
          onPress: handleNumberingConfig,
          disabled: !numberingSettings.auto_numbering_enabled
        },
      ]
    },
    // Only show Barcode Settings for retail business type
    ...(companyInfo.business_type === 'retail' ? [{
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
    }] : []),
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

            {/* TDS/TCS Settings */}
            {gstSettings.tds_tcs_enabled && (
              <>
                <Text style={styles.sectionHeader}>TDS/TCS Settings</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Default TDS Section (Purchase)</Text>
                  <View style={styles.radioGroup}>
                    {['194Q', '194C', '194J', '194I', '194H', '194A'].map((section) => (
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

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Default TCS Section (Sales)</Text>
                  <View style={styles.radioGroup}>
                    {['206C(1H)', '206C(1)', '206C(1F)'].map((section) => (
                      <TouchableOpacity
                        key={section}
                        style={styles.radioOption}
                        onPress={() => setTempGSTSettings(prev => ({ ...prev, default_tcs_section: section }))}
                      >
                        <View style={[
                          styles.radioCircle,
                          tempGSTSettings.default_tcs_section === section && styles.radioCircleSelected
                        ]}>
                          {tempGSTSettings.default_tcs_section === section && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <Text style={styles.radioLabel}>Section {section}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.helpText}>
                    This section will be pre-selected in TCS calculations
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

      {/* TDS/TCS Configuration Modal */}
      <Modal
        visible={showTDSConfigModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTDSConfigModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>TDS/TCS Configuration</Text>
            <TouchableOpacity 
              onPress={() => setShowTDSConfigModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.infoText}>
              Configure your TDS/TCS details. This information will be used for TDS/TCS calculations and reporting.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>TAN Number *</Text>
              <TextInput
                style={styles.input}
                value={tempTDSConfig.tan_number}
                onChangeText={(text) => setTempTDSConfig(prev => ({ ...prev, tan_number: text.toUpperCase() }))}
                placeholder="Enter TAN Number (e.g., ABCD12345E)"
                placeholderTextColor="#9ca3af"
                maxLength={10}
                autoCapitalize="characters"
              />
              <Text style={styles.helpText}>
                Tax Deduction Account Number (10 alphanumeric characters)
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>TDS Circle/Ward</Text>
              <TextInput
                style={styles.input}
                value={tempTDSConfig.tds_circle}
                onChangeText={(text) => setTempTDSConfig(prev => ({ ...prev, tds_circle: text }))}
                placeholder="Enter TDS Circle/Ward"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
              <Text style={styles.helpText}>
                TDS Circle or Ward under which you are registered
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>TDS AO Code</Text>
              <TextInput
                style={styles.input}
                value={tempTDSConfig.tds_ao_code}
                onChangeText={(text) => setTempTDSConfig(prev => ({ ...prev, tds_ao_code: text }))}
                placeholder="Enter AO Code"
                placeholderTextColor="#9ca3af"
                maxLength={50}
              />
              <Text style={styles.helpText}>
                Assessing Officer Code for your jurisdiction
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deductor Type</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'individual', label: 'Individual' },
                  { value: 'company', label: 'Company' },
                  { value: 'government', label: 'Government' },
                  { value: 'others', label: 'Others' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.radioOption}
                    onPress={() => setTempTDSConfig(prev => ({ ...prev, tds_deductor_type: type.value }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      tempTDSConfig.tds_deductor_type === type.value && styles.radioCircleSelected
                    ]}>
                      {tempTDSConfig.tds_deductor_type === type.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helpText}>
                Type of entity deducting TDS
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Responsible Person Name</Text>
              <TextInput
                style={styles.input}
                value={tempTDSConfig.tds_responsible_person}
                onChangeText={(text) => setTempTDSConfig(prev => ({ ...prev, tds_responsible_person: text }))}
                placeholder="Enter name of responsible person"
                placeholderTextColor="#9ca3af"
                maxLength={200}
              />
              <Text style={styles.helpText}>
                Name of person responsible for TDS compliance
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Responsible Person Designation</Text>
              <TextInput
                style={styles.input}
                value={tempTDSConfig.tds_responsible_designation}
                onChangeText={(text) => setTempTDSConfig(prev => ({ ...prev, tds_responsible_designation: text }))}
                placeholder="Enter designation (e.g., Director, Manager)"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
              <Text style={styles.helpText}>
                Designation of the responsible person
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowTDSConfigModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveTDSConfig}
                disabled={loading || !tempTDSConfig.tan_number || tempTDSConfig.tan_number.length !== 10}
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

      {/* GSTIN Configuration Modal */}
      <Modal
        visible={showGSTINModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGSTINModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>GSTIN Configuration</Text>
            <TouchableOpacity 
              onPress={() => setShowGSTINModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.infoText}>
              Configure your company's GST Identification Number (GSTIN). This information will be used in all GST-related transactions and reports.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTIN *</Text>
              <TextInput
                style={styles.input}
                value={tempGSTINConfig.gstin}
                onChangeText={(text) => setTempGSTINConfig(prev => ({ ...prev, gstin: text.toUpperCase() }))}
                placeholder="Enter GSTIN (e.g., 27AABCU9603R1ZM)"
                placeholderTextColor="#9ca3af"
                maxLength={15}
                autoCapitalize="characters"
              />
              <Text style={styles.helpText}>
                15-character GST Identification Number
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Legal Name *</Text>
              <TextInput
                style={styles.input}
                value={tempGSTINConfig.legal_name}
                onChangeText={(text) => setTempGSTINConfig(prev => ({ ...prev, legal_name: text }))}
                placeholder="Enter legal name as per GST registration"
                placeholderTextColor="#9ca3af"
                maxLength={200}
              />
              <Text style={styles.helpText}>
                Legal name of the business as registered with GST
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Trade Name</Text>
              <TextInput
                style={styles.input}
                value={tempGSTINConfig.trade_name}
                onChangeText={(text) => setTempGSTINConfig(prev => ({ ...prev, trade_name: text }))}
                placeholder="Enter trade name (if different)"
                placeholderTextColor="#9ca3af"
                maxLength={200}
              />
              <Text style={styles.helpText}>
                Trade name or brand name (optional)
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State Code *</Text>
              <TextInput
                style={styles.input}
                value={tempGSTINConfig.state_code}
                onChangeText={(text) => setTempGSTINConfig(prev => ({ ...prev, state_code: text }))}
                placeholder="Enter state code (e.g., 27 for Maharashtra)"
                placeholderTextColor="#9ca3af"
                maxLength={2}
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                2-digit state code from GSTIN
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State Name *</Text>
              <TextInput
                style={styles.input}
                value={tempGSTINConfig.state_name}
                onChangeText={(text) => setTempGSTINConfig(prev => ({ ...prev, state_name: text }))}
                placeholder="Enter state name (e.g., Maharashtra)"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
              <Text style={styles.helpText}>
                Name of the state where business is registered
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowGSTINModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveGSTINConfig}
                disabled={loading || !tempGSTINConfig.gstin || tempGSTINConfig.gstin.length !== 15 || !tempGSTINConfig.legal_name}
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