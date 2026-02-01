import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import CreateInventoryItemModal from '../../../components/modals/CreateInventoryItemModal';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { voucherAPI, ledgerAPI } from '../../../lib/api';
import { formatCurrency, calculateGST } from '../../../utils/businessLogic';
import { useNavigation, useRoute } from '@react-navigation/native';

// Voucher number generation
const generateVoucherNumber = (type) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  
  const prefix = type === 'purchase_invoice' ? 'PI' : 'SI';
  return `${prefix}${year}${month}${day}${time}`;
};
export default function SalesInvoiceScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const route = useRoute();
  
  const [formData, setFormData] = useState({
    voucher_number: '',
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    party_name: '',
    reference: '',
    narration: '',
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    status: 'draft'
  });

  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await ledgerAPI.list({ 
        type: 'customer',
        limit: 100 
      });
      const data = response.data?.data || response.data || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Customers fetch error:', error);
      setCustomers([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      // This would typically fetch from inventory API
      // For now, using mock data
      const mockItems = [
        { id: 1, name: 'Product A', rate: 1000, tax_rate: 18 },
        { id: 2, name: 'Product B', rate: 2500, tax_rate: 18 },
        { id: 3, name: 'Service Package', rate: 5000, tax_rate: 18 },
        { id: 4, name: 'Consultation', rate: 3000, tax_rate: 18 },
        { id: 5, name: 'Software License', rate: 15000, tax_rate: 18 },
      ];
      setItems(mockItems);
    } catch (error) {
      console.error('Items fetch error:', error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    
    // Generate voucher number
    const voucherNumber = generateVoucherNumber('sales_invoice');
    setFormData(prev => ({ ...prev, voucher_number: voucherNumber }));
  }, [fetchCustomers, fetchItems]);

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      party_ledger_id: customer.id,
      party_name: customer.name
    }));
    setShowCustomerModal(false);
  };

  const handleAddItem = (item) => {
    const newItem = {
      id: Date.now(),
      item_id: item.id,
      item_name: item.item_name || item.name,
      quantity: 1,
      rate: item.rate,
      tax_rate: item.gst_rate || item.tax_rate,
      amount: item.rate,
      tax_amount: (item.rate * (item.gst_rate || item.tax_rate)) / 100,
      total_amount: item.rate + (item.rate * (item.gst_rate || item.tax_rate)) / 100
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    calculateTotals([...formData.items, newItem]);
    setShowItemModal(false);
  };

  const handleItemCreated = (newItem) => {
    // Add to items list
    setItems(prev => [newItem, ...prev]);
    
    // Add the new item to the invoice
    handleAddItem(newItem);
    
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Item created and added to invoice successfully'
    });
  };

  const handleItemUpdate = (itemId, field, value) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: parseFloat(value) || 0 };
        
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          updatedItem.tax_amount = (updatedItem.amount * updatedItem.tax_rate) / 100;
          updatedItem.total_amount = updatedItem.amount + updatedItem.tax_amount;
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
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  };

  const handleSave = async (status = 'draft') => {
    if (!formData.party_ledger_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a customer'
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
        ...formData,
        voucher_date: formData.voucher_date,
        voucher_type: 'sales_invoice',
        status
      };

      await voucherAPI.create(payload);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Sales invoice ${status === 'draft' ? 'saved as draft' : 'posted'} successfully`
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save sales invoice'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleCustomerSelect(item)}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemName}>{item.name}</Text>
        {item.phone && (
          <Text style={styles.modalItemDetail}>{item.phone}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  const renderItemOption = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleAddItem(item)}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemName}>{item.name}</Text>
        <Text style={styles.modalItemDetail}>
          Rate: {formatCurrency(item.rate)} | Tax: {item.tax_rate}%
        </Text>
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
          <Text style={styles.itemValue}>{item.tax_rate}%</Text>
        </View>
      </View>
      
      <View style={styles.itemTotals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount:</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.amount)}</Text>
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
        title="Sales Invoice" 
        onMenuPress={handleMenuPress}
        rightComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Sales Invoice</Text>
              <Text style={styles.headerSubtitle}>Create new sales invoice</Text>
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
              <Text style={styles.inputLabel}>Invoice Number</Text>
              <TextInput
                style={styles.input}
                value={formData.voucher_number}
                onChangeText={(value) => setFormData(prev => ({ ...prev, voucher_number: value }))}
                placeholder="Enter invoice number"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <ModernDatePicker
                value={formData.voucher_date}
                onDateChange={(date) => setFormData(prev => ({ ...prev, voucher_date: date }))}
                placeholder="Select voucher date"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer *</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput]}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text style={[styles.inputText, !formData.party_name && styles.placeholder]}>
                {formData.party_name || 'Select Customer'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reference</Text>
            <TextInput
              style={styles.input}
              value={formData.reference}
              onChangeText={(value) => setFormData(prev => ({ ...prev, reference: value }))}
              placeholder="Enter reference number"
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
            <Text style={styles.sectionTitle}>Invoice Summary</Text>
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
            style={[styles.actionButton, styles.postButton]}
            onPress={() => handleSave('posted')}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {loading ? 'Posting...' : 'Post Invoice'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity
              onPress={() => setShowCustomerModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.modalList}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
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
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    fontFamily: 'Agency',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyItemsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    fontFamily: 'Agency',
  },
  emptyItemsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    fontFamily: 'Agency',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    fontFamily: 'Agency',
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: 'white',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  itemValue: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: 'Agency',
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
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  totalValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'Agency',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
    marginTop: 4,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'Agency',
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
    borderTopColor: '#10b981',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'Agency',
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
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    fontSize: 14,
    color: '#3e60ab',
    fontWeight: '500',
    fontFamily: 'Agency',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalItem: {
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
  modalItemContent: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  modalItemDetail: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
});