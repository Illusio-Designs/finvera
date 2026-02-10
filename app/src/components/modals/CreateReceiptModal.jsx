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
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    voucher_type: 'receipt',
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    amount: '0',
    narration: '',
    status: 'draft',
    payment_mode: 'cash',
  });
  
  const [ledgers, setLedgers] = useState([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLedgers();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      voucher_type: 'receipt',
      voucher_date: new Date().toISOString().split('T')[0],
      party_ledger_id: '',
      amount: '0',
      narration: '',
      status: 'draft',
      payment_mode: 'cash',
    });
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

  const handleSubmit = async () => {
    if (!formData.party_ledger_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a party ledger'
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
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        total_amount: parseFloat(formData.amount),
      };

      await voucherAPI.create(payload);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Receipt voucher created successfully'
      });
      
      if (onReceiptCreated) {
        onReceiptCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Create receipt error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create receipt voucher'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedLedger = ledgers.find(l => l.id === formData.party_ledger_id);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Receipt Voucher</Text>
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
              <Text style={styles.label}>Payment Mode</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setFormData({ ...formData, payment_mode: 'cash' })}
                >
                  <Ionicons
                    name={formData.payment_mode === 'cash' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#3e60ab"
                  />
                  <Text style={styles.radioLabel}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setFormData({ ...formData, payment_mode: 'bank' })}
                >
                  <Ionicons
                    name={formData.payment_mode === 'bank' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#3e60ab"
                  />
                  <Text style={styles.radioLabel}>Bank</Text>
                </TouchableOpacity>
              </View>
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
          >
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Create Receipt</Text>
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
  buttonDisabled: { opacity: 0.5 },
  buttonPrimaryText: { ...FONT_STYLES.label, color: 'white' },
  buttonSecondaryText: { ...FONT_STYLES.label, color: '#374151' },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { ...FONT_STYLES.h5, color: '#111827' },
  modalContent: { flex: 1 },
  loader: { marginTop: 40 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  listItemText: { ...FONT_STYLES.body, color: '#111827' },
});
