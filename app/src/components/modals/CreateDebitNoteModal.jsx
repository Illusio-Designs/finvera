import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { voucherAPI, accountingAPI, inventoryAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';
import ModernDatePicker from '../ui/ModernDatePicker';
import CreateInventoryItemModal from './CreateInventoryItemModal';

export default function CreateDebitNoteModal({ 
  visible, 
  onClose, 
  onDebitNoteCreated,
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    voucher_type: 'debit_note',
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    reference_number: '',
    narration: '',
    total_amount: 0,
    status: 'draft',
  });
  
  const [Suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    item_name: '',
    quantity: '1',
    rate: '0',
    gst_rate: '0',
  });

  useEffect(() => {
    if (visible) {
      fetchSuppliers();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      voucher_type: 'debit_note',
      voucher_date: new Date().toISOString().split('T')[0],
      party_ledger_id: '',
      reference_number: '',
      narration: '',
      total_amount: 0,
      status: 'draft',
    });
    setItems([]);
  };

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await accountingAPI.ledgers.list({ limit: 1000 });
      const data = response?.data?.data || response?.data || [];
      const sundryDebtors = data.filter(ledger => {
        const groupName = ledger.account_group?.group_name?.toLowerCase() || '';
        return groupName === 'sundry creditors';
      });
      setSuppliers(Array.isArray(sundryDebtors) ? sundryDebtors : []);
    } catch (error) {
      console.error('Fetch Suppliers error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load Supplier list'
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstRate = parseFloat(item.gst_rate) || 0;
      const itemTotal = qty * rate;
      const gstAmount = (itemTotal * gstRate) / 100;
      return sum + itemTotal + gstAmount;
    }, 0);
    return total;
  };

  const handleAddItem = () => {
    if (!itemForm.item_name) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter item name'
      });
      return;
    }

    const newItem = {
      item_name: itemForm.item_name,
      quantity: parseFloat(itemForm.quantity) || 1,
      rate: parseFloat(itemForm.rate) || 0,
      gst_rate: parseFloat(itemForm.gst_rate) || 0,
    };

    setItems([...items, newItem]);
    setItemForm({ item_name: '', quantity: '1', rate: '0', gst_rate: '0' });
    setShowAddItemModal(false);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.party_ledger_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a Supplier'
      });
      return;
    }

    if (items.length === 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please add at least one item'
      });
      return;
    }

    try {
      setLoading(true);
      const total = calculateTotal();
      const payload = {
        ...formData,
        total_amount: total,
        items: items,
      };

      await voucherAPI.create(payload);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Debit Note created successfully'
      });
      
      if (onDebitNoteCreated) {
        onDebitNoteCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Create Debit Note error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create Debit Note'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = Suppliers.find(c => c.id === formData.party_ledger_id);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Debit Note</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debit Note Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Date *</Text>
              <ModernDatePicker
                value={formData.voucher_date}
                onChange={(date) => setFormData({ ...formData, voucher_date: date })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Supplier *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowSupplierModal(true)}
              >
                <Text style={[styles.selectButtonText, selectedSupplier && styles.selectButtonTextSelected]}>
                  {selectedSupplier ? selectedSupplier.ledger_name : 'Select Supplier'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Reference Number</Text>
              <TextInput
                style={styles.input}
                value={formData.reference_number}
                onChangeText={(text) => setFormData({ ...formData, reference_number: text })}
                placeholder="Enter reference number"
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddItemModal(true)}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>No items added yet</Text>
            ) : (
              items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <Text style={styles.itemDetails}>
                      Qty: {item.quantity} × ₹{item.rate} (GST: {item.gst_rate}%)
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {items.length > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
              </View>
            )}
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
              <Text style={styles.buttonPrimaryText}>Create Debit Note</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Supplier Selection Modal */}
        <Modal
          visible={showSupplierModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSupplierModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {loadingSuppliers ? (
                <ActivityIndicator size="large" color="#3e60ab" style={styles.loader} />
              ) : (
                Suppliers.map((Supplier) => (
                  <TouchableOpacity
                    key={Supplier.id}
                    style={styles.listItem}
                    onPress={() => {
                      setFormData({ ...formData, party_ledger_id: Supplier.id });
                      setShowSupplierModal(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{Supplier.ledger_name}</Text>
                    {formData.party_ledger_id === Supplier.id && (
                      <Ionicons name="checkmark" size={20} color="#3e60ab" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Add Item Modal */}
        <Modal
          visible={showAddItemModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddItemModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.section}>
                <View style={styles.field}>
                  <Text style={styles.label}>Item Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.item_name}
                    onChangeText={(text) => setItemForm({ ...itemForm, item_name: text })}
                    placeholder="Enter item name"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.quantity}
                    onChangeText={(text) => setItemForm({ ...itemForm, quantity: text })}
                    placeholder="1"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Rate *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.rate}
                    onChangeText={(text) => setItemForm({ ...itemForm, rate: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>GST Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.gst_rate}
                    onChangeText={(text) => setItemForm({ ...itemForm, gst_rate: text })}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleAddItem}
              >
                <Text style={styles.buttonPrimaryText}>Add Item</Text>
              </TouchableOpacity>
            </View>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { ...FONT_STYLES.h5, color: '#111827' },
  field: { marginBottom: 16 },
  label: { ...FONT_STYLES.label, color: '#374151', marginBottom: 8 },
  input: { ...FONT_STYLES.body, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'white' },
  selectButtonText: { ...FONT_STYLES.body, color: '#9ca3af' },
  selectButtonTextSelected: { color: '#111827' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3e60ab', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4 },
  addButtonText: { ...FONT_STYLES.label, color: 'white', fontSize: 12 },
  emptyText: { ...FONT_STYLES.body, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8 },
  itemInfo: { flex: 1 },
  itemName: { ...FONT_STYLES.label, color: '#111827', marginBottom: 4 },
  itemDetails: { ...FONT_STYLES.caption, color: '#6b7280' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  totalLabel: { ...FONT_STYLES.h5, color: '#111827' },
  totalValue: { ...FONT_STYLES.h5, color: '#10b981' },
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
  modalContent: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },
  loader: { marginTop: 40 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  listItemText: { ...FONT_STYLES.body, color: '#111827' },
});
