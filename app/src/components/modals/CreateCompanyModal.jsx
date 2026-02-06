import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '../ui/Dropdown';
import { companyAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import { quickNotifications } from '../../services/globalNotificationService';
import { extractPANFromGSTIN, validateGSTIN, validatePAN, validateEmail, validatePhone } from '../../utils/formatters';
import DatePicker from '../ui/ModernDatePicker';
import PhoneInput from '../ui/PhoneInput';
import { FONT_STYLES } from '../../utils/fonts';

const { width } = Dimensions.get('window');

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship', icon: 'person' },
  { value: 'partnership_firm', label: 'Partnership Firm', icon: 'people' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)', icon: 'business' },
  { value: 'opc', label: 'One Person Company (OPC)', icon: 'person-circle' },
  { value: 'private_limited', label: 'Private Limited Company', icon: 'business' },
  { value: 'public_limited', label: 'Public Limited Company', icon: 'library' },
  { value: 'section_8', label: 'Section 8 Company (Non-profit)', icon: 'heart' },
];

const CreateCompanyModal = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: 'private_limited',
    registration_number: '',
    incorporation_date: '',
    gstin: '',
    pan: '',
    tan: '',
    email: '',
    contact_number: '',
    registered_address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    // Principal/Director details
    principal_name: '',
    principal_din: '',
    principal_pan: '',
    principal_phone: '',
    principal_address: '',
    // Financial details
    financial_year_start: '',
    financial_year_end: '',
    currency: 'INR',
    books_beginning_date: '',
    // Bank details
    bank_name: '',
    bank_branch: '',
    bank_account_number: '',
    bank_ifsc: '',
    // Compliance
    tds_applicable: false,
    gst_registered: false,
    professional_tax_registered: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) {
      showNotification(quickNotifications.validationError());
      return false;
    }
    if (!formData.email.trim()) {
      showNotification(quickNotifications.validationError());
      return false;
    }
    if (!formData.contact_number.trim()) {
      showNotification(quickNotifications.validationError());
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await companyAPI.create(formData);
      
      showNotification(quickNotifications.companyCreated());
      
      // Reset form
      setFormData({
        company_name: '',
        company_type: 'private_limited',
        registration_number: '',
        incorporation_date: '',
        gstin: '',
        pan: '',
        tan: '',
        email: '',
        contact_number: '',
        registered_address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        // Principal/Director details
        principal_name: '',
        principal_din: '',
        principal_pan: '',
        principal_phone: '',
        principal_address: '',
        // Financial details
        financial_year_start: '',
        financial_year_end: '',
        currency: 'INR',
        books_beginning_date: '',
        // Bank details
        bank_name: '',
        bank_branch: '',
        bank_account_number: '',
        bank_ifsc: '',
        // Compliance
        tds_applicable: false,
        gst_registered: false,
        professional_tax_registered: false,
      });
      setCurrentStep(1);
      
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error('Create company error:', error);
      showNotification(quickNotifications.companyCreateFailed());
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCurrentStep(1);
      onClose();
    }
  };

  const getCompanyTypeInfo = (type) => {
    const companyType = COMPANY_TYPES.find(t => t.value === type);
    return companyType || { label: type?.replace('_', ' ').toUpperCase() || 'GENERAL', icon: 'business' };
  };

  const getCompanyTypeColor = (type) => {
    const colors = {
      'private_limited': '#3e60ab',
      'public_limited': '#10b981',
      'partnership_firm': '#f59e0b',
      'sole_proprietorship': '#8b5cf6',
      'llp': '#ef4444',
      'opc': '#06b6d4',
      'section_8': '#84cc16',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const renderCompanyTypeSelector = () => (
    <Dropdown
      label="Company Type"
      placeholder="Select company type"
      value={formData.company_type}
      onSelect={(value) => handleInputChange('company_type', value)}
      options={COMPANY_TYPES}
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => option.label}
      renderOption={(option, index, handleSelect) => {
        const isSelected = formData.company_type === option.value;
        const typeColor = getCompanyTypeColor(option.value);
        
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.companyTypeOption,
              isSelected && styles.selectedCompanyTypeOption
            ]}
            onPress={() => handleSelect(option)}
          >
            <View style={styles.companyTypeInfo}>
              <View style={styles.companyTypeHeader}>
                <View style={[styles.companyTypeIcon, { backgroundColor: `${typeColor}20` }]}>
                  <Ionicons name={option.icon} size={20} color={typeColor} />
                </View>
                <Text style={[
                  styles.companyTypeName,
                  isSelected && { color: typeColor, fontWeight: '600' }
                ]}>
                  {option.label}
                </Text>
              </View>
            </View>
            {isSelected && (
              <Ionicons name="checkmark" size={20} color={typeColor} />
            )}
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepNumber,
              currentStep >= step && styles.stepNumberActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 5 && <View style={[
            styles.stepLine,
            currentStep > step && styles.stepLineActive
          ]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>Enter your company's basic details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.company_name}
          onChangeText={(value) => handleInputChange('company_name', value)}
          placeholder="Enter company name"
          placeholderTextColor="#9ca3af"
          editable={!loading}
        />
      </View>

      {renderCompanyTypeSelector()}

      {(formData.company_type === 'private_limited' || formData.company_type === 'llp') && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Registration Number (CIN / LLPIN)</Text>
          <TextInput
            style={styles.input}
            value={formData.registration_number}
            onChangeText={(value) => handleInputChange('registration_number', value.toUpperCase())}
            placeholder="U12345MH2025PTC123456"
            placeholderTextColor="#9ca3af"
            editable={!loading}
            autoCapitalize="characters"
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Incorporation</Text>
        <DatePicker
          value={formData.incorporation_date}
          onDateChange={(date) => handleInputChange('incorporation_date', date)}
          placeholder="Select incorporation date"
          label="Date of Incorporation"
          disabled={loading}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tax Information</Text>
      <Text style={styles.stepDescription}>GST, PAN, and TAN details</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>GSTIN</Text>
          <TextInput
            style={[
              styles.input,
              formData.gstin && !validateGSTIN(formData.gstin) && styles.inputError
            ]}
            value={formData.gstin}
            onChangeText={(value) => {
              const upperValue = value.toUpperCase().replace(/\s/g, '');
              handleInputChange('gstin', upperValue);
              
              // Auto-fill PAN if GSTIN is valid and PAN is empty
              if (upperValue.length === 15 && validateGSTIN(upperValue) && !formData.pan) {
                const extractedPAN = extractPANFromGSTIN(upperValue);
                if (extractedPAN) {
                  handleInputChange('pan', extractedPAN);
                  // Show success notification for auto-fill
                  showNotification(quickNotifications.panAutoFilled());
                }
              }
              
              // Auto-set GST registered
              handleInputChange('gst_registered', !!upperValue.trim());
            }}
            placeholder="27ABCDE1234F1Z5"
            placeholderTextColor="#9ca3af"
            maxLength={15}
            editable={!loading}
            autoCapitalize="characters"
          />
          {formData.gstin && !validateGSTIN(formData.gstin) && (
            <Text style={styles.errorText}>Invalid GSTIN format</Text>
          )}
          {formData.gstin && validateGSTIN(formData.gstin) && (
            <View style={styles.successIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.successText}>Valid GSTIN</Text>
            </View>
          )}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>PAN</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                formData.pan && !validatePAN(formData.pan) && styles.inputError
              ]}
              value={formData.pan}
              onChangeText={(value) => handleInputChange('pan', value.toUpperCase())}
              placeholder="ABCDE1234F"
              placeholderTextColor="#9ca3af"
              maxLength={10}
              editable={!loading}
              autoCapitalize="characters"
            />
            {formData.pan && validatePAN(formData.pan) && (
              <View style={styles.inputIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
            )}
          </View>
          {formData.pan && !validatePAN(formData.pan) && (
            <Text style={styles.errorText}>Invalid PAN format</Text>
          )}
          {formData.pan && validatePAN(formData.pan) && (
            <View style={styles.successIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.successText}>Valid PAN</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>TAN (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.tan}
          onChangeText={(value) => {
            const upperValue = value.toUpperCase();
            handleInputChange('tan', upperValue);
            // Auto-set TDS applicable
            handleInputChange('tds_applicable', !!upperValue.trim());
          }}
          placeholder="ABCD12345E"
          placeholderTextColor="#9ca3af"
          maxLength={10}
          editable={!loading}
          autoCapitalize="characters"
        />
      </View>

      {/* Compliance Checkboxes */}
      <View style={styles.complianceSection}>
        <Text style={styles.complianceTitle}>Compliance</Text>
        
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => handleInputChange('gst_registered', !formData.gst_registered)}
        >
          <View style={[styles.checkbox, formData.gst_registered && styles.checkboxChecked]}>
            {formData.gst_registered && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>GST Registered</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => handleInputChange('tds_applicable', !formData.tds_applicable)}
        >
          <View style={[styles.checkbox, formData.tds_applicable && styles.checkboxChecked]}>
            {formData.tds_applicable && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>TDS Applicable</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => handleInputChange('professional_tax_registered', !formData.professional_tax_registered)}
        >
          <View style={[styles.checkbox, formData.professional_tax_registered && styles.checkboxChecked]}>
            {formData.professional_tax_registered && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>Professional Tax Registered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepDescription}>How can we reach your company?</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              formData.email && !validateEmail(formData.email) && styles.inputError
            ]}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="company@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {formData.email && validateEmail(formData.email) && (
            <View style={styles.inputIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          )}
        </View>
        {formData.email && !validateEmail(formData.email) && (
          <Text style={styles.errorText}>Invalid email format</Text>
        )}
        {formData.email && validateEmail(formData.email) && (
          <View style={styles.successIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.successText}>Valid email</Text>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Number *</Text>
        <PhoneInput
          value={formData.contact_number}
          onChangeText={(value) => handleInputChange('contact_number', value)}
          placeholder="Enter phone number"
          defaultCountry="IN"
          disabled={loading}
          error={formData.contact_number && !validatePhone(formData.contact_number)}
        />
        {formData.contact_number && !validatePhone(formData.contact_number) && (
          <Text style={styles.errorText}>Invalid phone number (should be 10 digits starting with 6-9)</Text>
        )}
        {formData.contact_number && validatePhone(formData.contact_number) && (
          <View style={styles.successIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.successText}>Valid phone number</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address & Principal</Text>
      <Text style={styles.stepDescription}>Company address and director/partner details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Registered Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.registered_address}
          onChangeText={(value) => handleInputChange('registered_address', value)}
          placeholder="Enter complete address"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!loading}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            placeholder="Enter city"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
            placeholder="Enter state"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>PIN Code</Text>
          <TextInput
            style={styles.input}
            value={formData.pincode}
            onChangeText={(value) => handleInputChange('pincode', value)}
            placeholder="400001"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(value) => handleInputChange('country', value)}
            placeholder="India"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>
      </View>

      {/* Principal/Director Details */}
      <View style={styles.sectionDivider}>
        <Text style={styles.sectionTitle}>Director / Partner / Proprietor</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={formData.principal_name}
          onChangeText={(value) => handleInputChange('principal_name', value)}
          placeholder="e.g. John Doe"
          placeholderTextColor="#9ca3af"
          editable={!loading}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>DIN (for companies)</Text>
          <TextInput
            style={styles.input}
            value={formData.principal_din}
            onChangeText={(value) => handleInputChange('principal_din', value)}
            placeholder="Optional"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>PAN</Text>
          <TextInput
            style={styles.input}
            value={formData.principal_pan}
            onChangeText={(value) => handleInputChange('principal_pan', value.toUpperCase())}
            placeholder="Optional"
            placeholderTextColor="#9ca3af"
            maxLength={10}
            editable={!loading}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Number</Text>
        <PhoneInput
          value={formData.principal_phone}
          onChangeText={(value) => handleInputChange('principal_phone', value)}
          placeholder="Enter contact number"
          defaultCountry="IN"
          disabled={loading}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.principal_address}
          onChangeText={(value) => handleInputChange('principal_address', value)}
          placeholder="Optional"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!loading}
        />
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Financial & Banking</Text>
      <Text style={styles.stepDescription}>Financial year and banking details</Text>
      
      {/* Financial Details */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Financial Year Start</Text>
          <DatePicker
            value={formData.financial_year_start}
            onDateChange={(date) => handleInputChange('financial_year_start', date)}
            placeholder="Select start date"
            label="Financial Year Start"
            disabled={loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Financial Year End</Text>
          <DatePicker
            value={formData.financial_year_end}
            onDateChange={(date) => handleInputChange('financial_year_end', date)}
            placeholder="Select end date"
            label="Financial Year End"
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Currency</Text>
          <TextInput
            style={styles.input}
            value={formData.currency}
            onChangeText={(value) => handleInputChange('currency', value)}
            placeholder="INR"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Books Beginning Date</Text>
          <DatePicker
            value={formData.books_beginning_date}
            onDateChange={(date) => handleInputChange('books_beginning_date', date)}
            placeholder="Select date"
            label="Books Beginning Date"
            disabled={loading}
          />
        </View>
      </View>

      {/* Bank Details */}
      <View style={styles.sectionDivider}>
        <Text style={styles.sectionTitle}>Bank Details (Optional)</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={formData.bank_name}
            onChangeText={(value) => handleInputChange('bank_name', value)}
            placeholder="Enter bank name"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Branch</Text>
          <TextInput
            style={styles.input}
            value={formData.bank_branch}
            onChangeText={(value) => handleInputChange('bank_branch', value)}
            placeholder="Enter branch"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={formData.bank_account_number}
            onChangeText={(value) => handleInputChange('bank_account_number', value)}
            placeholder="Enter account number"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            value={formData.bank_ifsc}
            onChangeText={(value) => handleInputChange('bank_ifsc', value.toUpperCase())}
            placeholder="SBIN0001234"
            placeholderTextColor="#9ca3af"
            maxLength={11}
            editable={!loading}
            autoCapitalize="characters"
          />
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Company</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={() => setCurrentStep(currentStep - 1)}
              disabled={loading}
            >
              <Ionicons name="chevron-back" size={16} color="#6b7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button, 
              styles.nextButton, 
              loading && styles.disabledButton,
              currentStep === 1 && { flex: 1 }
            ]}
            onPress={() => {
              if (currentStep < 5) {
                setCurrentStep(currentStep + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.spinner} />
                <Text style={styles.nextButtonText}>Creating...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 5 ? 'Create Company' : 'Next'}
                </Text>
                {currentStep < 5 && <Ionicons name="chevron-forward" size={16} color="white" />}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    ...FONT_STYLES.h3,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  stepCircleActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  stepNumber: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#3e60ab',
  },

  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    marginBottom: 24,
  },

  // Company Type Dropdown Options
  companyTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedCompanyTypeOption: {
    backgroundColor: '#f0f4ff',
  },
  companyTypeInfo: {
    flex: 1,
  },
  companyTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyTypeName: {
    ...FONT_STYLES.h5,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },

  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONT_STYLES.h5,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...FONT_STYLES.h5,
    color: '#111827',
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  errorText: {
    ...FONT_STYLES.caption,
    color: '#ef4444',
    marginTop: 4,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  successText: {
    ...FONT_STYLES.caption,
    color: '#10b981',
  },

  // Compliance Section
  complianceSection: {
    marginTop: 20,
  },
  complianceTitle: {
    ...FONT_STYLES.h5,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  checkboxLabel: {
    ...FONT_STYLES.label,
    color: '#374151',
    flex: 1,
  },

  // Section Divider
  sectionDivider: {
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    fontWeight: '600',
    color: '#374151',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  backButtonText: {
    ...FONT_STYLES.button,
    color: '#6b7280',
  },
  nextButton: {
    backgroundColor: '#3e60ab',
  },
  nextButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
  },
});

export default CreateCompanyModal;