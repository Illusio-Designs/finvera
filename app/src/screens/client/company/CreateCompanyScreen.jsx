import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../../contexts/NotificationContext.jsx';
import { Ionicons } from '@expo/vector-icons';
import { companyAPI } from '../../../lib/api';
import { apiClient } from '../../../lib/apiClient';
import { findBestApiUrl } from '../../../utils/networkTest';
import CustomDropdown from '../../../components/ui/CustomDropdown';

export default function CreateCompanyScreen() {
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: 'Private Limited',
    registration_number: '',
    incorporation_date: '',
    pan: '',
    tan: '',
    gstin: '',
    cin: '',
    registered_address: '',
    communication_address: '',
    state: '',
    pincode: '',
    country: 'India',
    contact_number: '',
    alternate_contact: '',
    email: '',
    website: '',
    fax: '',
    financial_year_start: '2024-04-01',
    financial_year_end: '2025-03-31',
    currency: 'INR',
    decimal_places: '2',
    enable_multi_currency: false,
    enable_gst: true,
    enable_tds: false,
    enable_inventory: true,
    logo: null,
    authorized_capital: '',
    paid_up_capital: '',
    business_nature: '',
    industry_type: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: '',
  });
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const navigation = useNavigation();
  const { showSuccess, showError, showInfo } = useNotification();

  // Test API connectivity on component mount
  useEffect(() => {
    testApiConnectivity();
  }, []);

  const handleFinancialYearSelect = (selectedYear) => {
    setFormData({
      ...formData,
      financial_year_start: selectedYear.value.start,
      financial_year_end: selectedYear.value.end,
    });
  };

  const testApiConnectivity = async () => {
    console.log('🔍 Testing API connectivity for company creation...');
    setApiStatus('checking');
    
    try {
      const bestUrl = await findBestApiUrl();
      
      if (bestUrl) {
        apiClient.defaults.baseURL = bestUrl;
        console.log('✅ API client updated to use:', bestUrl);
        setApiStatus('connected');
        
        // Test company creation endpoint specifically
        try {
          const testResponse = await apiClient.get('/companies');
          console.log('✅ Company endpoint is accessible');
        } catch (endpointError) {
          console.log('⚠️ Company endpoint test failed, but base URL is working');
        }
      } else {
        setApiStatus('failed');
      }
    } catch (error) {
      console.error('❌ Network test failed:', error);
      setApiStatus('failed');
    }
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) {
      showError('Missing Information', 'Company name is required');
      return false;
    }

    if (!formData.company_type) {
      showError('Missing Information', 'Company type is required');
      return false;
    }

    if (!formData.state) {
      showError('Missing Information', 'State is required');
      return false;
    }

    if (!formData.registered_address.trim()) {
      showError('Missing Information', 'Registered address is required');
      return false;
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    // Validate PAN if provided
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      showError('Invalid PAN', 'PAN must be in format: ABCDE1234F');
      return false;
    }

    // Validate TAN if provided
    if (formData.tan && !/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(formData.tan)) {
      showError('Invalid TAN', 'TAN must be in format: ABCD12345E');
      return false;
    }

    // Validate GSTIN if provided
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      showError('Invalid GSTIN', 'GSTIN must be 15 alphanumeric characters');
      return false;
    }

    // Validate CIN if provided
    if (formData.cin && !/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(formData.cin)) {
      showError('Invalid CIN', 'CIN must be in valid format');
      return false;
    }

    // Validate pincode if provided
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      showError('Invalid Pincode', 'Pincode must be 6 digits');
      return false;
    }

    // Validate contact number if provided
    if (formData.contact_number && !/^[0-9]{10}$/.test(formData.contact_number.replace(/[^0-9]/g, ''))) {
      showError('Invalid Contact Number', 'Contact number must be 10 digits');
      return false;
    }

    return true;
  };

  const handleCreateCompany = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    showInfo('Creating Company', 'Setting up your company and provisioning database...');

    try {
      console.log('Creating company with data:', { ...formData, email: formData.email || '[not provided]' });
      
      const response = await companyAPI.create(formData);
      console.log('Company creation response:', response.data);
      
      if (response.data) {
        const company = response.data.data || response.data;
        
        if (company.db_provisioned) {
          // Company is already provisioned
          showSuccess(
            'Company Created Successfully!', 
            'Your company has been created and is ready to use.',
            {
              duration: 5000,
              actionText: 'Go to Dashboard',
              onActionPress: () => navigation.replace('Dashboard')
            }
          );
          
          setTimeout(() => {
            navigation.replace('Dashboard');
          }, 3000);
        } else {
          // Company created but needs provisioning
          showInfo(
            'Company Created!', 
            'Setting up your company database. This may take a few minutes.',
            {
              duration: 3000
            }
          );
          
          // Navigate to provisioning screen
          setTimeout(() => {
            navigation.replace('CompanyProvisioning', { companyId: company.id });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Company creation error:', error);
      
      let errorMessage = 'Failed to create company. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'Company limit reached for your plan. Please upgrade to add more companies.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your information and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError('Company Creation Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const companyTypes = [
    { label: 'Private Limited', value: 'Private Limited' },
    { label: 'Public Limited', value: 'Public Limited' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'LLP', value: 'LLP' },
    { label: 'Sole Proprietorship', value: 'Sole Proprietorship' },
    { label: 'Trust', value: 'Trust' },
    { label: 'Society', value: 'Society' },
    { label: 'HUF', value: 'HUF' },
    { label: 'Others', value: 'Others' }
  ];

  const indianStates = [
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
    { label: 'Assam', value: 'Assam' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Chhattisgarh', value: 'Chhattisgarh' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
    { label: 'Jharkhand', value: 'Jharkhand' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Manipur', value: 'Manipur' },
    { label: 'Meghalaya', value: 'Meghalaya' },
    { label: 'Mizoram', value: 'Mizoram' },
    { label: 'Nagaland', value: 'Nagaland' },
    { label: 'Odisha', value: 'Odisha' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Sikkim', value: 'Sikkim' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Tripura', value: 'Tripura' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'Uttarakhand', value: 'Uttarakhand' },
    { label: 'West Bengal', value: 'West Bengal' },
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
    { label: 'Ladakh', value: 'Ladakh' },
    { label: 'Puducherry', value: 'Puducherry' },
    { label: 'Chandigarh', value: 'Chandigarh' },
    { label: 'Dadra and Nagar Haveli and Daman and Diu', value: 'Dadra and Nagar Haveli and Daman and Diu' },
    { label: 'Lakshadweep', value: 'Lakshadweep' },
    { label: 'Andaman and Nicobar Islands', value: 'Andaman and Nicobar Islands' }
  ];

  const currencies = [
    { label: 'Indian Rupee (INR)', value: 'INR' },
    { label: 'US Dollar (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'British Pound (GBP)', value: 'GBP' },
    { label: 'Japanese Yen (JPY)', value: 'JPY' },
    { label: 'Australian Dollar (AUD)', value: 'AUD' },
    { label: 'Canadian Dollar (CAD)', value: 'CAD' },
    { label: 'Swiss Franc (CHF)', value: 'CHF' },
    { label: 'Chinese Yuan (CNY)', value: 'CNY' },
    { label: 'Singapore Dollar (SGD)', value: 'SGD' }
  ];

  const countries = [
    { label: 'India', value: 'India' },
    { label: 'United States', value: 'United States' },
    { label: 'United Kingdom', value: 'United Kingdom' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Australia', value: 'Australia' },
    { label: 'Singapore', value: 'Singapore' },
    { label: 'UAE', value: 'UAE' },
    { label: 'Germany', value: 'Germany' },
    { label: 'France', value: 'France' },
    { label: 'Japan', value: 'Japan' }
  ];

  const industryTypes = [
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Trading', value: 'Trading' },
    { label: 'Services', value: 'Services' },
    { label: 'Construction', value: 'Construction' },
    { label: 'Real Estate', value: 'Real Estate' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Education', value: 'Education' },
    { label: 'IT & Software', value: 'IT & Software' },
    { label: 'Finance & Banking', value: 'Finance & Banking' },
    { label: 'Retail', value: 'Retail' },
    { label: 'Agriculture', value: 'Agriculture' },
    { label: 'Transportation', value: 'Transportation' },
    { label: 'Hospitality', value: 'Hospitality' },
    { label: 'Others', value: 'Others' }
  ];

  const decimalPlacesOptions = [
    { label: '0 (No decimals)', value: '0' },
    { label: '1 decimal place', value: '1' },
    { label: '2 decimal places', value: '2' },
    { label: '3 decimal places', value: '3' },
    { label: '4 decimal places', value: '4' }
  ];

  const handleCompanyTypeSelect = (selectedType) => {
    setFormData({
      ...formData,
      company_type: selectedType.value,
    });
  };

  const handleStateSelect = (selectedState) => {
    setFormData({
      ...formData,
      state: selectedState.value,
    });
  };

  const handleCurrencySelect = (selectedCurrency) => {
    setFormData({
      ...formData,
      currency: selectedCurrency.value,
    });
  };

  const financialYearOptions = [
    { label: 'April 2024 - March 2025', value: { start: '2024-04-01', end: '2025-03-31' } },
    { label: 'April 2023 - March 2024', value: { start: '2023-04-01', end: '2024-03-31' } },
    { label: 'April 2025 - March 2026', value: { start: '2025-04-01', end: '2026-03-31' } },
    { label: 'January 2024 - December 2024', value: { start: '2024-01-01', end: '2024-12-31' } },
    { label: 'January 2025 - December 2025', value: { start: '2025-01-01', end: '2025-12-31' } }
  ];

  const handleCountrySelect = (selectedCountry) => {
    setFormData({
      ...formData,
      country: selectedCountry.value,
    });
  };

  const handleIndustryTypeSelect = (selectedIndustry) => {
    setFormData({
      ...formData,
      industry_type: selectedIndustry.value,
    });
  };

  const handleDecimalPlacesSelect = (selectedDecimal) => {
    setFormData({
      ...formData,
      decimal_places: selectedDecimal.value,
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#3e60ab" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Company</Text>
          <View style={styles.placeholder} />
        </View>

        {/* API Status Indicator */}
        <View style={styles.apiStatusContainer}>
          <View style={[styles.statusDot, { backgroundColor: apiStatus === 'connected' ? '#10b981' : apiStatus === 'failed' ? '#ef4444' : '#f59e0b' }]} />
          <Text style={styles.apiStatusText}>
            {apiStatus === 'connected' ? 'Server Connected' : apiStatus === 'failed' ? 'Server Disconnected' : 'Checking Connection...'}
          </Text>
          {apiStatus === 'failed' && (
            <TouchableOpacity onPress={testApiConnectivity} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              value={formData.company_name}
              onChangeText={(value) => handleChange('company_name', value)}
              autoCapitalize="words"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <CustomDropdown
            label="Company Type"
            value={companyTypes.find(type => type.value === formData.company_type)}
            options={companyTypes}
            onSelect={handleCompanyTypeSelect}
            placeholder="Select company type"
            required={true}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter registration number"
              value={formData.registration_number}
              onChangeText={(value) => handleChange('registration_number', value)}
              autoCapitalize="characters"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Incorporation</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.incorporation_date}
              onChangeText={(value) => handleChange('incorporation_date', value)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CIN (Corporate Identity Number)</Text>
            <TextInput
              style={styles.input}
              placeholder="L12345AB2020PLC123456"
              value={formData.cin}
              onChangeText={(value) => handleChange('cin', value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={21}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <CustomDropdown
            label="Industry Type"
            value={industryTypes.find(industry => industry.value === formData.industry_type)}
            options={industryTypes}
            onSelect={handleIndustryTypeSelect}
            placeholder="Select industry type"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nature of Business</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your business activities"
              value={formData.business_nature}
              onChangeText={(value) => handleChange('business_nature', value)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Text style={styles.sectionTitle}>Tax Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChangeText={(value) => handleChange('pan', value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>GSTIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter GSTIN"
              value={formData.gstin}
              onChangeText={(value) => handleChange('gstin', value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={15}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Text style={styles.sectionTitle}>Capital Information</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Authorized Capital</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formData.authorized_capital}
                onChangeText={(value) => handleChange('authorized_capital', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Paid-up Capital</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formData.paid_up_capital}
                onChangeText={(value) => handleChange('paid_up_capital', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Address Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Registered Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter registered address"
              value={formData.registered_address}
              onChangeText={(value) => handleChange('registered_address', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Communication Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter communication address (if different from registered address)"
              value={formData.communication_address}
              onChangeText={(value) => handleChange('communication_address', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <CustomDropdown
                label="State"
                value={indianStates.find(state => state.value === formData.state)}
                options={indianStates}
                onSelect={handleStateSelect}
                placeholder="Select state"
                required={true}
                maxHeight={250}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                value={formData.pincode}
                onChangeText={(value) => handleChange('pincode', value)}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <CustomDropdown
            label="Country"
            value={countries.find(country => country.value === formData.country)}
            options={countries}
            onSelect={handleCountrySelect}
            placeholder="Select country"
          />

          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter contact number"
              value={formData.contact_number}
              onChangeText={(value) => handleChange('contact_number', value)}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Text style={styles.sectionTitle}>Financial Year & Currency</Text>

          <CustomDropdown
            label="Currency"
            value={currencies.find(currency => currency.value === formData.currency)}
            options={currencies}
            onSelect={handleCurrencySelect}
            placeholder="Select currency"
          />

          <CustomDropdown
            label="Financial Year"
            value={financialYearOptions.find(fy => 
              fy.value.start === formData.financial_year_start && 
              fy.value.end === formData.financial_year_end
            )}
            options={financialYearOptions}
            onSelect={handleFinancialYearSelect}
            placeholder="Select financial year"
          />

          <TouchableOpacity
            style={[styles.createButton, (loading || apiStatus !== 'connected') && styles.buttonDisabled]}
            onPress={handleCreateCompany}
            disabled={loading || apiStatus !== 'connected'}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating Company...' : apiStatus !== 'connected' ? 'Server Disconnected' : 'Create Company'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  placeholder: {
    width: 40,
  },
  apiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  apiStatusText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3e60ab',
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Agency',
    fontWeight: '600',
  },
  form: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    marginTop: 16,
    fontFamily: 'Agency',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#111827',
    fontFamily: 'Agency',
    textAlignVertical: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  createButton: {
    backgroundColor: '#3e60ab',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Agency',
  },
});