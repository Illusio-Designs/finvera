import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../utils/fonts';;
import { accountingAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
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
  onSuccess,
  editData = null,
  isEdit = false,
  defaultAccountGroupFilter = null, // Filter for specific account group types
  title = null
}) {
  const { showNotification } = useNotification();
  const { showInfoConfirmation } = useConfirmation();
  
  const modalTitle = title || (isEdit ? 'Edit Ledger' : 'Create New Ledger');
  
  const [formData, setFormData] = useState({
    ledger_name: '',
    account_group_id: '',
    gstin: '',
    pan: '',
    pan_no: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    opening_balance: 0,
    balance_type: 'debit',
    description: '',
    // TDS/TCS fields
    is_tds_applicable: false,
    tds_section_code: '',
    tds_deductor_type: '',
    is_tcs_applicable: false,
    tcs_section_code: '',
  });

  const [accountGroups, setAccountGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAccountGroupModal, setShowAccountGroupModal] = useState(false);
  const [showBalanceTypeModal, setShowBalanceTypeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // TDS/TCS state
  const [tdsSections, setTdsSections] = useState([]);
  const [tcsSections, setTcsSections] = useState([]);
  const [showTdsSectionModal, setShowTdsSectionModal] = useState(false);
  const [showTcsSectionModal, setShowTcsSectionModal] = useState(false);
  const [showDeductorTypeModal, setShowDeductorTypeModal] = useState(false);
  const [companyTdsEnabled, setCompanyTdsEnabled] = useState(false);
  const [companyTcsEnabled, setCompanyTcsEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAccountGroups();
      fetchTdsTcsSections();
      fetchCompanyConfig();
      
      // Populate form with edit data
      if (isEdit && editData) {
        setFormData({
          ledger_name: editData.ledger_name || '',
          account_group_id: editData.account_group_id || '',
          gstin: editData.gstin || '',
          pan: editData.pan || editData.pan_no || '',
          pan_no: editData.pan_no || editData.pan || '',
          address: editData.address || '',
          city: editData.city || '',
          state: editData.state || '',
          pincode: editData.pincode || '',
          phone: editData.phone || '',
          email: editData.email || '',
          opening_balance: editData.opening_balance || 0,
          balance_type: editData.balance_type || 'debit',
          description: editData.description || '',
          // TDS/TCS fields
          is_tds_applicable: editData.is_tds_applicable || false,
          tds_section_code: editData.tds_section_code || '',
          tds_deductor_type: editData.tds_deductor_type || '',
          is_tcs_applicable: editData.is_tcs_applicable || false,
          tcs_section_code: editData.tcs_section_code || '',
        });
      } else {
        // Reset form for create mode
        setFormData({
          ledger_name: '',
          account_group_id: '',
          gstin: '',
          pan: '',
          pan_no: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
          email: '',
          opening_balance: 0,
          balance_type: 'debit',
          description: '',
          // TDS/TCS fields
          is_tds_applicable: false,
          tds_section_code: '',
          tds_deductor_type: '',
          is_tcs_applicable: false,
          tcs_section_code: '',
        });
      }
    }
  }, [visible, isEdit, editData]);

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

  const fetchTdsTcsSections = async () => {
    try {
      // Fetch TDS sections
      const tdsResponse = await accountingAPI.tdsTcs.getTDSSections();
      setTdsSections(tdsResponse.data?.data || []);
      
      // Fetch TCS sections
      const tcsResponse = await accountingAPI.tdsTcs.getTCSSections();
      setTcsSections(tcsResponse.data?.data || []);
    } catch (error) {
      console.error('TDS/TCS sections fetch error:', error);
      // Don't show error notification, just log it
    }
  };

  const fetchCompanyConfig = async () => {
    try {
      // Get current company from context or storage
      // For now, we'll assume TDS/TCS is enabled
      // You can fetch this from company settings API
      setCompanyTdsEnabled(true);
      setCompanyTcsEnabled(true);
    } catch (error) {
      console.error('Company config fetch error:', error);
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
        opening_balance: parseFloat(formData.opening_balance) || 0,
        pan_no: formData.pan_no || formData.pan, // Ensure pan_no is sent
      };

      let response;
      if (isEdit && editData) {
        // Update existing ledger
        response = await accountingAPI.ledgers.update(editData.id, payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Ledger updated successfully'
        });
      } else {
        // Create new ledger
        response = await accountingAPI.ledgers.create(payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Ledger created successfully'
        });
      }

      const ledgerData = response.data?.data || response.data;

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

      // Callback with ledger data
      if (onSuccess) {
        onSuccess(ledgerData);
      } else if (onLedgerCreated) {
        onLedgerCreated(ledgerData);
      }

      onClose();
    } catch (error) {
      console.error('Ledger operation error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} ledger`
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
            <Text style={styles.title}>{modalTitle}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                      maxLength={6}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <PhoneInput
                      value={formData.phone}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                      placeholder="Enter phone number"
                      defaultCountry="IN"
                      showValidation={true}
                      style={styles.phoneInputWrapper}
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
                      onPress={() => setShowBalanceTypeModal(true)}
                    >
                      <Text style={styles.inputText}>
                        {formData.balance_type === 'credit' ? 'Credit' : 'Debit'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* TDS/TCS Settings - Only show for Sundry Creditors/Debtors */}
              {selectedAccountGroup && (
                (selectedAccountGroup.name?.toLowerCase().includes('sundry creditor') || 
                 selectedAccountGroup.name?.toLowerCase().includes('sundry debtor')) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>TDS/TCS Settings</Text>
                  
                  {/* TDS Section - Only for Sundry Creditors (Vendors) */}
                  {selectedAccountGroup.name?.toLowerCase().includes('sundry creditor') && companyTdsEnabled && (
                    <>
                      <View style={styles.switchRow}>
                        <View style={styles.switchLabel}>
                          <Text style={styles.inputLabel}>Enable TDS</Text>
                          <Text style={styles.switchDescription}>
                            Tax Deducted at Source for vendor payments
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.switch, formData.is_tds_applicable && styles.switchActive]}
                          onPress={() => setFormData(prev => ({ 
                            ...prev, 
                            is_tds_applicable: !prev.is_tds_applicable,
                            tds_section_code: !prev.is_tds_applicable ? '' : prev.tds_section_code,
                            tds_deductor_type: !prev.is_tds_applicable ? '' : prev.tds_deductor_type,
                          }))}
                        >
                          <View style={[styles.switchThumb, formData.is_tds_applicable && styles.switchThumbActive]} />
                        </TouchableOpacity>
                      </View>

                      {formData.is_tds_applicable && (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>TDS Section *</Text>
                            <TouchableOpacity
                              style={[styles.input, styles.selectInput]}
                              onPress={() => setShowTdsSectionModal(true)}
                            >
                              <Text style={[styles.inputText, !formData.tds_section_code && styles.placeholder]}>
                                {formData.tds_section_code ? 
                                  `${formData.tds_section_code} - ${tdsSections.find(s => s.section_code === formData.tds_section_code)?.description || ''}` : 
                                  'Select TDS Section'
                                }
                              </Text>
                              <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Deductor Type *</Text>
                            <TouchableOpacity
                              style={[styles.input, styles.selectInput]}
                              onPress={() => setShowDeductorTypeModal(true)}
                            >
                              <Text style={[styles.inputText, !formData.tds_deductor_type && styles.placeholder]}>
                                {formData.tds_deductor_type || 'Select Deductor Type'}
                              </Text>
                              <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color="#3b82f6" />
                            <Text style={styles.infoText}>
                              PAN is mandatory when TDS is applicable. Please ensure PAN is entered above.
                            </Text>
                          </View>
                        </>
                      )}
                    </>
                  )}

                  {/* TCS Section - Only for Sundry Debtors (Customers) */}
                  {selectedAccountGroup.name?.toLowerCase().includes('sundry debtor') && companyTcsEnabled && (
                    <>
                      <View style={styles.switchRow}>
                        <View style={styles.switchLabel}>
                          <Text style={styles.inputLabel}>Enable TCS</Text>
                          <Text style={styles.switchDescription}>
                            Tax Collected at Source for customer sales
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.switch, formData.is_tcs_applicable && styles.switchActive]}
                          onPress={() => setFormData(prev => ({ 
                            ...prev, 
                            is_tcs_applicable: !prev.is_tcs_applicable,
                            tcs_section_code: !prev.is_tcs_applicable ? '' : prev.tcs_section_code,
                          }))}
                        >
                          <View style={[styles.switchThumb, formData.is_tcs_applicable && styles.switchThumbActive]} />
                        </TouchableOpacity>
                      </View>

                      {formData.is_tcs_applicable && (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>TCS Section *</Text>
                            <TouchableOpacity
                              style={[styles.input, styles.selectInput]}
                              onPress={() => setShowTcsSectionModal(true)}
                            >
                              <Text style={[styles.inputText, !formData.tcs_section_code && styles.placeholder]}>
                                {formData.tcs_section_code ? 
                                  `${formData.tcs_section_code} - ${tcsSections.find(s => s.section_code === formData.tcs_section_code)?.description || ''}` : 
                                  'Select TCS Section'
                                }
                              </Text>
                              <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color="#3b82f6" />
                            <Text style={styles.infoText}>
                              PAN is mandatory when TCS is applicable. Please ensure PAN is entered above.
                            </Text>
                          </View>
                        </>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

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
                {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Ledger' : 'Create Ledger')}
              </Text>
            </TouchableOpacity>
          </View>
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

      {/* Balance Type Selection Modal */}
      <Modal
        visible={showBalanceTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBalanceTypeModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Balance Type</Text>
            <TouchableOpacity 
              onPress={() => setShowBalanceTypeModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.accountGroupList}>
            <TouchableOpacity
              style={styles.accountGroupItem}
              onPress={() => {
                setFormData(prev => ({ ...prev, balance_type: 'debit' }));
                setShowBalanceTypeModal(false);
              }}
            >
              <View style={styles.accountGroupContent}>
                <Text style={styles.accountGroupName}>Debit</Text>
                <Text style={styles.accountGroupDetail}>Assets and Expenses</Text>
              </View>
              {formData.balance_type === 'debit' && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountGroupItem}
              onPress={() => {
                setFormData(prev => ({ ...prev, balance_type: 'credit' }));
                setShowBalanceTypeModal(false);
              }}
            >
              <View style={styles.accountGroupContent}>
                <Text style={styles.accountGroupName}>Credit</Text>
                <Text style={styles.accountGroupDetail}>Liabilities, Income and Equity</Text>
              </View>
              {formData.balance_type === 'credit' && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TDS Section Selection Modal */}
      <Modal
        visible={showTdsSectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTdsSectionModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select TDS Section</Text>
            <TouchableOpacity 
              onPress={() => setShowTdsSectionModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.accountGroupList}>
            {tdsSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={styles.accountGroupItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, tds_section_code: section.section_code }));
                  setShowTdsSectionModal(false);
                }}
              >
                <View style={styles.accountGroupContent}>
                  <Text style={styles.accountGroupName}>{section.section_code}</Text>
                  <Text style={styles.accountGroupDetail}>{section.description}</Text>
                  <Text style={styles.accountGroupParent}>
                    Individual: {section.rate_individual}% | Company: {section.rate_company}%
                  </Text>
                </View>
                {formData.tds_section_code === section.section_code && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* TCS Section Selection Modal */}
      <Modal
        visible={showTcsSectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTcsSectionModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select TCS Section</Text>
            <TouchableOpacity 
              onPress={() => setShowTcsSectionModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.accountGroupList}>
            {tcsSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={styles.accountGroupItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, tcs_section_code: section.section_code }));
                  setShowTcsSectionModal(false);
                }}
              >
                <View style={styles.accountGroupContent}>
                  <Text style={styles.accountGroupName}>{section.section_code}</Text>
                  <Text style={styles.accountGroupDetail}>{section.description}</Text>
                  <Text style={styles.accountGroupParent}>
                    Rate: {section.rate}%
                  </Text>
                </View>
                {formData.tcs_section_code === section.section_code && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Deductor Type Selection Modal */}
      <Modal
        visible={showDeductorTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeductorTypeModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Deductor Type</Text>
            <TouchableOpacity 
              onPress={() => setShowDeductorTypeModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.accountGroupList}>
            <TouchableOpacity
              style={styles.accountGroupItem}
              onPress={() => {
                setFormData(prev => ({ ...prev, tds_deductor_type: 'Individual' }));
                setShowDeductorTypeModal(false);
              }}
            >
              <View style={styles.accountGroupContent}>
                <Text style={styles.accountGroupName}>Individual</Text>
                <Text style={styles.accountGroupDetail}>Individual or HUF deductor</Text>
              </View>
              {formData.tds_deductor_type === 'Individual' && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountGroupItem}
              onPress={() => {
                setFormData(prev => ({ ...prev, tds_deductor_type: 'Company' }));
                setShowDeductorTypeModal(false);
              }}
            >
              <View style={styles.accountGroupContent}>
                <Text style={styles.accountGroupName}>Company</Text>
                <Text style={styles.accountGroupDetail}>Company or firm deductor</Text>
              </View>
              {formData.tds_deductor_type === 'Company' && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>
          </View>
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
    paddingTop: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    ...FONT_STYLES.h5,
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '600',
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
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    color: '#111827',
    backgroundColor: 'white',
    fontSize: 14,
    minHeight: 48,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  inputText: {
    ...FONT_STYLES.body,
    color: '#111827',
    fontSize: 14,
  },
  placeholder: {
    color: '#9ca3af',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
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
    ...FONT_STYLES.body,
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
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
    ...FONT_STYLES.h5,
    flex: 1,
    color: '#111827'
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
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  accountGroupDetail: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  accountGroupParent: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2
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
    ...FONT_STYLES.caption,
    color: '#10b981'
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
    ...FONT_STYLES.caption,
    color: '#10b981'
  },
  phoneInputWrapper: {
    marginTop: 0,
  },
  // TDS/TCS Styles
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  switchDescription: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 4,
  },
  switch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#10b981',
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    ...FONT_STYLES.caption,
    color: '#3b82f6',
    flex: 1,
  },
});