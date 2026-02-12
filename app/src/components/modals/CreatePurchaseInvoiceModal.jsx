import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { voucherAPI, accountingAPI, inventoryAPI } from '../../lib/api';
import { FONT_STYLES } from '../../utils/fonts';
import CreateInventoryItemModal from './CreateInventoryItemModal';
import CreateLedgerModal from './CreateLedgerModal';
import ModernDatePicker from '../ui/ModernDatePicker';

export default function CreatePurchaseInvoiceModal({ 
  visible, 
  onClose, 
  onInvoiceCreated,
  defaultVoucherType = 'purchase_invoice',
  editData = null,
  isEdit = false
}) {
  const { showNotification } = useNotification();
  const { showDangerConfirmation } = useConfirmation();
  
  const [formData, setFormData] = useState({
    voucher_type: defaultVoucherType,
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    reference_number: '',
    supplier_invoice_number: '',
    supplier_invoice_date: '',
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
  const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({
    inventory_item_id: null,
    item_name: '',
    item_code: '',
    hsn_sac_code: '',
    quantity: '1',
    rate: '0',
    gst_rate: '0',
  });

  // Debug: Log when Add Item modal visibility changes
  useEffect(() => {
    if (showAddItemModal) {
      console.log('Add Item Modal opened with form:', itemForm);
    }
  }, [showAddItemModal]);
  
  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  
  const invoiceTypes = [
    { label: 'Purchase Invoice', value: 'purchase_invoice' },
  ];

  // Fetch suppliers and inventory on mount and reset/populate form when modal opens
  useEffect(() => {
    if (visible) {
      if (isEdit && editData) {
        // Populate form with edit data
        setFormData({
          voucher_type: editData.voucher_type || defaultVoucherType,
          voucher_date: editData.voucher_date || new Date().toISOString().split('T')[0],
          party_ledger_id: editData.party_ledger_id || '',
          reference_number: editData.reference_number || '',
          supplier_invoice_number: editData.supplier_invoice_number || '',
          supplier_invoice_date: editData.supplier_invoice_date || '',
          narration: editData.narration || '',
          total_amount: editData.total_amount || 0,
          status: editData.status || 'draft',
          place_of_supply: editData.place_of_supply || 'Maharashtra',
          is_reverse_charge: editData.is_reverse_charge || false,
        });
        
        // Populate items if available
        if (editData.items && Array.isArray(editData.items)) {
          setItems(editData.items.map(item => ({
            inventory_item_id: item.inventory_item_id || null,
            item_code: item.item_code || '',
            item_name: item.item_name || item.item_description || '',
            item_description: item.item_description || item.item_name || '',
            hsn_sac_code: item.hsn_sac_code || '',
            quantity: String(item.quantity || 1),
            rate: String(item.rate || 0),
            gst_rate: String(item.gst_rate || 0),
            amount: item.amount || (item.quantity * item.rate) || 0,
          })));
        } else {
          setItems([]);
        }
      } else {
        // Reset form data for new invoice
        setFormData({
          voucher_type: defaultVoucherType,
          voucher_date: new Date().toISOString().split('T')[0],
          party_ledger_id: '',
          reference_number: '',
          supplier_invoice_number: '',
          supplier_invoice_date: '',
          narration: '',
          total_amount: 0,
          status: 'draft',
          place_of_supply: 'Maharashtra',
          is_reverse_charge: false,
        });
        
        // Reset items
        setItems([]);
      }
      
      // Fetch data
      fetchSuppliers();
      fetchInventory();
    }
  }, [visible, isEdit, editData]);

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
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleInventoryItemCreated = async (newItem) => {
    // Refresh inventory list
    await fetchInventory();
    
    // Pre-fill the form with the new item
    if (newItem) {
      setItemForm({
        inventory_item_id: newItem.id,
        item_name: newItem.item_name,
        item_code: newItem.item_code || '',
        hsn_sac_code: newItem.hsn_sac_code || '',
        quantity: '1',
        rate: String(parseFloat(newItem.purchase_price || newItem.avg_cost || 0)),
        gst_rate: String(parseFloat(newItem.gst_rate || 0)),
      });
      setShowCreateInventoryModal(false);
      setShowAddItemModal(true);
    }
  };

  const handleSelectInventoryItem = (item) => {
    console.log('Selected inventory item:', item);
    const formData = {
      inventory_item_id: item.id,
      item_name: item.item_name || '',
      item_code: item.item_code || '',
      hsn_sac_code: item.hsn_sac_code || '',
      quantity: '1',
      rate: String(parseFloat(item.purchase_price || item.avg_cost || 0)),
      gst_rate: String(parseFloat(item.gst_rate || 0)),
    };
    console.log('Setting item form:', formData);
    setItemForm(formData);
    setShowItemSelectionModal(false);
    // Use setTimeout to ensure state is updated before opening modal
    setTimeout(() => {
      setShowAddItemModal(true);
    }, 100);
  };

  const handleAddItem = () => {
    setItemSearchQuery('');
    setShowItemSelectionModal(true);
  };

  const handleCreateNewItem = () => {
    setShowItemSelectionModal(false);
    setShowCreateInventoryModal(true);
  };

  const handleManualAddItem = () => {
    const newForm = {
      inventory_item_id: null,
      item_name: '',
      item_code: '',
      hsn_sac_code: '',
      quantity: '1',
      rate: '0',
      gst_rate: '0',
    };
    console.log('Manual add - setting form:', newForm);
    setItemForm(newForm);
    setShowItemSelectionModal(false);
    // Use setTimeout to ensure state is updated before opening modal
    setTimeout(() => {
      setShowAddItemModal(true);
    }, 100);
  };

  const handleSaveItem = () => {
    // Validate
    if (!itemForm.item_name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter item name'
      });
      return;
    }

    const quantity = parseFloat(itemForm.quantity);
    const rate = parseFloat(itemForm.rate);
    const gstRate = parseFloat(itemForm.gst_rate);

    if (!quantity || quantity <= 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid quantity'
      });
      return;
    }

    if (!rate || rate < 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid rate'
      });
      return;
    }

    const amount = quantity * rate;
    const gstAmount = (amount * gstRate) / 100;

    const newItem = {
      inventory_item_id: itemForm.inventory_item_id || null,
      item_code: itemForm.item_code || null,
      item_name: itemForm.item_name,
      item_description: itemForm.item_name,
      hsn_sac_code: itemForm.hsn_sac_code || null,
      quantity: quantity,
      rate: rate,
      amount: amount,
      gst_rate: gstRate,
      cgst_amount: gstAmount / 2,
      sgst_amount: gstAmount / 2,
      igst_amount: 0,
    };

    if (editingItemIndex !== null) {
      // Update existing item
      const newItems = [...items];
      newItems[editingItemIndex] = newItem;
      setItems(newItems);
      setEditingItemIndex(null);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }

    setShowAddItemModal(false);
    setItemForm({
      inventory_item_id: null,
      item_name: '',
      item_code: '',
      hsn_sac_code: '',
      quantity: '1',
      rate: '0',
      gst_rate: '0',
    });
  };

  const handleEditItem = (index) => {
    const item = items[index];
    setItemForm({
      inventory_item_id: item.inventory_item_id || null,
      item_name: item.item_name || item.item_description,
      item_code: item.item_code || '',
      hsn_sac_code: item.hsn_sac_code || '',
      quantity: String(item.quantity),
      rate: String(item.rate),
      gst_rate: String(item.gst_rate),
    });
    setEditingItemIndex(index);
    setShowAddItemModal(true);
  };

  const handleCreateLedger = async (newLedger) => {
    try {
      // Refresh suppliers list
      await fetchSuppliers();
      
      // Select the newly created ledger
      if (newLedger?.id) {
        setFormData({ ...formData, party_ledger_id: newLedger.id, place_of_supply: newLedger.state || 'Maharashtra' });
      }
      
      // Close modals
      setShowCreateLedgerModal(false);
      setShowSupplierModal(false);
      
    } catch (error) {
      console.error('Error after ledger creation:', error);
    }
  };

  const handleBack = () => {
    onClose();
  };

  const handleSave = async () => {
    await saveInvoice('draft');
  };

  const handlePost = async () => {
    await saveInvoice('posted');
  };

  const saveInvoice = async (status) => {
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

      if (!formData.supplier_invoice_number) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter supplier invoice number'
        });
        return;
      }

      if (!formData.supplier_invoice_date) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select supplier invoice date'
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

      // Create/Update purchase invoice
      const voucherData = {
        voucher_type: 'purchase_invoice',
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        reference: formData.reference_number || null,
        supplier_invoice_number: formData.supplier_invoice_number,
        supplier_invoice_date: formData.supplier_invoice_date,
        narration: formData.narration || null,
        place_of_supply: formData.place_of_supply,
        is_reverse_charge: formData.is_reverse_charge || false,
        status: status,
        items: items.map(item => ({
          inventory_item_id: item.inventory_item_id,
          item_code: item.item_code,
          item_description: item.item_description,
          item_name: item.item_name,
          hsn_sac_code: item.hsn_sac_code,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          gst_rate: parseFloat(item.gst_rate),
        })),
      };

      let response;
      if (isEdit && editData) {
        response = await voucherAPI.purchaseInvoice.update(editData.id, voucherData);
      } else {
        response = await voucherAPI.purchaseInvoice.create(voucherData);
      }
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Purchase Invoice ${isEdit ? 'updated' : status === 'posted' ? 'posted' : 'saved as draft'} successfully`
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
          <Text style={styles.title}>{isEdit ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}</Text>
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
            <ModernDatePicker
              label="Date *"
              value={formData.voucher_date}
              onDateChange={(date) => setFormData({ ...formData, voucher_date: date })}
              placeholder="Select date"
            />
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

          {/* Supplier Invoice Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Supplier Invoice Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier_invoice_number}
              onChangeText={(text) => setFormData({ ...formData, supplier_invoice_number: text })}
              placeholder="Enter supplier invoice number"
            />
          </View>

          {/* Supplier Invoice Date */}
          <View style={styles.formGroup}>
            <ModernDatePicker
              label="Supplier Invoice Date *"
              value={formData.supplier_invoice_date}
              onDateChange={(date) => setFormData({ ...formData, supplier_invoice_date: date })}
              placeholder="Select supplier invoice date"
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
              <ModernDatePicker
                label="Due Date"
                value={formData.due_date}
                onDateChange={(date) => setFormData({ ...formData, due_date: date })}
                placeholder="Select due date (optional)"
              />
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
                onPress={handleAddItem}
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
                      <View style={styles.itemHeaderLeft}>
                        <Text style={styles.itemName}>{item.item_description}</Text>
                        {item.item_code && (
                          <Text style={styles.itemCode}>Code: {item.item_code}</Text>
                        )}
                      </View>
                      <View style={styles.itemHeaderActions}>
                        <TouchableOpacity 
                          style={styles.itemActionButton}
                          onPress={() => handleEditItem(index)}
                        >
                          <Ionicons name="create-outline" size={18} color="#3e60ab" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.itemActionButton}
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
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.itemCardBody}>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemLabel}>Quantity:</Text>
                        <Text style={styles.itemValue}>{item.quantity}</Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemLabel}>Rate:</Text>
                        <Text style={styles.itemValue}>₹{parseFloat(item.rate || 0).toFixed(2)}</Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemLabel}>Amount:</Text>
                        <Text style={styles.itemValue}>₹{parseFloat(item.amount || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                    {item.gst_rate > 0 && (
                      <View style={styles.itemTaxRow}>
                        <Text style={styles.itemTax}>GST {item.gst_rate}%</Text>
                        <Text style={styles.itemTaxAmount}>
                          ₹{(parseFloat(item.cgst_amount || 0) + parseFloat(item.sgst_amount || 0)).toFixed(2)}
                        </Text>
                      </View>
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
          style={[styles.button, styles.buttonOutline]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>
            {loading ? 'Saving...' : 'Save Draft'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]}
          onPress={handlePost}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

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

      {/* Create Ledger Modal */}
      <CreateLedgerModal
        visible={showCreateLedgerModal}
        onClose={() => setShowCreateLedgerModal(false)}
        onSuccess={handleCreateLedger}
        defaultAccountGroupFilter="supplier"
        title="Create New Supplier"
      />

      {/* Item Selection Modal */}
      <Modal
        visible={showItemSelectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowItemSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Item</Text>
              <TouchableOpacity onPress={() => setShowItemSelectionModal(false)}>
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

            {/* Action Buttons */}
            <View style={styles.modalActionBar}>
              <TouchableOpacity 
                style={styles.createItemButton}
                onPress={handleCreateNewItem}
              >
                <Ionicons name="add-circle" size={20} color="#3e60ab" />
                <Text style={styles.createItemText}>Create New Item</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.manualAddButton}
                onPress={handleManualAddItem}
              >
                <Ionicons name="create-outline" size={20} color="#059669" />
                <Text style={styles.manualAddText}>Add Manually</Text>
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
                    {itemSearchQuery ? 'No items found' : 'No inventory items'}
                  </Text>
                  <Text style={styles.emptyModalSubtext}>
                    {itemSearchQuery ? 'Try a different search' : 'Create a new item to get started'}
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
                      onPress={() => handleSelectInventoryItem(item)}
                    >
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemText}>{item.item_name}</Text>
                        {item.item_code && (
                          <Text style={styles.modalItemSubtext}>Code: {item.item_code}</Text>
                        )}
                        <Text style={styles.modalItemSubtext}>
                          Stock: {parseFloat(item.actual_stock || item.quantity_on_hand || 0).toFixed(2)} • 
                          Price: ₹{parseFloat(item.purchase_price || item.avg_cost || 0).toFixed(2)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddItemModal(false);
          setEditingItemIndex(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItemIndex !== null ? 'Edit Item' : 'Add Item'}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddItemModal(false);
                setEditingItemIndex(null);
              }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollContent} 
              contentContainerStyle={styles.modalScrollContentContainer}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <View style={styles.modalFormSection}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Item Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.item_name}
                    onChangeText={(text) => setItemForm({ ...itemForm, item_name: text })}
                    placeholder="Enter item name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Item Code</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.item_code}
                    onChangeText={(text) => setItemForm({ ...itemForm, item_code: text })}
                    placeholder="Enter item code (optional)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>HSN/SAC Code</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.hsn_sac_code}
                    onChangeText={(text) => setItemForm({ ...itemForm, hsn_sac_code: text })}
                    placeholder="Enter HSN/SAC code (optional)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.quantity}
                    onChangeText={(text) => setItemForm({ ...itemForm, quantity: text })}
                    placeholder="Enter quantity"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Rate (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.rate}
                    onChangeText={(text) => setItemForm({ ...itemForm, rate: text })}
                    placeholder="Enter rate"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Amount (₹)</Text>
                  <Text style={styles.readOnlyText}>
                    ₹{(parseFloat(itemForm.quantity || 0) * parseFloat(itemForm.rate || 0)).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>GST Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={itemForm.gst_rate}
                    onChangeText={(text) => setItemForm({ ...itemForm, gst_rate: text })}
                    placeholder="Enter GST rate"
                    keyboardType="decimal-pad"
                  />
                </View>

                {parseFloat(itemForm.gst_rate || 0) > 0 && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>GST Amount (₹)</Text>
                    <Text style={styles.readOnlyText}>
                      ₹{(
                        (parseFloat(itemForm.quantity || 0) * parseFloat(itemForm.rate || 0) * parseFloat(itemForm.gst_rate || 0)) / 100
                      ).toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Total Amount (₹)</Text>
                  <Text style={[styles.readOnlyText, styles.totalAmountText]}>
                    ₹{(
                      (parseFloat(itemForm.quantity || 0) * parseFloat(itemForm.rate || 0)) +
                      ((parseFloat(itemForm.quantity || 0) * parseFloat(itemForm.rate || 0) * parseFloat(itemForm.gst_rate || 0)) / 100)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowAddItemModal(false);
                  setEditingItemIndex(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveItem}
              >
                <Text style={styles.modalButtonText}>
                  {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
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
    minHeight: 44,
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
    display: 'flex',
    flexDirection: 'column',
  },
  largeModalContent: {
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalScrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalFormSection: {
    padding: 20,
    minHeight: 400,
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
    flexDirection: 'row',
    gap: 8,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
    marginRight: 8,
  },
  createItemText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    marginLeft: 8,
  },
  manualAddButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  manualAddText: {
    ...FONT_STYLES.label,
    color: '#059669',
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
    borderColor: '#d1d5db',
  },
  buttonOutline: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3e60ab',
  },
  buttonText: {
    ...FONT_STYLES.label,
    color: 'white',
  },
  buttonTextSecondary: {
    color: '#6b7280',
  },
  buttonTextOutline: {
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
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  itemHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionButton: {
    padding: 4,
  },
  itemName: {
    ...FONT_STYLES.body,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCode: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  itemCardBody: {
    gap: 6,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  itemValue: {
    ...FONT_STYLES.caption,
    color: '#111827',
    fontWeight: '600',
  },
  itemTaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemTax: {
    ...FONT_STYLES.caption,
    color: '#059669',
    fontWeight: '600',
  },
  itemTaxAmount: {
    ...FONT_STYLES.caption,
    color: '#059669',
    fontWeight: '600',
  },
  readOnlyText: {
    ...FONT_STYLES.body,
    color: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  totalAmountText: {
    fontWeight: '700',
    color: '#3e60ab',
    fontSize: 16,
  },
  warehouseList: {
    gap: 8,
  },
  warehouseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  warehouseOptionSelected: {
    borderColor: '#3e60ab',
    backgroundColor: '#eff6ff',
  },
  warehouseOptionContent: {
    flex: 1,
  },
  warehouseOptionText: {
    ...FONT_STYLES.body,
    color: '#111827',
  },
  warehouseOptionTextSelected: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  warehouseOptionSubtext: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2,
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
