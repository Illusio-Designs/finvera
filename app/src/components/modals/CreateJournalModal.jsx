import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { voucherAPI, accountingAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';
import ModernDatePicker from '../ui/ModernDatePicker';

export default function CreateJournalModal({ 
  visible, 
  onClose, 
  onJournalCreated,
  editMode = false,
  voucherData = null,
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    narration: '',
  });
  
  // Multiple debit and credit entries
  const [debitEntries, setDebitEntries] = useState([
    { ledger_id: '', amount: '', narration: '' }
  ]);
  
  const [creditEntries, setCreditEntries] = useState([
    { ledger_id: '', amount: '', narration: '' }
  ]);
  
  const [ledgers, setLedgers] = useState([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState(null); // 'debit' or 'credit'
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(null);

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

  const loadVoucherData = async () => {
    try {
      // voucherData already contains full details from the screen
      const voucher = voucherData;
      
      setFormData({
        voucher_date: voucher.voucher_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        narration: voucher.narration || '',
      });

      // Parse ledger entries
      const ledgerEntries = voucher.ledger_entries || voucher.ledgerEntries || [];
      
      const debits = ledgerEntries
        .filter(entry => parseFloat(entry.debit_amount || 0) > 0)
        .map(entry => ({
          ledger_id: entry.ledger_id,
          amount: entry.debit_amount?.toString() || '',
          narration: entry.narration || '',
        }));
      
      const credits = ledgerEntries
        .filter(entry => parseFloat(entry.credit_amount || 0) > 0)
        .map(entry => ({
          ledger_id: entry.ledger_id,
          amount: entry.credit_amount?.toString() || '',
          narration: entry.narration || '',
        }));

      setDebitEntries(debits.length > 0 ? debits : [{ ledger_id: '', amount: '', narration: '' }]);
      setCreditEntries(credits.length > 0 ? credits : [{ ledger_id: '', amount: '', narration: '' }]);
    } catch (error) {
      console.error('Load voucher error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load voucher data'
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      voucher_date: new Date().toISOString().split('T')[0],
      narration: '',
    });
    setDebitEntries([{ ledger_id: '', amount: '', narration: '' }]);
    setCreditEntries([{ ledger_id: '', amount: '', narration: '' }]);
  };

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const response = await accountingAPI.ledgers.list({ limit: 1000 });
      const data = response?.data?.data || response?.data || [];
      setLedgers(Array.isArray(data) ? data : []);
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

  // Add new debit entry
  const addDebitEntry = () => {
    setDebitEntries([...debitEntries, { ledger_id: '', amount: '', narration: '' }]);
  };

  // Add new credit entry
  const addCreditEntry = () => {
    setCreditEntries([...creditEntries, { ledger_id: '', amount: '', narration: '' }]);
  };

  // Remove debit entry
  const removeDebitEntry = (index) => {
    if (debitEntries.length > 1) {
      const newEntries = debitEntries.filter((_, i) => i !== index);
      setDebitEntries(newEntries);
    }
  };

  // Remove credit entry
  const removeCreditEntry = (index) => {
    if (creditEntries.length > 1) {
      const newEntries = creditEntries.filter((_, i) => i !== index);
      setCreditEntries(newEntries);
    }
  };

  // Update debit entry
  const updateDebitEntry = (index, field, value) => {
    const newEntries = [...debitEntries];
    newEntries[index][field] = value;
    setDebitEntries(newEntries);
  };

  // Update credit entry
  const updateCreditEntry = (index, field, value) => {
    const newEntries = [...creditEntries];
    newEntries[index][field] = value;
    setCreditEntries(newEntries);
  };

  // Open ledger selection modal
  const openLedgerModal = (type, index) => {
    setSelectedEntryType(type);
    setSelectedEntryIndex(index);
    setShowLedgerModal(true);
  };

  // Handle ledger selection
  const handleLedgerSelect = (ledger) => {
    if (selectedEntryType === 'debit') {
      updateDebitEntry(selectedEntryIndex, 'ledger_id', ledger.id);
    } else {
      updateCreditEntry(selectedEntryIndex, 'ledger_id', ledger.id);
    }
    setShowLedgerModal(false);
  };

  // Calculate totals
  const calculateTotalDebit = () => {
    return debitEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  };

  const calculateTotalCredit = () => {
    return creditEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  };

  const handleSave = async () => {
    await saveJournal('draft');
  };

  const handlePost = async () => {
    await saveJournal('posted');
  };

  const saveJournal = async (status) => {
    // Validation
    const totalDebit = calculateTotalDebit();
    const totalCredit = calculateTotalCredit();

    if (totalDebit === 0 || totalCredit === 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter amounts for both debit and credit entries'
      });
      return;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: `Debit (₹${totalDebit.toFixed(2)}) and Credit (₹${totalCredit.toFixed(2)}) must be equal`
      });
      return;
    }

    // Check if all entries have ledgers selected
    const invalidDebit = debitEntries.some(entry => !entry.ledger_id || !entry.amount || parseFloat(entry.amount) <= 0);
    const invalidCredit = creditEntries.some(entry => !entry.ledger_id || !entry.amount || parseFloat(entry.amount) <= 0);

    if (invalidDebit || invalidCredit) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select ledger and enter amount for all entries'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create ledger entries array
      const ledger_entries = [
        ...debitEntries.map(entry => ({
          ledger_id: entry.ledger_id,
          debit_amount: parseFloat(entry.amount),
          credit_amount: 0,
          narration: entry.narration || formData.narration || 'Debit entry'
        })),
        ...creditEntries.map(entry => ({
          ledger_id: entry.ledger_id,
          debit_amount: 0,
          credit_amount: parseFloat(entry.amount),
          narration: entry.narration || formData.narration || 'Credit entry'
        }))
      ];
      
      const payload = {
        voucher_type: 'journal',
        voucher_date: formData.voucher_date,
        narration: formData.narration,
        total_amount: totalDebit,
        status: status,
        ledger_entries: ledger_entries
      };

      if (editMode && voucherData) {
        // Update existing voucher
        await voucherAPI.update(voucherData.id, payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: `Journal voucher updated successfully`
        });
      } else {
        // Create new voucher
        await voucherAPI.create(payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: `Journal voucher ${status === 'posted' ? 'posted' : 'saved as draft'} successfully`
        });
      }
      
      if (onJournalCreated) {
        onJournalCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Save journal error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} journal voucher`
      });
    } finally {
      setLoading(false);
    }
  };

  const getLedgerName = (ledgerId) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    return ledger ? ledger.ledger_name : 'Select Ledger';
  };

  const totalDebit = calculateTotalDebit();
  const totalCredit = calculateTotalCredit();
  const difference = totalDebit - totalCredit;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {editMode ? 'Edit Journal Voucher' : 'Create Journal Voucher'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Basic Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Date *</Text>
              <ModernDatePicker
                value={formData.voucher_date}
                onChange={(date) => setFormData({ ...formData, voucher_date: date })}
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

          {/* Debit Entries */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Debit Entries</Text>
              <TouchableOpacity style={styles.addButton} onPress={addDebitEntry}>
                <Ionicons name="add-circle" size={24} color="#3e60ab" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {debitEntries.map((entry, index) => (
              <View key={index} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryNumber}>Debit #{index + 1}</Text>
                  {debitEntries.length > 1 && (
                    <TouchableOpacity onPress={() => removeDebitEntry(index)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Ledger *</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => openLedgerModal('debit', index)}
                  >
                    <Text style={[styles.selectButtonText, entry.ledger_id && styles.selectButtonTextSelected]}>
                      {getLedgerName(entry.ledger_id)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    value={entry.amount}
                    onChangeText={(text) => updateDebitEntry(index, 'amount', text)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Narration (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={entry.narration}
                    onChangeText={(text) => updateDebitEntry(index, 'narration', text)}
                    placeholder="Entry specific narration..."
                  />
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Debit:</Text>
              <Text style={styles.totalAmount}>₹{totalDebit.toFixed(2)}</Text>
            </View>
          </View>

          {/* Credit Entries */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Credit Entries</Text>
              <TouchableOpacity style={styles.addButton} onPress={addCreditEntry}>
                <Ionicons name="add-circle" size={24} color="#3e60ab" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {creditEntries.map((entry, index) => (
              <View key={index} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryNumber}>Credit #{index + 1}</Text>
                  {creditEntries.length > 1 && (
                    <TouchableOpacity onPress={() => removeCreditEntry(index)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Ledger *</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => openLedgerModal('credit', index)}
                  >
                    <Text style={[styles.selectButtonText, entry.ledger_id && styles.selectButtonTextSelected]}>
                      {getLedgerName(entry.ledger_id)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    value={entry.amount}
                    onChangeText={(text) => updateCreditEntry(index, 'amount', text)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Narration (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={entry.narration}
                    onChangeText={(text) => updateCreditEntry(index, 'narration', text)}
                    placeholder="Entry specific narration..."
                  />
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Credit:</Text>
              <Text style={styles.totalAmount}>₹{totalCredit.toFixed(2)}</Text>
            </View>
          </View>

          {/* Balance Summary */}
          <View style={[styles.section, difference !== 0 && styles.sectionError]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Debit:</Text>
              <Text style={styles.summaryValue}>₹{totalDebit.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Credit:</Text>
              <Text style={styles.summaryValue}>₹{totalCredit.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelBold}>Difference:</Text>
              <Text style={[styles.summaryValueBold, Math.abs(difference) < 0.01 ? styles.balanced : styles.unbalanced]}>
                ₹{Math.abs(difference).toFixed(2)}
              </Text>
            </View>
            {Math.abs(difference) < 0.01 ? (
              <View style={styles.balanceMessage}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.balanceMessageText}>Journal is balanced</Text>
              </View>
            ) : (
              <View style={styles.balanceMessage}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={[styles.balanceMessageText, { color: '#ef4444' }]}>
                  Journal must be balanced to post
                </Text>
              </View>
            )}
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
              <Text style={styles.modalTitle}>
                Select {selectedEntryType === 'debit' ? 'Debit' : 'Credit'} Ledger
              </Text>
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
                    onPress={() => handleLedgerSelect(ledger)}
                  >
                    <Text style={styles.listItemText}>{ledger.ledger_name}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  headerTitle: { ...FONT_STYLES.h4, color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },
  section: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionError: {
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { ...FONT_STYLES.h5, color: '#111827', fontSize: 16, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryNumber: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    fontWeight: '600',
  },
  field: { marginBottom: 12 },
  label: { ...FONT_STYLES.label, color: '#374151', marginBottom: 8, fontSize: 13 },
  input: { 
    ...FONT_STYLES.body, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: 'white',
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selectButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    backgroundColor: 'white' 
  },
  selectButtonText: { ...FONT_STYLES.body, color: '#9ca3af', fontSize: 14 },
  selectButtonTextSelected: { color: '#111827' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    ...FONT_STYLES.label,
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  totalAmount: {
    ...FONT_STYLES.h5,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryRowTotal: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  summaryLabel: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  summaryValue: {
    ...FONT_STYLES.body,
    color: '#111827',
    fontWeight: '500',
  },
  summaryLabelBold: {
    ...FONT_STYLES.h5,
    color: '#111827',
    fontWeight: '600',
  },
  summaryValueBold: {
    ...FONT_STYLES.h5,
    fontWeight: '700',
    fontSize: 18,
  },
  balanced: {
    color: '#10b981',
  },
  unbalanced: {
    color: '#ef4444',
  },
  balanceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  balanceMessageText: {
    ...FONT_STYLES.label,
    color: '#10b981',
    fontWeight: '600',
  },
  footer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    gap: 12 
  },
  button: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  buttonPrimary: { backgroundColor: '#3e60ab' },
  buttonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' },
  buttonOutline: { backgroundColor: 'white', borderWidth: 1, borderColor: '#3e60ab' },
  buttonDisabled: { opacity: 0.5 },
  buttonPrimaryText: { ...FONT_STYLES.label, color: 'white', fontWeight: '600' },
  buttonSecondaryText: { ...FONT_STYLES.label, color: '#374151' },
  buttonOutlineText: { ...FONT_STYLES.label, color: '#3e60ab', fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  modalTitle: { ...FONT_STYLES.h5, color: '#111827' },
  modalContent: { flex: 1 },
  loader: { marginTop: 40 },
  listItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  listItemText: { ...FONT_STYLES.body, color: '#111827', flex: 1 },
});
