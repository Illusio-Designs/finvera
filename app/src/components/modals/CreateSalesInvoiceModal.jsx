import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotification } from '../../contexts/NotificationContext';
import { voucherAPI, accountingAPI, inventoryAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';

export default function CreateSalesInvoiceModal({ 
  visible, 
  onClose, 
  onInvoiceCreated,
  defaultVoucherType = 'sales_invoice'
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    voucher_type: defaultVoucherType,
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    reference_number: '',
    narration: '',
    total_amount: 0,
    status: 'draft',
    due_date: '',
    // Export Invoice fields
    currency_code: 'INR',
    exchange_rate: '',
    shipping_bill_number: '',
    shipping_bill_date: '',
    port_of_loading: '',
    destination_country: '',
    has_lut: false,
    // Delivery Challan fields
    purpose: '',
    // Proforma Invoice fields
    validity_period: '',
    valid_until: '',
    // Transport/E-Way Bill fields
    vehicle_no: '',
    transporter_id: '',
    transporter_name: '',
    transport_mode: 'road',
    distance: '',
  });
  
  const [ledgers, setLedgers] = useState([]);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Items state
  const [items, setItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  
  // Modal states
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showShippingDatePicker, setShowShippingDatePicker] = useState(false);
  const [showValidUntilPicker, setShowValidUntilPicker] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [showTransportModeModal, setShowTransportModeModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  
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
    { label: 'Sales Invoice', value: 'sales_invoice' },
    { label: 'Tax Invoice', value: 'tax_invoice' },
    { label: 'Bill of Supply', value: 'bill_of_supply' },
    { label: 'Retail Invoice', value: 'retail_invoice' },
    { label: 'Export Invoice', value: 'export_invoice' },
    { label: 'Proforma Invoice', value: 'proforma_invoice' },
    { label: 'Delivery Challan', value: 'delivery_challan' },
    { label: 'Purchase Invoice', value: 'purchase_invoice' },
    { label: 'Credit Note', value: 'credit_note' },
    { label: 'Debit Note', value: 'debit_note' },
    { label: 'Payment', value: 'payment' },
    { label: 'Receipt', value: 'receipt' },
    { label: 'Journal', value: 'journal' },
    { label: 'Contra', value: 'contra' },
  ];

  const purposes = [
    { label: 'Job Work', value: 'job_work' },
    { label: 'Stock Transfer', value: 'stock_transfer' },
    { label: 'Sample', value: 'sample' },
  ];

  const transportModes = [
    { label: 'Road', value: 'road' },
    { label: 'Rail', value: 'rail' },
    { label: 'Air', value: 'air' },
    { label: 'Ship', value: 'ship' },
  ];

  // Fetch customer/party ledgers and inventory on mount
  useEffect(() => {
    if (visible) {
      fetchLedgers();
      fetchInventory();
    }
  }, [visible]);

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const response = await accountingAPI.ledgers.list({ 
        limit: 1000,
        // Filter for customer/party ledgers (Sundry Debtors group)
      });
      const data = response?.data?.data || response?.data || [];
      setLedgers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch ledgers error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load customer list'
      });
    } finally {
      setLoadingLedgers(false);
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

  const handleCreateLedger = async () => {
    try {
      setCreatingLedger(true);
      
      // Validate required fields
      if (!ledgerForm.ledger_name.trim()) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter customer name'
        });
        return;
      }

      // Create ledger - need to get account_group_id for Sundry Debtors
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
        opening_balance_type: 'Dr',
      };

      const response = await accountingAPI.ledgers.create(ledgerData);
      const newLedger = response?.data?.data || response?.data;
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Customer created successfully'
      });
      
      // Refresh ledgers list
      await fetchLedgers();
      
      // Select the newly created ledger
      if (newLedger?.id) {
        setFormData({ ...formData, party_ledger_id: newLedger.id });
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
      setShowCustomerModal(false);
      
    } catch (error) {
      console.error('Create ledger error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create customer'
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
      if (!formData.voucher_type) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select invoice type'
        });
        return;
      }

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
          message: 'Please select a customer'
        });
        return;
      }

      // Create voucher - backend will auto-generate voucher_number
      const voucherData = {
        voucher_type: formData.voucher_type,
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        reference_number: formData.reference_number || null,
        narration: formData.narration || null,
        status: formData.status,
        total_amount: formData.total_amount || 0,
        items: [], // Empty items for now
        ledger_entries: [], // Empty ledger entries for now
      };

      const response = await voucherAPI.create(voucherData);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `${getInvoiceTypeLabel()} created successfully`
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
        message: error.response?.data?.message || 'Failed to create invoice'
      });
    } finally {
      setLoading(false);
    }
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

  const handleShippingDateChange = (event, selectedDate) => {
    setShowShippingDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, shipping_bill_date: dateString });
    }
  };

  const handleValidUntilChange = (event, selectedDate) => {
    setShowValidUntilPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, valid_until: dateString });
    }
  };

  const getInvoiceTypeLabel = () => {
    const type = invoiceTypes.find(t => t.value === formData.voucher_type);
    return type ? type.label : 'Select Invoice Type';
  };

  const getCustomerLabel = () => {
    if (!formData.party_ledger_id) return 'Select Customer';
    const ledger = ledgers.find(l => l.id === formData.party_ledger_id);
    return ledger ? ledger.ledger_name : 'Select Customer';
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
  const isExportInvoice = formData.voucher_type === 'export_invoice';
  const isDeliveryChallan = formData.voucher_type === 'delivery_challan';
  const isProformaInvoice = formData.voucher_type === 'proforma_invoice';
  const needsTransportDetails = ['sales_invoice', 'tax_invoice', 'export_invoice', 'delivery_challan'].includes(formData.voucher_type);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Sales Invoice</Text>
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
              <Text style={styles.selectButtonText}>{formData.voucher_date}</Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Customer Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Customer *</Text>
            {loadingLedgers ? (
              <View style={[styles.selectButton, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#3e60ab" />
                <Text style={styles.loadingText}>Loading customers...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowCustomerModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !formData.party_ledger_id && styles.placeholderText
                ]}>
                  {getCustomerLabel()}
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
                  {formData.due_date || 'Select due date (optional)'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Export Invoice Fields */}
        {isExportInvoice && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Export Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Currency Code</Text>
              <TextInput
                style={styles.input}
                value={formData.currency_code}
                onChangeText={(text) => setFormData({ ...formData, currency_code: text.toUpperCase()})}
                placeholder="USD, EUR, GBP, etc."
                maxLength={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Exchange Rate</Text>
              <TextInput
                style={styles.input}
                value={formData.exchange_rate}
                onChangeText={(text) => setFormData({ ...formData, exchange_rate: text })}
                placeholder="Enter exchange rate"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Shipping Bill Number</Text>
              <TextInput
                style={styles.input}
                value={formData.shipping_bill_number}
                onChangeText={(text) => setFormData({ ...formData, shipping_bill_number: text })}
                placeholder="Enter shipping bill number"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Shipping Bill Date</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowShippingDatePicker(true)}
              >
                <Text style={[styles.selectButtonText, !formData.shipping_bill_date && styles.placeholderText]}>
                  {formData.shipping_bill_date || 'Select shipping bill date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Port of Loading</Text>
              <TextInput
                style={styles.input}
                value={formData.port_of_loading}
                onChangeText={(text) => setFormData({ ...formData, port_of_loading: text })}
                placeholder="Enter port of loading"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Destination Country</Text>
              <TextInput
                style={styles.input}
                value={formData.destination_country}
                onChangeText={(text) => setFormData({ ...formData, destination_country: text })}
                placeholder="Enter destination country"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, has_lut: !formData.has_lut })}
                >
                  {formData.has_lut && <Ionicons name="checkmark" size={18} color="#3e60ab" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Export under LUT (Letter of Undertaking)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Delivery Challan Fields */}
        {isDeliveryChallan && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Delivery Challan Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Purpose *</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowPurposeModal(true)}
              >
                <Text style={[styles.selectButtonText, !formData.purpose && styles.placeholderText]}>
                  {getPurposeLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Proforma Invoice Fields */}
        {isProformaInvoice && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Proforma Invoice Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Validity Period (days)</Text>
              <TextInput
                style={styles.input}
                value={formData.validity_period}
                onChangeText={(text) => setFormData({ ...formData, validity_period: text })}
                placeholder="Enter validity period in days"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Valid Until</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowValidUntilPicker(true)}
              >
                <Text style={[styles.selectButtonText, !formData.valid_until && styles.placeholderText]}>
                  {formData.valid_until || 'Select valid until date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Transport Details (for sales invoices, export, delivery challan) */}
        {needsTransportDetails && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Transport Details (Optional)</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Vehicle Number</Text>
              <TextInput
                style={styles.input}
                value={formData.vehicle_no}
                onChangeText={(text) => setFormData({ ...formData, vehicle_no: text.toUpperCase() })}
                placeholder="Enter vehicle number"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Transporter GSTIN</Text>
              <TextInput
                style={styles.input}
                value={formData.transporter_id}
                onChangeText={(text) => setFormData({ ...formData, transporter_id: text.toUpperCase() })}
                placeholder="Enter transporter GSTIN"
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Transporter Name</Text>
              <TextInput
                style={styles.input}
                value={formData.transporter_name}
                onChangeText={(text) => setFormData({ ...formData, transporter_name: text })}
                placeholder="Enter transporter name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Transport Mode</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowTransportModeModal(true)}
              >
                <Text style={styles.selectButtonText}>{getTransportModeLabel()}</Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Distance (km)</Text>
              <TextInput
                style={styles.input}
                value={formData.distance}
                onChangeText={(text) => setFormData({ ...formData, distance: text })}
                placeholder="Enter distance in kilometers"
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3e60ab" />
          <Text style={styles.infoText}>
            Basic voucher created. Full form with items, taxes, and calculations coming soon.
          </Text>
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

      {/* Shipping Date Picker */}
      {showShippingDatePicker && (
        <DateTimePicker
          value={formData.shipping_bill_date ? new Date(formData.shipping_bill_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleShippingDateChange}
        />
      )}

      {/* Valid Until Date Picker */}
      {showValidUntilPicker && (
        <DateTimePicker
          value={formData.valid_until ? new Date(formData.valid_until) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleValidUntilChange}
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

      {/* Customer Modal */}
      <Modal
        visible={showCustomerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {/* Create Customer Button */}
            <View style={styles.modalActionBar}>
              <TouchableOpacity 
                style={styles.createCustomerButton}
                onPress={() => {
                  setShowCustomerModal(false);
                  setShowCreateLedgerModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color="#3e60ab" />
                <Text style={styles.createCustomerText}>Create New Customer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {ledgers.length === 0 ? (
                <View style={styles.emptyModalContainer}>
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyModalText}>No customers found</Text>
                  <Text style={styles.emptyModalSubtext}>Create a customer to get started</Text>
                </View>
              ) : (
                ledgers.map((ledger) => (
                  <TouchableOpacity
                    key={ledger.id}
                    style={[
                      styles.modalItem,
                      formData.party_ledger_id === ledger.id && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, party_ledger_id: ledger.id });
                      setShowCustomerModal(false);
                    }}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[
                        styles.modalItemText,
                        formData.party_ledger_id === ledger.id && styles.modalItemTextSelected
                      ]}>
                        {ledger.ledger_name}
                      </Text>
                      {ledger.gstin && (
                        <Text style={styles.modalItemSubtext}>GSTIN: {ledger.gstin}</Text>
                      )}
                    </View>
                    {formData.party_ledger_id === ledger.id && (
                      <Ionicons name="checkmark" size={20} color="#3e60ab" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Purpose Modal */}
      <Modal
        visible={showPurposeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPurposeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Purpose</Text>
              <TouchableOpacity onPress={() => setShowPurposeModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {purposes.map((purpose) => (
                <TouchableOpacity
                  key={purpose.value}
                  style={[
                    styles.modalItem,
                    formData.purpose === purpose.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, purpose: purpose.value });
                    setShowPurposeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.purpose === purpose.value && styles.modalItemTextSelected
                  ]}>
                    {purpose.label}
                  </Text>
                  {formData.purpose === purpose.value && (
                    <Ionicons name="checkmark" size={20} color="#3e60ab" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Transport Mode Modal */}
      <Modal
        visible={showTransportModeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransportModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Transport Mode</Text>
              <TouchableOpacity onPress={() => setShowTransportModeModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {transportModes.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.modalItem,
                    formData.transport_mode === mode.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, transport_mode: mode.value });
                    setShowTransportModeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.transport_mode === mode.value && styles.modalItemTextSelected
                  ]}>
                    {mode.label}
                  </Text>
                  {formData.transport_mode === mode.value && (
                    <Ionicons name="checkmark" size={20} color="#3e60ab" />
                  )}
                </TouchableOpacity>
              ))}
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
              <Text style={styles.modalTitle}>Create New Customer</Text>
              <TouchableOpacity onPress={() => setShowCreateLedgerModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent}>
              <View style={styles.modalFormSection}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Customer Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={ledgerForm.ledger_name}
                    onChangeText={(text) => setLedgerForm({ ...ledgerForm, ledger_name: text })}
                    placeholder="Enter customer name"
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
                  {creatingLedger ? 'Creating...' : 'Create Customer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
});
