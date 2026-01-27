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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { branchAPI, companyAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import CustomDropdown from '../ui/CustomDropdown';

const CreateBranchModal = ({ visible, onClose, onSuccess, selectedCompanyId }) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    company_id: selectedCompanyId || '',
    branch_name: '',
    branch_code: '',
    branch_type: 'Branch',
    is_head_office: false,
    email: '',
    phone: '',
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
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      showNotification('Failed to load companies', 'error');
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
      showNotification('Please select a company', 'error');
      return false;
    }
    if (!formData.branch_name.trim()) {
      showNotification('Branch name is required', 'error');
      return false;
    }
    if (!formData.branch_code.trim()) {
      showNotification('Branch code is required', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      showNotification('Email is required', 'error');
      return false;
    }
    if (!formData.phone.trim()) {
      showNotification('Phone is required', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await branchAPI.create(formData);
      
      showNotification('Branch created successfully!', 'success');
      
      // Reset form
      setFormData({
        company_id: selectedCompanyId || '',
        branch_name: '',
        branch_code: '',
        branch_type: 'Branch',
        is_head_office: false,
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        gstin: '',
      });
      
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error('Create branch error:', error);
      showNotification(
        error.response?.data?.message || 'Failed to create branch',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const companyOptions = companies.map(company => ({
    label: company.company_name,
    value: company.id,
  }));

  const branchTypeOptions = [
    { label: 'Branch', value: 'Branch' },
    { label: 'Head Office', value: 'Head Office' },
    { label: 'Regional Office', value: 'Regional Office' },
    { label: 'Sales Office', value: 'Sales Office' },
  ];

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
          <Text style={styles.title}>Create New Branch</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company *</Text>
              <CustomDropdown
                options={companyOptions}
                value={formData.company_id}
                onSelect={(value) => handleInputChange('company_id', value)}
                placeholder="Select company"
                loading={loadingCompanies}
                disabled={loading || !!selectedCompanyId}
              />
            </View>

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
                placeholder="Enter branch code (e.g., BR001)"
                placeholderTextColor="#9ca3af"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch Type</Text>
              <CustomDropdown
                options={branchTypeOptions}
                value={formData.branch_type}
                onSelect={(value) => {
                  handleInputChange('branch_type', value);
                  handleInputChange('is_head_office', value === 'Head Office');
                }}
                placeholder="Select branch type"
                disabled={loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GSTIN</Text>
              <TextInput
                style={styles.input}
                value={formData.gstin}
                onChangeText={(value) => handleInputChange('gstin', value.toUpperCase())}
                placeholder="Enter GSTIN (optional)"
                placeholderTextColor="#9ca3af"
                maxLength={15}
                editable={!loading}
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter email address"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
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
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pincode}
                  onChangeText={(value) => handleInputChange('pincode', value)}
                  placeholder="Enter pincode"
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
                  placeholder="Enter country"
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.spinner} />
                <Text style={styles.createButtonText}>Creating...</Text>
              </View>
            ) : (
              <Text style={styles.createButtonText}>Create Branch</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    fontFamily: 'Agency',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
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
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Agency',
  },
  createButton: {
    backgroundColor: '#3e60ab',
  },
  createButtonText: {
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