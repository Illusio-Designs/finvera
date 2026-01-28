import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '../ui/Dropdown';
import { useNotification } from '../../contexts/NotificationContext';
import { accountingAPI } from '../../lib/api';

export default function CreateLedgerModal({ 
  visible, 
  onClose, 
  onSuccess,
  editData = null,
  isEdit = false
}) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [accountGroups, setAccountGroups] = useState([]);
  const [formData, setFormData] = useState({
    ledger_name: '',
    account_group_id: '',
    opening_balance: '0',
    balance_type: 'debit',
    currency: 'INR',
    description: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      fetchAccountGroups();
      
      // If editing, populate form with existing data
      if (isEdit && editData) {
        setFormData({
          ledger_name: editData.ledger_name || '',
          account_group_id: editData.account_group_id || '',
          opening_balance: String(editData.opening_balance || 0),
          balance_type: editData.balance_type || 'debit',
          currency: editData.currency || 'INR',
          description: editData.description || '',
          gstin: editData.gstin || '',
          pan: editData.pan || '',
          address: editData.address || '',
          city: editData.city || '',
          state: editData.state || '',
          pincode: editData.pincode || '',
          country: editData.country || 'India',
          phone: editData.phone || '',
          email: editData.email || ''
        });
      }
    }
  }, [visible, isEdit, editData]);

  const fetchAccountGroups = async () => {
    try {
      const response = await accountingAPI.accountGroups.list();
      const groups = response.data?.data || response.data || [];
      setAccountGroups(Array.isArray(groups) ? groups : []);
    } catch (error) {
      console.error('Error fetching account groups:', error);
      // Fallback account groups
      setAccountGroups([
        { id: '1', name: 'Current Assets', group_code: 'CA', nature: 'asset' },
        { id: '2', name: 'Current Liabilities', group_code: 'CL', nature: 'liability' },
        { id: '3', name: 'Income', group_code: 'INC', nature: 'income' },
        { id: '4', name: 'Expenses', group_code: 'EXP', nature: 'expense' },
        { id: '5', name: 'Bank Accounts', group_code: 'BANK', nature: 'asset' },
        { id: '6', name: 'Cash Accounts', group_code: 'CASH', nature: 'asset' },
        { id: '7', name: 'Sundry Debtors', group_code: 'SD', nature: 'asset' },
        { id: '8', name: 'Sundry Creditors', group_code: 'SC', nature: 'liability' }
      ]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ledger_name.trim()) {
      newErrors.ledger_name = 'Ledger name is required';
    }

    if (!formData.account_group_id) {
      newErrors.account_group_id = 'Account group is required';
    }

    if (formData.opening_balance && isNaN(parseFloat(formData.opening_balance))) {
      newErrors.opening_balance = 'Opening balance must be a valid number';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.gstin && formData.gstin.length > 0 && formData.gstin.length !== 15) {
      newErrors.gstin = 'GSTIN must be 15 characters long';
    }

    if (formData.pan && formData.pan.length > 0 && formData.pan.length !== 10) {
      newErrors.pan = 'PAN must be 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form'
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        gstin: formData.gstin || null,
        pan: formData.pan || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        country: formData.country || null,
        phone: formData.phone || null,
        email: formData.email || null,
        description: formData.description || null
      };

      let response;
      if (isEdit && editData) {
        response = await accountingAPI.ledgers.update(editData.id, submitData);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Ledger updated successfully'
        });
      } else {
        response = await accountingAPI.ledgers.create(submitData);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Ledger created successfully'
        });
      }

      if (onSuccess) {
        onSuccess(response.data?.data || response.data);
      }
      
      handleClose();
    } catch (error) {
      console.error(`${isEdit ? 'Update' : 'Create'} ledger error:`, error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} ledger`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      ledger_name: '',
      account_group_id: '',
      opening_balance: '0',
      balance_type: 'debit',
      currency: 'INR',
      description: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      phone: '',
      email: ''
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEdit ? 'Edit Ledger' : 'Create New Ledger'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ledger Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.ledger_name && styles.inputError]}
                value={formData.ledger_name}
                onChangeText={(value) => updateFormData('ledger_name', value)}
                placeholder="Enter ledger name"
                placeholderTextColor="#9ca3af"
              />
              {errors.ledger_name && (
                <Text style={styles.errorText}>{errors.ledger_name}</Text>
              )}
            </View>

            <Dropdown
              label="Account Group"
              placeholder="Select account group"
              value={formData.account_group_id}
              onSelect={(value) => updateFormData('account_group_id', value)}
              options={accountGroups}
              getOptionValue={(option) => option.id}
              getOptionLabel={(option) => option.name}
              required
              error={errors.account_group_id}
              renderOption={(option, index, handleSelect) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.accountGroupOption,
                    formData.account_group_id === option.id && styles.selectedAccountGroupOption
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <View style={styles.accountGroupInfo}>
                    <Text style={[
                      styles.accountGroupName,
                      formData.account_group_id === option.id && styles.selectedAccountGroupName
                    ]}>
                      {option.name}
                    </Text>
                    <Text style={styles.accountGroupCode}>
                      {option.group_code} • {option.nature}
                    </Text>
                  </View>
                  {formData.account_group_id === option.id && (
                    <Ionicons name="checkmark" size={20} color="#3e60ab" />
                  )}
                </TouchableOpacity>
              )}
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Opening Balance</Text>
                <TextInput
                  style={[styles.input, errors.opening_balance && styles.inputError]}
                  value={formData.opening_balance}
                  onChangeText={(value) => updateFormData('opening_balance', value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
                {errors.opening_balance && (
                  <Text style={styles.errorText}>{errors.opening_balance}</Text>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.balanceTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.balanceTypeButton,
                      formData.balance_type === 'debit' && styles.balanceTypeButtonSelected
                    ]}
                    onPress={() => updateFormData('balance_type', 'debit')}
                  >
                    <Text style={[
                      styles.balanceTypeText,
                      formData.balance_type === 'debit' && styles.balanceTypeTextSelected
                    ]}>
                      Dr
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.balanceTypeButton,
                      formData.balance_type === 'credit' && styles.balanceTypeButtonSelected
                    ]}
                    onPress={() => updateFormData('balance_type', 'credit')}
                  >
                    <Text style={[
                      styles.balanceTypeText,
                      formData.balance_type === 'credit' && styles.balanceTypeTextSelected
                    ]}>
                      Cr
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>GSTIN</Text>
                <TextInput
                  style={[styles.input, errors.gstin && styles.inputError]}
                  value={formData.gstin}
                  onChangeText={(value) => updateFormData('gstin', value.toUpperCase())}
                  placeholder="15-digit GSTIN"
                  maxLength={15}
                  placeholderTextColor="#9ca3af"
                />
                {errors.gstin && (
                  <Text style={styles.errorText}>{errors.gstin}</Text>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>PAN</Text>
                <TextInput
                  style={[styles.input, errors.pan && styles.inputError]}
                  value={formData.pan}
                  onChangeText={(value) => updateFormData('pan', value.toUpperCase())}
                  placeholder="10-digit PAN"
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />
                {errors.pan && (
                  <Text style={styles.errorText}>{errors.pan}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => updateFormData('address', value)}
                placeholder="Enter address"
                multiline
                numberOfLines={2}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(value) => updateFormData('city', value)}
                  placeholder="City"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(value) => updateFormData('state', value)}
                  placeholder="State"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pincode}
                  onChangeText={(value) => updateFormData('pincode', value)}
                  placeholder="Pincode"
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(value) => updateFormData('country', value)}
                  placeholder="Country"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Updating...' : 'Creating...'}
              </Text>
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.submitButtonText}>
                  {isEdit ? 'Update Ledger' : 'Create Ledger'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontFamily: 'Agency',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  // Account Group Option Styles
  accountGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedAccountGroupOption: {
    backgroundColor: '#f0f4ff',
  },
  accountGroupInfo: {
    flex: 1,
  },
  accountGroupName: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedAccountGroupName: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  accountGroupCode: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  balanceTypeContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  balanceTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  balanceTypeButtonSelected: {
    backgroundColor: '#3e60ab',
  },
  balanceTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  balanceTypeTextSelected: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
});