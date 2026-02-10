import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { voucherAPI, accountingAPI, inventoryAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';
import CreateInventoryItemModal from './CreateInventoryItemModal';

export default function CreatePurchaseInvoiceModal({ 
  visible, 
  onClose, 
  onInvoiceCreated,
  defaultVoucherType = 'purchase_invoice'
}) {
  const { showNotification } = useNotification();
  const { showDangerConfirmation } = useConfirmation();
  
  const [formData, setFormData] = useState({
    voucher_type: defaultVoucherType,
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    reference_number: '',
    narration: '',
    total_amount: 0,
    status: 'draft',
    place_of_supply: 'Maharashtra',
    is_reverse_charge: false,
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Items state
  const [items, setItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  
  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
  
  // Create Ledger form state
  const [ledgerForm, setLedgerForm] = useState({
    ledger_name: '',
    gstin: '',
    pan: '',
    email: '',
    contact_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [creatingLedger, setCreatingLedger] = useState(false);
  
  const invoiceTypes = [
    { label: 'Purchase Invoice', value: 'purchase_invoice' },
  ];

  // Fetch suppliers and inventory on mount
  useEffect(() => {
    if (visible) {
      fetchSuppliers();
      fetchInventory();
    }
  }, [visible]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await accountingAPI.ledgers.list({ 
        limit: 1000,
      });
      const data = response?.data?.data || response?.data || [];
      // Filter for Sundry Creditors (suppliers)
      const sundryCreditors = data.filter(ledger => {
        const groupName = ledger.account_group?.group_name?.toLowerCase() || '';
        return groupName === 'sundry creditors';
      });
      setSuppliers(Array.isArray(sundryCreditors) ? sundryCreditors : []);
    } catch (error) {
      console.error('Fetch suppliers error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load supplier list'
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoadingInventory(true);
      const response = await inventoryAPI.items.list({ limit: 1000 });
      const data = response?.data?.data || response?.data || [];
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch inventory error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load inventory items'
      });
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleInventoryItemCreated = async (newItem) => {
    // Refresh inventory list
    await fetchInventory();
    
    // Optionally auto-add the newly created item to the invoice
    if (newItem) {
      const itemToAdd = {
        inventory_item_id: newItem.id,
        item_code: newItem.item_code,
        item_name: newItem.item_name,
        item_description: newItem.item_name,
        quantity: 1,
        rate: parseFloat(newItem.avg_cost || 0),
        amount: parseFloat(newItem.avg_cost || 0),
        hsn_sac_code: newItem.hsn_sac_code || '',
        gst_rate: parseFloat(newItem.gst_rate || 0),
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
      };
      
      // Calculate GST
      const gstAmount = (itemToAdd.amount * itemToAdd.gst_rate) / 100;
      itemToAdd.cgst_amount = gstAmount / 2;
      itemToAdd.sgst_amount = gstAmount / 2;
      
      setItems([...items, itemToAdd]);
      setShowItemModal(false);
    }
  };

  const handleCreateLedger = async () => {
    try {
      setCreatingLedger(true);
      
      // Validate required fields
      if (!ledgerForm.ledger_name.trim()) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter supplier name'
        });
        return;
      }

      // Create ledger - need to get account_group_id for Sundry Creditors
      // For now, we'll let the backend handle the default group
      const ledgerData = {
        ledger_name: ledgerForm.ledger_name,
        gstin: ledgerForm.gstin || null,
        pan: ledgerForm.pan || null,
        email: ledgerForm.email || null,
        contact_number: ledgerForm.contact_number || null,
        address: ledgerForm.address || null,
        city: ledgerForm.city || null,
        state: ledgerForm.state || null,
        pincode: ledgerForm.pincode || null,
        // These will be set by backend or need to be fetched
        account_group_id: null, // Backend should handle default
        opening_balance: 0,
        opening_balance_type: 'Cr', // Creditor balance
      };

      const response = await accountingAPI.ledgers.create(ledgerData);
      const newLedger = response?.data?.data || response?.data;
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Supplier created successfully'
      });
      
      // Refresh suppliers list
      await fetchSuppliers();
      
      // Select the newly created ledger
      if (newLedger?.id) {
        setFormData({ ...formData, party_ledger_id: newLedger.id, place_of_supply: newLedger.state || 'Maharashtra' });
      }
      
      // Reset form and close modals
      setLedgerForm({
        ledger_name: '',
        gstin: '',
        pan: '',
        email: '',
        contact_number: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
      setShowCreateLedgerModal(false);
      setShowSupplierModal(false);
      
    } catch (error) {
      console.error('Create ledger error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create supplier'
      });
    } finally {
      setCreatingLedger(false);
    }
  };

  const handleBack = () => {
    onClose();
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.voucher_date) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select date'
        });
        return;
      }

      if (!formData.party_ledger_id) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select a supplier'
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

      // Create purchase invoice
      const voucherData = {
        voucher_type: 'purchase_invoice',
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        reference: formData.reference_number || null,
        narration: formData.narration || null,
        place_of_supply: formData.place_of_supply,
        is_reverse_charge: formData.is_reverse_charge || false,
        status: formData.status,
        items: items.map(item => ({
          inventory_item_id: item.inventory_item_id,
          item_code: item.item_code,
          item_description: item.item_description,
          item_name: item.item_name,
          hsn_sac_code: item.hsn_sac_code,
          quantity: item.quantity,
          rate: item.rate,
          gst_rate: item.gst_rate,
        })),
      };

      const response = await voucherAPI.purchaseInvoice.create(voucherData);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Purchase Invoice created successfully'
      });
      
      if (onInvoiceCreated) {
        onInvoiceCreated(response);
      }
      
      onClose();
    } catch (error) {
      console.error('Create invoice error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create purchase invoice'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date as DD/MM/YY
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, voucher_date: dateString });
    }
  };

  const handleDueDateChange = (event, selectedDate) => {
    setShowDueDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, due_date: dateString });
    }
  };

  const getInvoiceTypeLabel = () => {
    const type = invoiceTypes.find(t => t.value === formData.voucher_type);
    return type ? type.label : 'Select Invoice Type';
  };

  const getSupplierLabel = () => {
    if (!formData.party_ledger_id) return 'Select Supplier';
    const supplier = suppliers.find(s => s.id === formData.party_ledger_id);
    return supplier ? supplier.ledger_name : 'Select Supplier';
  };

  const getPurposeLabel = () => {
    if (!formData.purpose) return 'Select Purpose';
    const purpose = purposes.find(p => p.value === formData.purpose);
    return purpose ? purpose.label : 'Select Purpose';
  };

  const getTransportModeLabel = () => {
    const mode = transportModes.find(m => m.value === formData.transport_mode);
    return mode ? mode.label : 'Select Transport Mode';
  };

  // Check if current voucher type needs specific fields
  // For purchase invoices, we always need inventory items
  const needsInventoryItems = formData.voucher_type === 'purchase_invoice';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Purchase Invoice</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          
          {/* Invoice Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Invoice Type *</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowInvoiceTypeModal(true)}
            >
              <Text style={styles.selectButtonText}>{getInvoiceTypeLabel()}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectButtonText}>{formatDateDisplay(formData.voucher_date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Supplier Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Supplier *</Text>
            {loadingSuppliers ? (
              <View style={[styles.selectButton, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#3e60ab" />
                <Text style={styles.loadingText}>Loading suppliers...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowSupplierModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !formData.party_ledger_id && styles.placeholderText
                ]}>
                  {getSupplierLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Reference Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reference Number</Text>
            <TextInput
              style={styles.input}
              value={formData.reference_number}
              onChangeText={(text) => setFormData({ ...formData, reference_number: text })}
              placeholder="Enter reference number (optional)"
            />
          </View>

          {/* Narration */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Narration</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.narration}
              onChangeText={(text) => setFormData({ ...formData, narration: text })}
              placeholder="Enter narration (optional)"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Due Date (for invoices) */}
          {['sales_invoice', 'tax_invoice', 'purchase_invoice'].includes(formData.voucher_type) && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Text style={[styles.selectButtonText, !formData.due_date && styles.placeholderText]}>
                  {formData.due_date ? formatDateDisplay(formData.due_date) : 'Select due date (optional)'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Items Section - Only for invoice types that need inventory */}
        {needsInventoryItems && (
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity 
                style={styles.addItemButton}
                onPress={() => setShowItemModal(true)}
              >
                <Ionicons name="add-circle" size={20} color="#3e60ab" />
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItemsContainer}>
                <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyItemsText}>No items added</Text>
                <Text style={styles.emptyItemsSubtext}>Tap "Add Item" to add products/services</Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {items.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemCardHeader}>
                      <Text style={styles.itemName}>{item.item_description}</Text>
                      <TouchableOpacity 
                        onPress={async () => {
                          const confirmed = await showDangerConfirmation(
                            'Delete Item',
                            `Are you sure you want to remove "${item.item_description}" from this invoice?`,
                            {
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                            }
                          );
                          
                          if (confirmed) {
                            const newItems = items.filter((_, i) => i !== index);
                            setItems(newItems);
                          }
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.itemCardDetails}>
                      <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemDetail}>Rate: ₹{item.rate}</Text>
                      <Text style={styles.itemDetail}>Amount: ₹{item.amount}</Text>
                    </View>
                    {item.gst_rate > 0 && (
                      <Text style={styles.itemTax}>GST {item.gst_rate}%</Text>
                    )}
                  </View>
                ))}
                
                {/* Total Summary */}
                <View style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>
                      ₹{items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Tax:</Text>
                    <Text style={styles.totalValue}>
                      ₹{items.reduce((sum, item) => 
                        sum + parseFloat(item.cgst_amount || 0) + 
                        parseFloat(item.sgst_amount || 0) + 
                        parseFloat(item.igst_amount || 0), 0
                      ).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                    <Text style={styles.grandTotalValue}>
                      ₹{items.reduce((sum, item) => 
                        sum + parseFloat(item.amount || 0) + 
                        parseFloat(item.cgst_amount || 0) + 
                        parseFloat(item.sgst_amount || 0) + 
                        parseFloat(item.igst_amount || 0), 0
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* GST Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>GST Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Place of Supply</Text>
            <TextInput
              style={styles.input}
              value={formData.place_of_supply}
              onChangeText={(text) => setFormData({ ...formData, place_of_supply: text })}
              placeholder="Enter place of supply"
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, is_reverse_charge: !formData.is_reverse_charge })}
              >
                {formData.is_reverse_charge && <Ionicons name="checkmark" size={18} color="#3e60ab" />}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Reverse Charge Mechanism (RCM)</Text>
            </View>
          </View>
        </View>

        {/* Required Fields Info */}
        <View style={styles.requiredInfo}>
          <Text style={styles.requiredInfoText}>* Required fields</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleBack}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Draft'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.voucher_date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Due Date Picker */}
      {showDueDatePicker && (
        <DateTimePicker
          value={formData.due_date ? new Date(formData.due_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDueDateChange}
        />
      )}

      {/* Invoice Type Modal */}
      <Modal
        visible={showInvoiceTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInvoiceTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Invoice Type</Text>
              <TouchableOpacity onPress={() => setShowInvoiceTypeModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {invoiceTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.modalItem,
                    formData.voucher_type === type.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, voucher_type: type.value });
                    setShowInvoiceTypeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.voucher_type === type.value && styles.modalItemTextSelected
                  ]}>
                    {type.label}
                  </Text>
                  {formData.voucher_type === type.value && (
                    <Ionicons name="checkmark" size={20} color="#3e60ab" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supplier Modal */}
      <Modal
        visible={showSupplierModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupplierModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {/* Create Supplier Button */}
            <View style={styles.modalActionBar}>
              <TouchableOpacity 
                style={styles.createCustomerButton}
                onPress={() => {
                  setShowSupplierModal(false);
                  setShowCreateLedgerModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color="#3e60ab" />
                <Text style={styles.createCustomerText}>Create New Supplier</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {suppliers.length === 0 ? (
                <View style={styles.emptyModalContainer}>
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyModalText}>No suppliers found</Text>
                  <Text style={styles.emptyModalSubtext}>Create a supplier to get started</Text>
                </View>
              ) : (
                suppliers.map((supplier) => (
                  <TouchableOpacity
                    key={supplier.id}
                    style={[
                      styles.modalItem,
                      formData.party_ledger_id === supplier.id && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, party_ledger_id: supplier.id });
                      setShowSupplierModal(false);
                    }}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[
                        styles.modalItemText,
                        formData.party_ledger_id === supplier.id && styles.modalItemTextSelected
                      ]}>
                        {supplier.ledger_name}
                      </Text>
                      {supplier.gstin && (
                        <Text style={styles.modalItemSubtext}>GSTIN: {supplier.gstin}</Text>
                      )}
                    </View>
                    {formData.party_ledger_id === supplier.id && (
                      <Ionicons name="checkmark" size={20} color="#3e60ab" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Item Selection Modal */}
      <Modal
        visible={showItemModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowItemModal(false);
          setItemSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Item</Text>
              <TouchableOpacity onPress={() => {
                setShowItemModal(false);
                setItemSearchQuery('');
              }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
                placeholder="Search items..."
                placeholderTextColor="#9ca3af"
              />
              {itemSearchQuery ? (
                <TouchableOpacity onPress={() => setItemSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Create Item Button */}
            <View style={styles.modalActionBar}>
              <TouchableOpacity 
                style={styles.createItemButton}
                onPress={() => {
                  setShowItemModal(false);
                  setShowCreateInventoryModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color="#3e60ab" />
                <Text style={styles.createItemText}>Create New Item</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {loadingInventory ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3e60ab" />
                  <Text style={styles.loadingText}>Loading items...</Text>
                </View>
              ) : inventoryItems.filter(item =>
                  item.item_name?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                  item.item_code?.toLowerCase().includes(itemSearchQuery.toLowerCase())
                ).length === 0 ? (
                <View style={styles.emptyModalContainer}>
                  <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyModalText}>
                    {itemSearchQuery ? 'No items found' : 'No inventory items available'}
                  </Text>
                  <Text style={styles.emptyModalSubtext}>
                    {itemSearchQuery ? 'Try a different search term' : 'Add items in inventory first'}
                  </Text>
                </View>
              ) : (
                inventoryItems
                  .filter(item =>
                    item.item_name?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                    item.item_code?.toLowerCase().includes(itemSearchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.modalItem}
                      onPress={() => {
                        // Add item with default values
                        const newItem = {
                          inventory_item_id: item.id,
                          item_code: item.item_code,
                          item_name: item.item_name,
                          item_description: item.item_name,
                          quantity: 1,
                          rate: parseFloat(item.selling_price || 0),
                          amount: parseFloat(item.selling_price || 0),
                          hsn_sac_code: item.hsn_code || '',
                          gst_rate: parseFloat(item.gst_rate || 0),
                          cgst_amount: 0,
                          sgst_amount: 0,
                          igst_amount: 0,
                        };
                        
                        // Calculate GST
                        const gstAmount = (newItem.amount * newItem.gst_rate) / 100;
                        newItem.cgst_amount = gstAmount / 2;
                        newItem.sgst_amount = gstAmount / 2;
                        
                        setItems([...items, newItem]);
                        setShowItemModal(false);
                        setItemSearchQuery('');
                      }}
                    >
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemText}>{item.item_name}</Text>
                        {item.item_code && (
                          <Text style={styles.modalItemSubtext}>Code: {item.item_code}</Text>
                        )}
                        <Text style={styles.modalItemSubtext}>
                          Price: ₹{parseFloat(item.selling_price || 0).toFixed(2)}
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color="#3e60ab" />
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Ledger Modal */}
      <Modal
        visible={showCreateLedgerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateLedgerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Supplier</Text>
              <TouchableOpacity onPress={() => setShowCreateLedgerModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent}>
              <View style={styles.modalFormSection}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Supplier Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.ledger_name}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, ledger_name: text })}
                    placeholder="Enter supplier name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>GSTIN</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.gstin}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, gstin: text.toUpperCase() })}
                    placeholder="Enter GSTIN (optional)"
                    maxLength={15}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>PAN</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.pan}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, pan: text.toUpperCase() })}
                    placeholder="Enter PAN (optional)"
                    maxLength={10}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.email}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, email: text })}
                    placeholder="Enter email (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.contact_number}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, contact_number: text })}
                    placeholder="Enter contact number (optional)"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={ledgerForm.address}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, address: text })}
                    placeholder="Enter address (optional)"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.city}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, city: text })}
                    placeholder="Enter city (optional)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.state}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, state: text })}
                    placeholder="Enter state (optional)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.pincode}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, pincode: text })}
                    placeholder="Enter pincode (optional)"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCreateLedgerModal(false)}
                disabled={creatingLedger}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateLedger}
                disabled={creatingLedger}
              >
                <Text style={styles.modalButtonText}>
                  {creatingLedger ? 'Creating...' : 'Create Supplier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Inventory Item Modal */}
      <CreateInventoryItemModal
        visible={showCreateInventoryModal}
        onClose={() => setShowCreateInventoryModal(false)}
        onItemCreated={handleInventoryItemCreated}
      />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formSection: {
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
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  selectButtonText: {
    ...FONT_STYLES.body,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  largeModalContent: {
    maxHeight: '85%',
  },
  modalScrollContent: {
    flex: 1,
  },
  modalFormSection: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    ...FONT_STYLES.body,
    color: '#111827',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  modalActionBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  createCustomerText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    marginLeft: 8,
  },
  createItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  createItemText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    marginLeft: 8,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemSubtext: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyModalText: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyModalSubtext: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#3e60ab',
  },
  modalButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  modalButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
  },
  modalButtonTextSecondary: {
    color: '#3e60ab',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3e60ab',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    ...FONT_STYLES.body,
    color: '#111827',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  infoText: {
    ...FONT_STYLES.caption,
    color: '#3e60ab',
    marginLeft: 8,
    flex: 1,
  },
  requiredInfo: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  requiredInfoText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  buttonPrimary: {
    backgroundColor: '#3e60ab',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  buttonText: {
    ...FONT_STYLES.label,
    color: 'white',
  },
  buttonTextSecondary: {
    color: '#3e60ab',
  },
  // Items Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  addItemButtonText: {
    ...FONT_STYLES.caption,
    color: '#3e60ab',
    marginLeft: 6,
    fontWeight: '600',
  },
  emptyItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyItemsText: {
    ...FONT_STYLES.body,
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyItemsSubtext: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'center',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    ...FONT_STYLES.body,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  itemCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemDetail: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  itemTax: {
    ...FONT_STYLES.caption,
    color: '#059669',
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  totalValue: {
    ...FONT_STYLES.body,
    color: '#111827',
    fontWeight: '600',
  },
  grandTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    marginBottom: 0,
  },
  grandTotalLabel: {
    ...FONT_STYLES.body,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  grandTotalValue: {
    ...FONT_STYLES.body,
    color: '#3e60ab',
    fontWeight: '700',
    fontSize: 16,
  },
  // Search Container Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    ...FONT_STYLES.body,
    flex: 1,
    paddingVertical: 8,
    color: '#111827',
  },
});
