import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../../utils/fonts';
import TopBar from '../../../components/navigation/TopBar';
import CreateLedgerModal from '../../../components/modals/CreateLedgerModal';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useVoucher } from '../../../contexts/VoucherContext';
import { voucherAPI, accountingAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { useNavigation, useRoute } from '@react-navigation/native';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';
import TDSCalculationCard from '../../../components/invoice/TDSCalculationCard';
import TDSService from '../../../services/invoice/TDSService';

// Voucher number generation
const generateVoucherNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  
  return `PAY${year}${month}${day}${time}`;
};

export default function PaymentFormScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Settings and Voucher contexts
  const { 
    tdsEnabled
  } = useSettings();
  
  const {
    tdsDetails,
    updateTDSDetails
  } = useVoucher();
  
  const [formData, setFormData] = useState({
    voucher_number: generateVoucherNumber(),
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    party_name: '',
    payment_mode: 'Cash',
    reference_number: '',
    bank_name: '',
    amount: 0,
    tds_amount: 0,
    net_amount: 0,
    narration: '',
    status: 'draft'
  });

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Feature-specific loading states
  const [tdsLoading, setTdsLoading] = useState(false);
  
  // Saved voucher ID for post-save operations
  const [savedVoucherId, setSavedVoucherId] = useState(null);
  
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  const [showPaymentModeModal, setShowPaymentModeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const paymentModes = ['Cash', 'Bank', 'Cheque', 'UPI', 'Card', 'NEFT', 'RTGS', 'IMPS'];

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchParties = useCallback(async () => {
    try {
      const response = await accountingAPI.ledgers.list({ 
        limit: 1000 
      });
      const data = response.data?.data || response.data || [];
      const ledgersArray = Array.isArray(data) ? data : [];
      
      // Filter for parties (Sundry Creditors and Sundry Debtors)
      const partyLedgers = ledgersArray.filter(ledger => {
        const groupName = ledger.account_group?.name?.toLowerCase() || '';
        const groupName2 = ledger.account_group?.group_name?.toLowerCase() || '';
        return groupName === 'sundry creditors' || groupName2 === 'sundry creditors' ||
               groupName === 'sundry debtors' || groupName2 === 'sundry debtors';
      });
      
      setParties(partyLedgers);
    } catch (error) {
      console.error('Parties fetch error:', error);
      setParties([]);
    }
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      setPageLoading(true);
      const startTime = Date.now();
      
      await fetchParties();
      
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setPageLoading(false);
      }, remainingTime);
    };
    
    initializeForm();
  }, [fetchParties]);

  const handlePartySelect = (party) => {
    setFormData(prev => ({
      ...prev,
      party_ledger_id: party.id,
      party_name: party.ledger_name || party.name
    }));
    setShowPartyModal(false);
  };

  const handlePartyCreated = (newParty) => {
    setParties(prev => [newParty, ...prev]);
    handlePartySelect(newParty);
    
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Party created and selected successfully'
    });
  };

  const handlePaymentModeSelect = (mode) => {
    setFormData(prev => ({
      ...prev,
      payment_mode: mode
    }));
    setShowPaymentModeModal(false);
  };

  const handleAmountChange = (value) => {
    const amount = parseFloat(value) || 0;
    const tdsAmount = tdsDetails?.amount || 0;
    const netAmount = amount - tdsAmount;
    
    setFormData(prev => ({
      ...prev,
      amount,
      tds_amount: tdsAmount,
      net_amount: netAmount
    }));
  };

  const handleSave = async (status = 'draft') => {
    console.log('\n🚀 === PAYMENT SAVE STARTED ===');
    console.log('📋 Status:', status);

    if (loading) {
      console.log('❌ ALREADY LOADING - PREVENTING DUPLICATE CALL');
      return;
    }

    if (!formData.party_ledger_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a party'
      });
      return;
    }

    if (formData.amount <= 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid amount'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        voucher_type: 'payment',
        voucher_number: formData.voucher_number,
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        payment_mode: formData.payment_mode,
        reference_number: formData.reference_number,
        bank_name: formData.bank_name,
        total_amount: formData.amount,
        tds_amount: formData.tds_amount,
        net_amount: formData.net_amount,
        narration: formData.narration,
        status
      };

      console.log('\n📤 API Payload:', JSON.stringify(payload, null, 2));
      
      const response = await voucherAPI.payment.create(payload);
      
      console.log('✅ API Call Successful');
      console.log('📥 API Response:', JSON.stringify(response.data, null, 2));
      
      // Extract voucher ID from response
      const voucherId = response.data?.data?.id || response.data?.id;
      setSavedVoucherId(voucherId);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Payment ${status === 'draft' ? 'saved as draft' : 'posted'} successfully`
      });
      
      // Handle post-save operations if posted
      if (status === 'posted' && voucherId) {
        await handlePostSaveOperations(voucherId);
      }
      
      console.log('🎉 === PAYMENT SAVE COMPLETED ===\n');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('💥 Save Error Details:', error);
      
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save payment'
      });
      console.log('💔 === PAYMENT SAVE FAILED ===\n');
    } finally {
      setLoading(false);
    }
  };

  // Handle post-save operations (TDS calculation)
  const handlePostSaveOperations = async (voucherId) => {
    console.log('\n🔄 === POST-SAVE OPERATIONS STARTED ===');
    console.log('📋 Voucher ID:', voucherId);
    console.log('📋 TDS Enabled:', tdsEnabled);
    
    // TDS calculation is already done before save, so just log
    if (tdsEnabled && tdsDetails) {
      console.log('✅ TDS already calculated:', tdsDetails);
    }
    
    console.log('✅ === POST-SAVE OPERATIONS COMPLETED ===\n');
  };

  const filteredParties = parties.filter(party =>
    (party.ledger_name || party.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // TDS handlers
  const handleTDSCalculate = async () => {
    if (!formData.amount || formData.amount <= 0) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter a valid amount first'
      });
      return;
    }

    try {
      setTdsLoading(true);
      const result = await TDSService.calculateTDS({
        voucherId: savedVoucherId || 'temp-voucher',
        amount: formData.amount,
        section: tdsDetails?.section || '194C',
        deducteeType: 'COMPANY'
      });
      updateTDSDetails(result);
      
      // Update form with TDS amount
      const netAmount = formData.amount - result.amount;
      setFormData(prev => ({
        ...prev,
        tds_amount: result.amount,
        net_amount: netAmount
      }));
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'TDS calculated successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to calculate TDS'
      });
    } finally {
      setTdsLoading(false);
    }
  };

  const handleTDSSectionChange = async (section) => {
    if (!formData.amount || formData.amount <= 0) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter a valid amount first'
      });
      return;
    }

    try {
      setTdsLoading(true);
      const result = await TDSService.calculateTDS({
        voucherId: savedVoucherId || 'temp-voucher',
        amount: formData.amount,
        section,
        deducteeType: 'COMPANY'
      });
      updateTDSDetails(result);
      
      // Update form with TDS amount
      const netAmount = formData.amount - result.amount;
      setFormData(prev => ({
        ...prev,
        tds_amount: result.amount,
        net_amount: netAmount
      }));
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to recalculate TDS'
      });
    } finally {
      setTdsLoading(false);
    }
  };

  const renderPartyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.partyItem}
      onPress={() => handlePartySelect(item)}
    >
      <View style={styles.partyContent}>
        <Text style={styles.partyName}>
          {item.ledger_name || item.name || 'Unnamed Party'}
        </Text>
        
        {item.account_group?.name && (
          <Text style={styles.partyGroup}>
            {item.account_group.name}
          </Text>
        )}
        
        {item.contact_number && (
          <Text style={styles.partyContact}>📞 {item.contact_number}</Text>
        )}
        {item.email && (
          <Text style={styles.partyContact}>✉️ {item.email}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  const renderPaymentModeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modeItem}
      onPress={() => handlePaymentModeSelect(item)}
    >
      <Text style={styles.modeName}>{item}</Text>
      {formData.payment_mode === item && (
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TopBar 
        title="Payment Voucher" 
        onMenuPress={handleMenuPress}
        rightComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pageLoading ? (
          <FormSkeleton fieldCount={8} />
        ) : (
          <>
            {/* Header Section */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>Payment Voucher</Text>
                  <Text style={styles.headerSubtitle}>Create new payment</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>DRAFT</Text>
                </View>
              </View>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Voucher Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.voucher_number}
                    editable={false}
                    placeholder="Auto-generated"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <ModernDatePicker
                    value={formData.voucher_date}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, voucher_date: date }))}
                    placeholder="Select date"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Party *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput]}
                  onPress={() => setShowPartyModal(true)}
                >
                  <Text style={[styles.inputText, !formData.party_name && styles.placeholder]}>
                    {formData.party_name || 'Select Party'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Mode</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput]}
                  onPress={() => setShowPaymentModeModal(true)}
                >
                  <Text style={styles.inputText}>
                    {formData.payment_mode}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {formData.payment_mode !== 'Cash' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reference Number</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.reference_number}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, reference_number: value }))}
                      placeholder="Enter reference/transaction number"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bank Name</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.bank_name}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, bank_name: value }))}
                      placeholder="Enter bank name"
                    />
                  </View>
                </>
              )}
            </View>

            {/* Amount Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Amount</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount.toString()}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>

              {formData.amount > 0 && (
                <View style={styles.amountSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Gross Amount:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(formData.amount)}</Text>
                  </View>
                  {tdsEnabled && formData.tds_amount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>TDS Deducted:</Text>
                      <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                        - {formatCurrency(formData.tds_amount)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.netAmountRow]}>
                    <Text style={styles.netAmountLabel}>Net Payable:</Text>
                    <Text style={styles.netAmountValue}>{formatCurrency(formData.net_amount)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* TDS Calculation Card - Conditional */}
            {tdsEnabled && formData.amount > 0 && (
              <TDSCalculationCard
                tdsDetails={tdsDetails}
                amount={formData.amount}
                onSectionChange={handleTDSSectionChange}
                onCalculate={handleTDSCalculate}
                loading={tdsLoading}
              />
            )}

            {/* Loading Indicator for TDS */}
            {tdsLoading && (
              <View style={styles.operationLoadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.operationLoadingText}>
                  Calculating TDS...
                </Text>
              </View>
            )}

            {/* Narration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Narration</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.narration}
                onChangeText={(value) => setFormData(prev => ({ ...prev, narration: value }))}
                placeholder="Enter narration or notes"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.draftButton]}
                onPress={() => handleSave('draft')}
                disabled={loading}
              >
                <Ionicons name="save-outline" size={20} color="#f59e0b" />
                <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>
                  Save as Draft
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.postButton, loading && styles.disabledButton]}
                onPress={() => handleSave('posted')}
                disabled={loading}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  {loading ? 'Posting...' : 'Post Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Party Selection Modal */}
      <Modal
        visible={showPartyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPartyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Party</Text>
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowPartyModal(false);
                  setShowCreateLedgerModal(true);
                }}
                style={styles.addPartyButton}
              >
                <Ionicons name="add" size={20} color="#3e60ab" />
                <Text style={styles.addPartyText}>Add Party</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPartyModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parties..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredParties}
            renderItem={renderPartyItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No parties found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {parties.length === 0 
                    ? 'Create a new party to get started' 
                    : 'Try a different search term'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Payment Mode Selection Modal */}
      <Modal
        visible={showPaymentModeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Mode</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={paymentModes}
            renderItem={renderPaymentModeItem}
            keyExtractor={(item) => item}
            style={styles.modalList}
          />
        </View>
      </Modal>

      {/* Create Party Modal */}
      <CreateLedgerModal
        visible={showCreateLedgerModal}
        onClose={() => setShowCreateLedgerModal(false)}
        onLedgerCreated={handlePartyCreated}
        title="Create New Party"
      />
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 4
  },
  headerSubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  statusBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    ...FONT_STYLES.caption,
    color: 'white'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16
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
    marginBottom: 8
  },
  input: {
    ...FONT_STYLES.h5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    color: '#111827',
    backgroundColor: 'white'
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  placeholder: {
    color: '#9ca3af',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  amountSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  summaryValue: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  netAmountRow: {
    borderTopWidth: 2,
    borderTopColor: '#10b981',
    paddingTop: 8,
    marginTop: 8,
  },
  netAmountLabel: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  netAmountValue: {
    ...FONT_STYLES.h5,
    color: '#10b981'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  draftButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  postButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addPartyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3e60ab',
    gap: 4,
  },
  addPartyText: {
    ...FONT_STYLES.label,
    color: '#3e60ab'
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  closeButton: {
    padding: 4,
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
  modalList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  partyItem: {
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
  partyContent: {
    flex: 1,
  },
  partyName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  partyGroup: {
    ...FONT_STYLES.caption,
    color: '#3b82f6',
    marginBottom: 4
  },
  partyContact: {
    ...FONT_STYLES.caption,
    color: '#6b7280'
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  modeName: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4
  },
  emptyStateSubtext: {
    ...FONT_STYLES.label,
    color: '#9ca3af',
    textAlign: 'center'
  },
  operationLoadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  operationLoadingText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center'
  },
});
