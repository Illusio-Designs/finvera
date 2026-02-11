import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { voucherAPI, accountingAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';
import ModernDatePicker from '../ui/ModernDatePicker';

export default function CreateReceiptModal({ 
  visible, 
  onClose, 
  onReceiptCreated,
  editMode = false,
  voucherData = null,
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    voucher_type: 'receipt',
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    bank_ledger_id: '',
    amount: '0',
    narration: '',
    status: 'draft',
  });
  
  const [ledgers, setLedgers] = useState([]);
  const [bankCashLedgers, setBankCashLedgers] = useState([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showBankCashLedgerModal, setShowBankCashLedgerModal] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLedgers();
      if (editMode && voucherData) {
        loadVoucherData();
      } else {
        resetForm();
      }
    }
  }, [visible, editMode, voucherData]);

  const resetForm = () => {
    setFormData({
      voucher_type: 'receipt',
      voucher_date: new Date().toISOString().split('T')[0],
      party_ledger_id: '',
      bank_ledger_id: '',
      amount: '0',
      narration: '',
      status: 'draft',
    });
  };

  const loadVoucherData = () => {
    if (!voucherData) return;
    
    setFormData({
      voucher_type: 'receipt',
      voucher_date: voucherData.voucher_date || new Date().toISOString().split('T')[0],
      party_ledger_id: voucherData.party_ledger_id || '',
      bank_ledger_id: voucherData.bank_ledger_id || '',
      amount: String(voucherData.amount || voucherData.total_amount || '0'),
      narration: voucherData.narration || '',
      status: voucherData.status || 'draft',
    });
  };

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const response = await accountingAPI.ledgers.list({ limit: 1000 });
      const data = response?.data?.data || response?.data || [];
      const allLedgers = Array.isArray(data) ? data : [];
      
      // Filter bank and cash ledgers combined
      const bankAndCashLedgers = allLedgers.filter(ledger => 
        ledger.account_group_name?.toLowerCase().includes('bank') ||
        ledger.account_group_name?.toLowerCase().includes('cash') ||
        ledger.ledger_name?.toLowerCase().includes('bank') ||
        ledger.ledger_name?.toLowerCase().includes('cash')
      );
      
      setLedgers(allLedgers);
      setBankCashLedgers(bankAndCashLedgers);
    } catch (error) {
      console.error('Fetch ledgers error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load ledger list'
      });
    } finally {
      setLoadingLedgers(false);
    }
  };

  const handleSave = async () => {
    await saveReceipt('draft');
  };

  const handlePost = async () => {
    await saveReceipt('posted');
  };

  const saveReceipt = async (status) => {
    if (!formData.party_ledger_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a party ledger'
      });
      return;
    }

    if (!formData.bank_ledger_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a bank/cash ledger'
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid amount'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Determine payment mode based on selected ledger name/group
      const selectedLedger = bankCashLedgers.find(l => l.id === formData.bank_ledger_id);
      const isBankLedger = selectedLedger?.account_group_name?.toLowerCase().includes('bank') ||
                          selectedLedger?.ledger_name?.toLowerCase().includes('bank');
      const payment_mode = isBankLedger ? 'bank' : 'cash';
      
      const payload = {
        party_ledger_id: formData.party_ledger_id,
        bank_ledger_id: formData.bank_ledger_id,
        amount: parseFloat(formData.amount),
        payment_mode: payment_mode,
        narration: formData.narration,
        voucher_date: formData.voucher_date,
        status: status,
      };

      if (editMode && voucherData?.id) {
        await voucherAPI.receipt.update(voucherData.id, payload);
      } else {
        await voucherAPI.receipt.create(payload);
      }
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Receipt voucher ${editMode ? 'updated' : (status === 'posted' ? 'posted' : 'saved as draft')} successfully`
      });
      
      if (onReceiptCreated) {
        onReceiptCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Save receipt error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} receipt voucher`
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedLedger = ledgers.find(l => l.id === formData.party_ledger_id);
  const selectedBankCashLedger = bankCashLedgers.find(l => l.id === formData.bank_ledger_id);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{editMode ? 'Edit' : 'Create'} Receipt Voucher</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Date *</Text>
              <ModernDatePicker
                value={formData.voucher_date}
                onChange={(date) => setFormData({ ...formData, voucher_date: date })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Party Ledger *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowLedgerModal(true)}
              >
                <Text style={[styles.selectButtonText, selectedLedger && styles.selectButtonTextSelected]}>
                  {selectedLedger ? selectedLedger.ledger_name : 'Select Party Ledger'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bank/Cash Ledger *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowBankCashLedgerModal(true)}
              >
                <Text style={[styles.selectButtonText, selectedBankCashLedger && styles.selectButtonTextSelected]}>
                  {selectedBankCashLedger ? selectedBankCashLedger.ledger_name : 'Select Bank/Cash Ledger'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Narration</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.narration}
                onChangeText={(text) => setFormData({ ...formData, narration: text })}
                placeholder="Enter narration..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonOutlineText}>
              {loading ? 'Saving...' : 'Save Draft'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Ledger Selection Modal */}
        <Modal
          visible={showLedgerModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLedgerModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Party Ledger</Text>
              <TouchableOpacity onPress={() => setShowLedgerModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {loadingLedgers ? (
                <ActivityIndicator size="large" color="#3e60ab" style={styles.loader} />
              ) : (
                ledgers.map((ledger) => (
                  <TouchableOpacity
                    key={ledger.id}
                    style={styles.listItem}
                    onPress={() => {
                      setFormData({ ...formData, party_ledger_id: ledger.id });
                      setShowLedgerModal(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{ledger.ledger_name}</Text>
                    {formData.party_ledger_id === ledger.id && (
                      <Ionicons name="checkmark" size={20} color="#3e60ab" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Bank/Cash Ledger Selection Modal */}
        <Modal
          visible={showBankCashLedgerModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowBankCashLedgerModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank/Cash Ledger</Text>
              <TouchableOpacity onPress={() => setShowBankCashLedgerModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {loadingLedgers ? (
                <ActivityIndicator size="large" color="#3e60ab" style={styles.loader} />
              ) : (
                bankCashLedgers.map((ledger) => (
                  <TouchableOpacity
                    key={ledger.id}
                    style={styles.listItem}
                    onPress={() => {
                      setFormData({ ...formData, bank_ledger_id: ledger.id });
                      setShowBankCashLedgerModal(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{ledger.ledger_name}</Text>
                    {formData.bank_ledger_id === ledger.id && (
                      <Ionicons name="checkmark" size={20} color="#3e60ab" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { ...FONT_STYLES.h4, color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { ...FONT_STYLES.h5, color: '#111827', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { ...FONT_STYLES.label, color: '#374151', marginBottom: 8 },
  input: { ...FONT_STYLES.body, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'white' },
  selectButtonText: { ...FONT_STYLES.body, color: '#9ca3af' },
  selectButtonTextSelected: { color: '#111827' },
  radioGroup: { flexDirection: 'row', gap: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioLabel: { ...FONT_STYLES.body, color: '#374151' },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: '#3e60ab' },
  buttonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' },
  buttonOutline: { backgroundColor: 'white', borderWidth: 1, borderColor: '#3e60ab' },
  buttonDisabled: { opacity: 0.5 },
  buttonPrimaryText: { ...FONT_STYLES.label, color: 'white' },
  buttonSecondaryText: { ...FONT_STYLES.label, color: '#374151' },
  buttonOutlineText: { ...FONT_STYLES.label, color: '#3e60ab' },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { ...FONT_STYLES.h5, color: '#111827' },
  modalContent: { flex: 1 },
  loader: { marginTop: 40 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  listItemText: { ...FONT_STYLES.body, color: '#111827' },
});
