import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountingAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import PhoneInput from '../ui/PhoneInput';
import { 
  formatGSTIN, 
  validateGSTIN, 
  extractPANFromGSTIN, 
  validatePAN,
  formatPAN,
  validatePhone 
} from '../../utils/formatters';

export default function CreateLedgerModal({ 
  visible, 
  onClose, 
  onLedgerCreated,
  defaultAccountGroupFilter = null, // Filter for specific account group types
  title = 'Create New Ledger'
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    ledger_name: '',
    account_group_id: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    opening_balance: 0,
    balance_type: 'debit',
    description: ''
  });

  const [accountGroups, setAccountGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAccountGroupModal, setShowAccountGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      fetchAccountGroups();
    }
  }, [visible]);

  const fetchAccountGroups = async () => {
    try {
      const response = await accountingAPI.accountGroups.list();
      let groups = response.data?.data || response.data || [];
      
      // Apply filter if provided and not set to show all
      if (defaultAccountGroupFilter && defaultAccountGroupFilter !== 'all') {
        groups = groups.filter(group => {
          const groupName = group.name?.toLowerCase() || '';
          const groupNature = group.nature?.toLowerCase() || '';
          
          switch (defaultAccountGroupFilter) {
            case 'supplier':
              return groupNature === 'liability' || 
                     groupName.includes('creditor') ||
                     groupName.includes('supplier') ||
                     groupName.includes('payable');
            case 'customer':
              return groupNature === 'asset' || 
                     groupName.includes('debtor') ||
                     groupName.includes('customer') ||
                     groupName.includes('receivable');
            default:
              return true;
          }
        });
      }
      
      setAccountGroups(groups);
    } catch (error) {
      console.error('Account groups fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load account groups'
      });
    }
  };

  const handleGSTINChange = (value) => {
    const formattedGSTIN = formatGSTIN(value);
    
    // Update GSTIN
    setFormData(prev => ({ ...prev, gstin: formattedGSTIN }));
    
    // Auto-extract PAN if GSTIN is valid and complete (15 characters)
    if (formattedGSTIN.length === 15 && validateGSTIN(formattedGSTIN)) {
      const extractedPAN = extractPANFromGSTIN(formattedGSTIN);
      if (extractedPAN && validatePAN(extractedPAN)) {
        setFormData(prev => ({ ...prev, pan: extractedPAN }));
        
        // Show success notification
        showNotification({
          type: 'success',
          title: 'PAN Extracted',
          message: `PAN ${extractedPAN} extracted from GSTIN`
        });
      }
    }
  };

  const handlePANChange = (value) => {
    const formattedPAN = formatPAN(value.toUpperCase());
    setFormData(prev => ({ ...prev, pan: formattedPAN }));
  };
  const handleCreate = async () => {
    // Validation
    if (!formData.ledger_name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter ledger name'
      });
      return;
    }

    if (!formData.account_group_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select an account group'
      });
      return;
    }

    // GSTIN validation
    if (formData.gstin && !validateGSTIN(formData.gstin)) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid GSTIN (15 characters in correct format)'
      });
      return;
    }

    // PAN validation
    if (formData.pan && !validatePAN(formData.pan)) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid PAN (10 characters: 5 letters + 4 digits + 1 letter)'
      });
      return;
    }

    // Phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid phone number'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0
      };

      const response = await accountingAPI.ledgers.create(payload);
      const newLedger = response.data?.data || response.data;

      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Ledger created successfully'
      });

      // Reset form
      setFormData({
        ledger_name: '',
        account_group_id: '',
        gstin: '',
        pan: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        opening_balance: 0,
        balance_type: 'debit',
        description: ''
      });

      // Callback with new ledger
      if (onLedgerCreated) {
        onLedgerCreated(newLedger);
      }

      onClose();
    } catch (error) {
      console.error('Create ledger error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create ledger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountGroupSelect = (group) => {
    setFormData(prev => ({ ...prev, account_group_id: group.id }));
    setShowAccountGroupModal(false);
  };

  const filteredAccountGroups = accountGroups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.group_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.nature?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort account groups by nature and then by name for better organization
  const sortedAccountGroups = filteredAccountGroups.sort((a, b) => {
    // First sort by nature
    if (a.nature !== b.nature) {
      return (a.nature || '').localeCompare(b.nature || '');
    }
    // Then sort by name within the same nature
    return (a.name || '').localeCompare(b.name || '');
  });

  const selectedAccountGroup = accountGroups.find(g => g.id === formData.account_group_id);

  const renderAccountGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.accountGroupItem}
      onPress={() => handleAccountGroupSelect(item)}
    >
      <View style={styles.accountGroupContent}>
        <Text style={styles.accountGroupName}>{item.name}</Text>
        <Text style={styles.accountGroupDetail}>
          {item.group_code} • {item.nature?.toUpperCase() || 'N/A'}
        </Text>
        {item.parent_group && (
          <Text style={styles.accountGroupParent}>
            Under: {item.parent_group}
          </Text>
        )}
      </View>
      {formData.account_group_id === item.id && (
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ledger Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.ledger_name}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, ledger_name: value }))}
                    placeholder="Enter ledger name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Group *</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectInput]}
                    onPress={() => setShowAccountGroupModal(true)}
                  >
                    <Text style={[styles.inputText, !selectedAccountGroup && styles.placeholder]}>
                      {selectedAccountGroup ? 
                        `${selectedAccountGroup.name} (${selectedAccountGroup.group_code})` : 
                        'Select Account Group'
                      }
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Enter description (optional)"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>GSTIN</Text>
                    <TextInput
                      style={[
                        styles.input,
                        formData.gstin && formData.gstin.length === 15 && validateGSTIN(formData.gstin) && styles.validInput,
                        formData.gstin && formData.gstin.length > 0 && formData.gstin.length < 15 && styles.incompleteInput
                      ]}
                      value={formData.gstin}
                      onChangeText={handleGSTINChange}
                      placeholder="Enter GSTIN (15 characters)"
                      maxLength={15}
                      autoCapitalize="characters"
                    />
                    {formData.gstin && formData.gstin.length === 15 && validateGSTIN(formData.gstin) && (
                      <View style={styles.validationIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.validationText}>Valid GSTIN</Text>
                      </View>
                    )}
                    {formData.gstin && formData.gstin.length > 0 && formData.gstin.length < 15 && (
                      <View style={styles.validationIndicator}>
                        <Ionicons name="information-circle" size={16} color="#f59e0b" />
                        <Text style={[styles.validationText, { color: '#f59e0b' }]}>
                          {15 - formData.gstin.length} characters remaining
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PAN</Text>
                    <TextInput
                      style={[styles.input, formData.pan && styles.panExtracted]}
                      value={formData.pan}
                      onChangeText={handlePANChange}
                      placeholder="Enter PAN (auto-filled from GSTIN)"
                      maxLength={10}
                      autoCapitalize="characters"
                    />
                    {formData.gstin && formData.gstin.length === 15 && formData.pan && (
                      <View style={styles.panIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.panIndicatorText}>Auto-extracted</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, address: value }))}
                    placeholder="Enter address"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.city}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      placeholder="Enter city"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.state}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, state: value }))}
                      placeholder="Enter state"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Pincode</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.pincode}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, pincode: value }))}
                      placeholder="Enter pincode"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <PhoneInput
                      value={formData.phone}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                      placeholder="Enter phone number"
                      defaultCountry="IN"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
                    placeholder="Enter email"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Opening Balance */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opening Balance</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Opening Balance</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.opening_balance.toString()}
                      onChangeText={(value) => setFormData(prev => ({ 
                        ...prev, 
                        opening_balance: parseFloat(value) || 0 
                      }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Balance Type</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        Alert.alert(
                          'Select Balance Type',
                          'Choose the balance type',
                          [
                            { 
                              text: 'Debit', 
                              onPress: () => setFormData(prev => ({ ...prev, balance_type: 'debit' })) 
                            },
                            { 
                              text: 'Credit', 
                              onPress: () => setFormData(prev => ({ ...prev, balance_type: 'credit' })) 
                            },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.inputText}>
                        {formData.balance_type === 'credit' ? 'Credit' : 'Debit'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.actionButtonText, { color: '#6b7280' }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreate}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Creating...' : 'Create Ledger'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Account Group Selection Modal */}
      <Modal
        visible={showAccountGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountGroupModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Account Group</Text>
            <TouchableOpacity 
              onPress={() => setShowAccountGroupModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, code, or nature..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={sortedAccountGroups}
            renderItem={renderAccountGroupItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.accountGroupList}
          />
        </View>
      </Modal>
    </>
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
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
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
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    fontFamily: 'Agency',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
  },
  placeholder: {
    color: '#9ca3af',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  createButton: {
    backgroundColor: '#3e60ab',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
  },
  accountGroupList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  accountGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountGroupContent: {
    flex: 1,
  },
  accountGroupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  accountGroupDetail: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  accountGroupParent: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: 'Agency',
  },
  panExtracted: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  panIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  panIndicatorText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'Agency',
    fontWeight: '500',
  },
  validInput: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  incompleteInput: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  validationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  validationText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'Agency',
    fontWeight: '500',
  },
});