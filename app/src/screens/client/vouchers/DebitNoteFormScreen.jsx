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
import CreateInventoryItemModal from '../../../components/modals/CreateInventoryItemModal';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useVoucher } from '../../../contexts/VoucherContext';
import { voucherAPI, accountingAPI, inventoryAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { useNavigation, useRoute } from '@react-navigation/native';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';
import EInvoiceStatusCard from '../../../components/invoice/EInvoiceStatusCard';
import EInvoiceService from '../../../services/invoice/EInvoiceService';

// Voucher number generation
const generateVoucherNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  
  return `DN${year}${month}${day}${time}`;
};

export default function DebitNoteFormScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Settings and Voucher contexts
  const { 
    eInvoiceEnabled,
    autoGenerateEInvoice
  } = useSettings();
  
  const {
    eInvoiceStatus,
    updateEInvoiceStatus
  } = useVoucher();
  
  const [formData, setFormData] = useState({
    voucher_number: generateVoucherNumber(),
    voucher_date: new Date().toISOString().split('T')[0],
    note_number: '',
    party_ledger_id: '',
    party_name: '',
    reference_invoice: '',
    reason: '',
    narration: '',
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    status: 'draft'
  });

  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Feature-specific loading states
  const [eInvoiceLoading, setEInvoiceLoading] = useState(false);
  
  // Saved voucher ID for post-save operations
  const [savedVoucherId, setSavedVoucherId] = useState(null);
  
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await accountingAPI.ledgers.list({ 
        limit: 1000 
      });
      const data = response.data?.data || response.data || [];
      const ledgersArray = Array.isArray(data) ? data : [];
      
      // Filter for Sundry Creditors (suppliers)
      const supplierLedgers = ledgersArray.filter(ledger => {
        const groupName = ledger.account_group?.name?.toLowerCase() || '';
        const groupName2 = ledger.account_group?.group_name?.toLowerCase() || '';
        return groupName === 'sundry creditors' || groupName2 === 'sundry creditors';
      });
      
      setSuppliers(supplierLedgers);
    } catch (error) {
      console.error('Suppliers fetch error:', error);
      setSuppliers([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await inventoryAPI.items.list({ 
        limit: 100 
      });
      const data = response.data?.data || response.data || [];
      const itemsArray = Array.isArray(data) ? data : [];
      
      setItems(itemsArray);
    } catch (error) {
      console.error('Items fetch error:', error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      setPageLoading(true);
      const startTime = Date.now();
      
      await Promise.all([
        fetchSuppliers(),
        fetchItems()
      ]);
      
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setPageLoading(false);
      }, remainingTime);
    };
    
    initializeForm();
  }, [fetchSuppliers, fetchItems]);

  const handleSupplierSelect = (supplier) => {
    setFormData(prev => ({
      ...prev,
      party_ledger_id: supplier.id,
      party_name: supplier.ledger_name || supplier.name
    }));
    setShowSupplierModal(false);
  };

  const handleAddItem = (item) => {
    const quantity = 1;
    const rate = parseFloat(item.rate || 0);
    const gstRate = parseFloat(item.gst_rate || 0);
    const taxableAmount = quantity * rate;
    const taxAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = taxableAmount + taxAmount;
    
    const newItem = {
      id: Date.now(),
      inventory_item_id: item.id,
      item_name: item.item_name,
      item_description: item.item_name,
      quantity: quantity,
      rate: rate,
      taxable_amount: taxableAmount,
      gst_rate: gstRate.toFixed(2),
      tax_amount: taxAmount,
      total_amount: totalAmount
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    calculateTotals([...formData.items, newItem]);
    setShowItemModal(false);
  };

  const handleSupplierCreated = (newSupplier) => {
    setSuppliers(prev => [newSupplier, ...prev]);
    handleSupplierSelect(newSupplier);
    
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Supplier created and selected successfully'
    });
  };

  const handleItemCreated = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    handleAddItem(newItem);
    
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Item created and added to debit note successfully'
    });
  };

  const handleItemUpdate = (itemId, field, value) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: parseFloat(value) || 0 };
        
        if (field === 'quantity' || field === 'rate') {
          const quantity = updatedItem.quantity;
          const rate = updatedItem.rate;
          const gstRate = parseFloat(updatedItem.gst_rate);
          
          updatedItem.taxable_amount = quantity * rate;
          updatedItem.tax_amount = (updatedItem.taxable_amount * gstRate) / 100;
          updatedItem.total_amount = updatedItem.taxable_amount + updatedItem.tax_amount;
        }
        
        return updatedItem;
      }
      return item;
    });

    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    let subtotal = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const itemTaxable = parseFloat(item.taxable_amount || 0);
      const itemTax = parseFloat(item.tax_amount || 0);
      
      subtotal += itemTaxable;
      taxAmount += itemTax;
    });
    
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  };

  const handleSave = async (status = 'draft') => {
    console.log('\n🚀 === DEBIT NOTE SAVE STARTED ===');
    console.log('📋 Status:', status);

    if (loading) {
      console.log('❌ ALREADY LOADING - PREVENTING DUPLICATE CALL');
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

    if (formData.items.length === 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please add at least one item'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        voucher_type: 'debit_note',
        voucher_number: formData.voucher_number,
        voucher_date: formData.voucher_date,
        note_number: formData.note_number,
        party_ledger_id: formData.party_ledger_id,
        reference_invoice: formData.reference_invoice,
        reason: formData.reason,
        narration: formData.narration,
        subtotal: formData.subtotal,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        status,
        items: formData.items.map(item => ({
          inventory_item_id: item.inventory_item_id,
          item_name: item.item_name,
          item_description: item.item_description,
          quantity: item.quantity,
          rate: item.rate,
          taxable_amount: item.taxable_amount,
          gst_rate: item.gst_rate,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount
        }))
      };

      console.log('\n📤 API Payload:', JSON.stringify(payload, null, 2));
      
      const response = await voucherAPI.debitNote.create(payload);
      
      console.log('✅ API Call Successful');
      console.log('📥 API Response:', JSON.stringify(response.data, null, 2));
      
      // Extract voucher ID from response
      const voucherId = response.data?.data?.id || response.data?.id;
      setSavedVoucherId(voucherId);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Debit note ${status === 'draft' ? 'saved as draft' : 'posted'} successfully`
      });
      
      // Auto-generate e-invoice if enabled
      if (status === 'posted' && voucherId) {
        await handlePostSaveOperations(voucherId);
      }
      
      console.log('🎉 === DEBIT NOTE SAVE COMPLETED ===\n');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('💥 Save Error Details:', error);
      
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save debit note'
      });
      console.log('💔 === DEBIT NOTE SAVE FAILED ===\n');
    } finally {
      setLoading(false);
    }
  };

  // Handle post-save operations (e-invoice)
  const handlePostSaveOperations = async (voucherId) => {
    console.log('\n🔄 === POST-SAVE OPERATIONS STARTED ===');
    console.log('📋 Voucher ID:', voucherId);
    console.log('📋 E-Invoice Enabled:', eInvoiceEnabled);
    
    // Auto-generate e-invoice if enabled
    if (eInvoiceEnabled && autoGenerateEInvoice) {
      try {
        console.log('📄 Generating e-invoice...');
        setEInvoiceLoading(true);
        const eInvoiceResult = await EInvoiceService.generateEInvoice({
          voucherId: voucherId,
          voucherType: 'DEBIT_NOTE'
        });
        updateEInvoiceStatus(eInvoiceResult);
        console.log('✅ E-Invoice generated successfully');
        showNotification({
          type: 'success',
          title: 'E-Invoice Generated',
          message: `IRN: ${eInvoiceResult.irn || 'Pending'}`
        });
      } catch (error) {
        console.error('❌ E-Invoice generation failed:', error);
        showNotification({
          type: 'error',
          title: 'E-Invoice Failed',
          message: error.message || 'Failed to generate e-invoice'
        });
      } finally {
        setEInvoiceLoading(false);
      }
    }
    
    console.log('✅ === POST-SAVE OPERATIONS COMPLETED ===\n');
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.ledger_name || supplier.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    (item.item_name || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // E-Invoice handlers
  const handleEInvoiceGenerate = async () => {
    if (!savedVoucherId) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please save the debit note first'
      });
      return;
    }

    try {
      setEInvoiceLoading(true);
      const result = await EInvoiceService.generateEInvoice({
        voucherId: savedVoucherId,
        voucherType: 'DEBIT_NOTE'
      });
      updateEInvoiceStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'E-Invoice generated successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to generate e-invoice'
      });
    } finally {
      setEInvoiceLoading(false);
    }
  };

  const handleEInvoiceCancel = async (reason, reasonCode) => {
    if (!eInvoiceStatus?.irn) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No IRN found to cancel'
      });
      return;
    }

    try {
      setEInvoiceLoading(true);
      const result = await EInvoiceService.cancelEInvoice({
        voucherId: savedVoucherId,
        irn: eInvoiceStatus.irn,
        reason,
        reasonCode
      });
      updateEInvoiceStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'E-Invoice cancelled successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to cancel e-invoice'
      });
    } finally {
      setEInvoiceLoading(false);
    }
  };

  const handleEInvoiceRetry = async () => {
    if (!eInvoiceStatus?.id) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No e-invoice record found to retry'
      });
      return;
    }

    try {
      setEInvoiceLoading(true);
      const result = await EInvoiceService.retryEInvoiceGeneration(eInvoiceStatus.id);
      updateEInvoiceStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'E-Invoice retry initiated'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to retry e-invoice generation'
      });
    } finally {
      setEInvoiceLoading(false);
    }
  };

  const renderSupplierItem = ({ item }) => (
    <TouchableOpacity
      style={styles.supplierItem}
      onPress={() => handleSupplierSelect(item)}
    >
      <View style={styles.supplierContent}>
        <Text style={styles.supplierName}>
          {item.ledger_name || item.name || 'Unnamed Supplier'}
        </Text>
        
        {item.account_group?.name && (
          <Text style={styles.supplierGroup}>
            {item.account_group.name}
          </Text>
        )}
        
        {item.contact_number && (
          <Text style={styles.supplierContact}>📞 {item.contact_number}</Text>
        )}
        {item.email && (
          <Text style={styles.supplierContact}>✉️ {item.email}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  const renderItemOption = ({ item }) => (
    <TouchableOpacity
      style={styles.itemOption}
      onPress={() => handleAddItem(item)}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.item_name || item.name}</Text>
        <Text style={styles.itemDetails}>
          Rate: {formatCurrency(item.rate || 0)} | GST: {item.gst_rate || 0}%
        </Text>
        {item.hsn_code && (
          <Text style={styles.itemHsn}>HSN: {item.hsn_code}</Text>
        )}
      </View>
      <Ionicons name="add-circle" size={20} color="#10b981" />
    </TouchableOpacity>
  );

  const renderInvoiceItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id)}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.itemInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Qty</Text>
          <TextInput
            style={styles.itemInput}
            value={item.quantity.toString()}
            onChangeText={(value) => handleItemUpdate(item.id, 'quantity', value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Rate</Text>
          <TextInput
            style={styles.itemInput}
            value={item.rate.toString()}
            onChangeText={(value) => handleItemUpdate(item.id, 'rate', value)}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tax %</Text>
          <Text style={styles.itemValue}>{item.gst_rate}%</Text>
        </View>
      </View>
      
      <View style={styles.itemTotals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount:</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.taxable_amount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax:</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.tax_amount)}</Text>
        </View>
        <View style={[styles.totalRow, styles.finalTotal]}>
          <Text style={styles.finalTotalLabel}>Total:</Text>
          <Text style={styles.finalTotalValue}>{formatCurrency(item.total_amount)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TopBar 
        title="Debit Note" 
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
                  <Text style={styles.headerTitle}>Debit Note</Text>
                  <Text style={styles.headerSubtitle}>Create new debit note</Text>
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
                  <Text style={styles.inputLabel}>Note Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.note_number}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, note_number: value }))}
                    placeholder="Enter note number"
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
                <Text style={styles.inputLabel}>Supplier *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput]}
                  onPress={() => setShowSupplierModal(true)}
                >
                  <Text style={[styles.inputText, !formData.party_name && styles.placeholder]}>
                    {formData.party_name || 'Select Supplier'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reference Invoice</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reference_invoice}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, reference_invoice: value }))}
                  placeholder="Enter reference invoice number"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reason}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                  placeholder="Enter reason for debit note"
                />
              </View>
            </View>

            {/* Items Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Items</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowItemModal(true)}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {formData.items.length === 0 ? (
                <View style={styles.emptyItems}>
                  <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyItemsText}>No items added</Text>
                  <Text style={styles.emptyItemsSubtext}>Tap "Add Item" to get started</Text>
                </View>
              ) : (
                <FlatList
                  data={formData.items}
                  renderItem={renderInvoiceItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  contentContainerStyle={styles.itemsList}
                />
              )}
            </View>

            {/* Totals Section */}
            {formData.items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Debit Note Summary</Text>
                <View style={styles.totalsCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(formData.subtotal)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax Amount:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(formData.tax_amount)}</Text>
                  </View>
                  <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.grandTotalLabel}>Total Amount:</Text>
                    <Text style={styles.grandTotalValue}>{formatCurrency(formData.total_amount)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* E-Invoice Status Card - Conditional */}
            {eInvoiceEnabled && savedVoucherId && eInvoiceStatus && (
              <EInvoiceStatusCard
                status={eInvoiceStatus}
                onGenerate={handleEInvoiceGenerate}
                onCancel={handleEInvoiceCancel}
                onRetry={handleEInvoiceRetry}
                loading={eInvoiceLoading}
              />
            )}

            {/* Loading Indicator for E-Invoice */}
            {eInvoiceLoading && (
              <View style={styles.operationLoadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.operationLoadingText}>
                  Generating e-invoice...
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
                  {loading ? 'Posting...' : 'Post Debit Note'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

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
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowSupplierModal(false);
                  setShowCreateLedgerModal(true);
                }}
                style={styles.addSupplierButton}
              >
                <Ionicons name="add" size={20} color="#3e60ab" />
                <Text style={styles.addSupplierText}>Add Supplier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSupplierModal(false)}
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
              placeholder="Search suppliers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredSuppliers}
            renderItem={renderSupplierItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No suppliers found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {suppliers.length === 0 
                    ? 'Create a new supplier to get started' 
                    : 'Try a different search term'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Item Selection Modal */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowItemModal(false);
                  setShowCreateItemModal(true);
                }}
                style={styles.addSupplierButton}
              >
                <Ionicons name="add" size={20} color="#3e60ab" />
                <Text style={styles.addSupplierText}>Add Item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowItemModal(false)}
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
              placeholder="Search items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredItems}
            renderItem={renderItemOption}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.modalList}
          />
        </View>
      </Modal>

      {/* Create Inventory Item Modal */}
      <CreateInventoryItemModal
        visible={showCreateItemModal}
        onClose={() => setShowCreateItemModal(false)}
        onItemCreated={handleItemCreated}
        title="Create New Item"
      />

      {/* Create Supplier Modal */}
      <CreateLedgerModal
        visible={showCreateLedgerModal}
        onClose={() => setShowCreateLedgerModal(false)}
        onLedgerCreated={handleSupplierCreated}
        title="Create New Supplier"
        accountGroupFilter="Sundry Creditors"
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
    backgroundColor: '#ef4444',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    ...FONT_STYLES.label,
    color: 'white'
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyItemsText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    marginTop: 12
  },
  emptyItemsSubtext: {
    ...FONT_STYLES.label,
    color: '#9ca3af',
    marginTop: 4
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    flex: 1
  },
  removeButton: {
    padding: 4,
  },
  itemInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemInput: {
    ...FONT_STYLES.label,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    color: '#111827',
    backgroundColor: 'white',
    textAlign: 'center'
  },
  itemValue: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 8
  },
  itemTotals: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  totalLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  totalValue: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
    marginTop: 4,
  },
  finalTotalLabel: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  finalTotalValue: {
    ...FONT_STYLES.label,
    color: '#ef4444'
  },
  totalsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: '#ef4444',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  grandTotalValue: {
    ...FONT_STYLES.h5,
    color: '#ef4444'
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
    backgroundColor: '#ef4444',
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
  addSupplierButton: {
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
  addSupplierText: {
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
  supplierItem: {
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
  supplierContent: {
    flex: 1,
  },
  supplierName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  supplierGroup: {
    ...FONT_STYLES.caption,
    color: '#3b82f6',
    marginBottom: 4
  },
  supplierContact: {
    ...FONT_STYLES.caption,
    color: '#6b7280'
  },
  itemOption: {
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
  itemContent: {
    flex: 1,
  },
  itemDetails: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginBottom: 2
  },
  itemHsn: {
    ...FONT_STYLES.caption,
    color: '#9ca3af'
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
