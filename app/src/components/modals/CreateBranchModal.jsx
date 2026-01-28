import React, { useState, useEffect } from 'react';
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
import { branchAPI, companyAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import { validateGSTIN, validateEmail, validatePhone } from '../../utils/formatters';
import PhoneInput from '../ui/PhoneInput';

const { width } = Dimensions.get('window');

const BRANCH_TYPES = [
  { value: 'Head Office', label: 'Head Office', icon: 'business' },
  { value: 'Branch', label: 'Branch', icon: 'git-branch' },
  { value: 'Regional Office', label: 'Regional Office', icon: 'location' },
  { value: 'Sales Office', label: 'Sales Office', icon: 'storefront' },
];

const CreateBranchModal = ({ visible, onClose, onSuccess, selectedCompanyId }) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    company_id: selectedCompanyId || '',
    branch_name: '',
    branch_code: '',
    branch_type: 'Branch',
    is_head_office: false,
    email: '',
    contact_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gstin: '',
  });

  useEffect(() => {
    if (visible) {
      fetchCompanies();
      if (selectedCompanyId) {
        setFormData(prev => ({ ...prev, company_id: selectedCompanyId }));
      }
    }
  }, [visible, selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companyAPI.list();
      const companiesList = response?.data?.data || response?.data || [];
      setCompanies(companiesList);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load companies'
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.company_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a company'
      });
      return false;
    }
    if (!formData.branch_name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Branch name is required'
      });
      return false;
    }
    if (!formData.branch_code.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Branch code is required'
      });
      return false;
    }
    if (!formData.email.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required'
      });
      return false;
    }
    if (!formData.contact_number.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Contact number is required'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await branchAPI.create(formData);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Branch created successfully!'
      });
      
      // Reset form
      setFormData({
        company_id: selectedCompanyId || '',
        branch_name: '',
        branch_code: '',
        branch_type: 'Branch',
        is_head_office: false,
        email: '',
        contact_number: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        gstin: '',
      });
      setCurrentStep(1);
      
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error('Create branch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create branch'
      });
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

  const getBranchTypeColor = (type) => {
    const colors = {
      'Head Office': '#3e60ab',
      'Branch': '#10b981',
      'Regional Office': '#f59e0b',
      'Sales Office': '#8b5cf6',
    };
    return colors[type] || '#6b7280';
  };

  const renderCompanySelector = () => (
    <View style={styles.companySelector}>
      <Text style={styles.companySelectorTitle}>Select Company</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.companyScrollView}>
        {loadingCompanies ? (
          <View style={styles.loadingCompany}>
            <Text style={styles.loadingText}>Loading companies...</Text>
          </View>
        ) : (
          companies.map((company) => {
            const isSelected = formData.company_id === company.id;
            
            return (
              <TouchableOpacity
                key={company.id}
                style={[
                  styles.companyCard,
                  isSelected && styles.companyCardSelected
                ]}
                onPress={() => handleInputChange('company_id', company.id)}
                disabled={!!selectedCompanyId}
              >
                <View style={styles.companyIcon}>
                  <Ionicons name="business" size={20} color={isSelected ? '#3e60ab' : '#6b7280'} />
                </View>
                <Text style={[
                  styles.companyName,
                  isSelected && styles.companyNameSelected
                ]} numberOfLines={2}>
                  {company.company_name}
                </Text>
                {company.gstin && (
                  <Text style={styles.companyGstin}>{company.gstin}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  const renderBranchTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.typeSelectorTitle}>Branch Type</Text>
      <View style={styles.typeGrid}>
        {BRANCH_TYPES.map((type) => {
          const isSelected = formData.branch_type === type.value;
          const typeColor = getBranchTypeColor(type.value);
          
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                isSelected && { borderColor: typeColor, backgroundColor: `${typeColor}15` }
              ]}
              onPress={() => {
                handleInputChange('branch_type', type.value);
                handleInputChange('is_head_office', type.value === 'Head Office');
              }}
            >
              <View style={[styles.typeIcon, { backgroundColor: `${typeColor}20` }]}>
                <Ionicons name={type.icon} size={20} color={typeColor} />
              </View>
              <Text style={[
                styles.typeLabel,
                isSelected && { color: typeColor, fontWeight: '600' }
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
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
          {step < 3 && <View style={[
            styles.stepLine,
            currentStep > step && styles.stepLineActive
          ]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Company & Branch</Text>
      <Text style={styles.stepDescription}>Select company and branch details</Text>
      
      {!selectedCompanyId && renderCompanySelector()}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Branch Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.branch_name}
          onChangeText={(value) => handleInputChange('branch_name', value)}
          placeholder="Enter branch name"
          placeholderTextColor="#9ca3af"
          editable={!loading}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Branch Code *</Text>
        <TextInput
          style={styles.input}
          value={formData.branch_code}
          onChangeText={(value) => handleInputChange('branch_code', value.toUpperCase())}
          placeholder="BR001"
          placeholderTextColor="#9ca3af"
          editable={!loading}
        />
      </View>

      {renderBranchTypeSelector()}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>GSTIN (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            formData.gstin && !validateGSTIN(formData.gstin) && styles.inputError
          ]}
          value={formData.gstin}
          onChangeText={(value) => {
            const upperValue = value.toUpperCase().replace(/\s/g, '');
            handleInputChange('gstin', upperValue);
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
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepDescription}>How can we reach this branch?</Text>
      
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
            placeholder="branch@company.com"
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

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address Details</Text>
      <Text style={styles.stepDescription}>Where is this branch located?</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
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
          <Text style={styles.title}>Create Branch</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
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
              if (currentStep < 3) {
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
                  {currentStep === 3 ? 'Create Branch' : 'Next'}
                </Text>
                {currentStep < 3 && <Ionicons name="chevron-forward" size={16} color="white" />}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Agency',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 24,
  },

  // Company Selector
  companySelector: {
    marginBottom: 24,
  },
  companySelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  companyScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  companyCard: {
    width: 140,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  companyCardSelected: {
    borderColor: '#3e60ab',
    backgroundColor: '#3e60ab15',
  },
  companyIcon: {
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  companyNameSelected: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  companyGstin: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  loadingCompany: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },

  // Branch Type Selector
  typeSelector: {
    marginBottom: 24,
  },
  typeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 64) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 16,
  },

  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    fontFamily: 'Agency',
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
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'Agency',
    marginTop: 4,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  successText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'Agency',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  nextButton: {
    backgroundColor: '#3e60ab',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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

export default CreateBranchModal;