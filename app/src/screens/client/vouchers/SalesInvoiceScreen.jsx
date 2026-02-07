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
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import CreateLedgerModal from '../../../components/modals/CreateLedgerModal';
import CreateInventoryItemModal from '../../../components/modals/CreateInventoryItemModal';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useVoucher } from '../../../contexts/VoucherContext';
import { voucherAPI, accountingAPI, inventoryAPI } from '../../../lib/api';
import { formatCurrency, calculateGST } from '../../../utils/businessLogic';
import { useNavigation, useRoute } from '@react-navigation/native';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';
import EInvoiceStatusCard from '../../../components/invoice/EInvoiceStatusCard';
import EWayBillStatusCard from '../../../components/invoice/EWayBillStatusCard';
import TDSCalculationCard from '../../../components/invoice/TDSCalculationCard';
import EInvoiceService from '../../../services/invoice/EInvoiceService';
import EWayBillService from '../../../services/invoice/EWayBillService';
import TDSService from '../../../services/invoice/TDSService';

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
  
  // Settings and Voucher contexts
  const { 
    eInvoiceEnabled, 
    eWayBillEnabled, 
    tdsEnabled,
    eWayBillThreshold,
    autoGenerateEInvoice,
    autoGenerateEWayBill
  } = useSettings();
  
  const {
    eInvoiceStatus,
    eWayBillStatus,
    tdsDetails,
    updateEInvoiceStatus,
    updateEWayBillStatus,
    updateTdsDetails
  } = useVoucher();
  
  const [formData, setFormData] = useState({
    voucher_number: generateVoucherNumber('sales_invoice'),
    voucher_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
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
  const [pageLoading, setPageLoading] = useState(true);
  
  // Feature-specific loading states
  const [eInvoiceLoading, setEInvoiceLoading] = useState(false);
  const [eWayBillLoading, setEWayBillLoading] = useState(false);
  const [tdsLoading, setTdsLoading] = useState(false);
  
  // Saved voucher ID for post-save operations
  const [savedVoucherId, setSavedVoucherId] = useState(null);
  
  // Debug loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed:', loading);
  }, [loading]);
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchCustomers = useCallback(async () => {
    try {
      console.log('\n👥 === FETCHING CUSTOMERS ===');
      const response = await accountingAPI.ledgers.list({ 
        limit: 100 
      });
      const data = response.data?.data || response.data || [];
      const ledgersArray = Array.isArray(data) ? data : [];
      
      console.log('📊 Total ledgers fetched:', ledgersArray.length);
      
      // Filter for Sundry Debtors (customers)
      const customerLedgers = ledgersArray.filter(ledger => {
        const groupName = ledger.account_group?.name || ledger.account_group?.group_name;
        const isSundryDebtor = groupName === 'Sundry Debtors';
        if (isSundryDebtor) {
          console.log('✅ Customer found:', ledger.ledger_name, '- Group:', groupName);
        }
        return isSundryDebtor;
      });
      
      console.log('🎯 Filtered customers:', customerLedgers.length);
      setCustomers(customerLedgers);
    } catch (error) {
      console.error('❌ Customers fetch error:', error);
      setCustomers([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      console.log('\n📦 === FETCHING INVENTORY ITEMS ===');
      const response = await inventoryAPI.items.list({ 
        limit: 100 
      });
      const data = response.data?.data || response.data || [];
      const itemsArray = Array.isArray(data) ? data : [];
      
      console.log('📊 Total items fetched:', itemsArray.length);
      setItems(itemsArray);
    } catch (error) {
      console.error('❌ Items fetch error:', error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      setPageLoading(true);
      const startTime = Date.now();
      
      await Promise.all([
        fetchCustomers(),
        fetchItems()
      ]);
      
      // Generate voucher number
      const voucherNumber = generateVoucherNumber('sales_invoice');
      setFormData(prev => ({ ...prev, voucher_number: voucherNumber }));
      
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setPageLoading(false);
      }, remainingTime);
    };
    
    initializeForm();
  }, [fetchCustomers, fetchItems]);

  const handleCustomerSelect = (customer) => {
    console.log('\n👤 === CUSTOMER SELECTED ===');
    console.log('📋 Customer Details:', {
      id: customer.id,
      name: customer.ledger_name || customer.name,
      group: customer.account_group?.name
    });
    
    setFormData(prev => ({
      ...prev,
      party_ledger_id: customer.id,
      party_name: customer.ledger_name || customer.name
    }));
    setShowCustomerModal(false);
    console.log('✅ Customer selection completed');
  };

  const handleAddItem = (item) => {
    console.log('\n➕ === ADDING ITEM TO INVOICE ===');
    console.log('📦 Selected Item:', {
      id: item.id,
      item_name: item.item_name,
      rate: item.rate,
      gst_rate: item.gst_rate
    });
    
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

    console.log('🔢 Calculated Item Details:', {
      quantity,
      rate,
      taxable_amount: taxableAmount,
      gst_rate: gstRate,
      tax_amount: taxAmount,
      total_amount: totalAmount
    });

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    calculateTotals([...formData.items, newItem]);
    setShowItemModal(false);
    console.log('✅ === ITEM ADDED SUCCESSFULLY ===');
  };

  const handleCustomerCreated = (newCustomer) => {
    console.log('\n🆕 === NEW CUSTOMER CREATED ===');
    console.log('👤 New Customer:', newCustomer);
    
    // Add to customers list
    setCustomers(prev => [newCustomer, ...prev]);
    
    // Auto-select the new customer
    handleCustomerSelect(newCustomer);
    
    showNotification({
      type: 'success',
      title: 'Success',
      message: 'Customer created and selected successfully'
    });
  };

  const handleItemCreated = (newItem) => {
    console.log('\n🆕 === NEW ITEM CREATED ===');
    console.log('📦 New Item:', newItem);
    
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
    console.log('\n🔄 === UPDATING ITEM ===');
    console.log('📝 Update Details:', {
      itemId,
      field,
      newValue: value,
      oldValue: formData.items.find(item => item.id === itemId)?.[field]
    });
    
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
          
          console.log('🧮 Recalculated Item:', {
            item_name: updatedItem.item_name,
            quantity: updatedItem.quantity,
            rate: updatedItem.rate,
            taxable_amount: `${item.taxable_amount} → ${updatedItem.taxable_amount}`,
            tax_amount: `${item.tax_amount} → ${updatedItem.tax_amount}`,
            total_amount: `${item.total_amount} → ${updatedItem.total_amount}`,
            gst_rate: updatedItem.gst_rate
          });
        }
        
        return updatedItem;
      }
      return item;
    });

    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
    console.log('✅ === ITEM UPDATE COMPLETED ===');
  };

  const handleRemoveItem = (itemId) => {
    console.log('\n🗑️ === REMOVING ITEM ===');
    console.log('📝 Item ID:', itemId);
    
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
    console.log('✅ Item removed successfully');
  
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    console.log('\n🧮 === CALCULATING INVOICE TOTALS ===');
    console.log('📋 Items to calculate:', items.length);
    
    let subtotal = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const itemTaxable = parseFloat(item.taxable_amount || 0);
      const itemTax = parseFloat(item.tax_amount || 0);
      
      subtotal += itemTaxable;
      taxAmount += itemTax;
      
      console.log(`   ${item.item_name}: ₹${itemTaxable}`);
      console.log(`   ${item.item_name} Tax: ₹${itemTax} (${item.gst_rate}%)`);
    });
    
    const totalAmount = subtotal + taxAmount;
    
    console.log('💰 Invoice Totals:', {
      subtotal: `₹${subtotal.toFixed(2)}`,
      tax_amount: `₹${taxAmount.toFixed(2)}`,
      total_amount: `₹${totalAmount.toFixed(2)}`
    });

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
    
    console.log('✅ === TOTALS CALCULATION COMPLETED ===');
  };

  // Debug function to check form state
  const debugFormState = () => {
    console.log('\n🔍 === FORM STATE DEBUG ===');
    console.log('Loading:', loading);
    console.log('Party Ledger ID:', formData.party_ledger_id);
    console.log('Party Name:', formData.party_name);
    console.log('Items Count:', formData.items.length);
    console.log('Items:', formData.items);
    console.log('Total Amount:', formData.total_amount);
    console.log('Button should be disabled:', loading);
    console.log('=== END FORM STATE DEBUG ===\n');
  };

  const handleSave = async (status = 'draft') => {
    console.log('\n🚀 === SALES INVOICE SAVE STARTED ===');
    console.log('📋 Status:', status);
    console.log('📋 Loading state at start:', loading);
    console.log('📋 Current timestamp:', new Date().toISOString());
    console.log('📋 Form Data Summary:', {
      voucher_number: formData.voucher_number,
      voucher_date: formData.voucher_date,
      party_ledger_id: formData.party_ledger_id,
      party_name: formData.party_name,
      status: status,
      items_count: formData.items.length,
      subtotal: formData.subtotal,
      tax_amount: formData.tax_amount,
      total_amount: formData.total_amount
    });

    // Check if already loading
    if (loading) {
      console.log('❌ ALREADY LOADING - PREVENTING DUPLICATE CALL');
      return;
    }

    if (!formData.party_ledger_id) {
      console.log('❌ Validation Failed: No customer selected');
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a customer'
      });
      return;
    }

    if (formData.items.length === 0) {
      console.log('❌ Validation Failed: No items added');
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please add at least one item'
      });
      return;
    }

    console.log('✅ Validation Passed');
    console.log('\n📦 Items Details:');
    formData.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        inventory_item_id: item.inventory_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        rate: item.rate,
        taxable_amount: item.taxable_amount,
        gst_rate: item.gst_rate,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount
      });
    });

    setLoading(true);
    try {
      const payload = {
        voucher_type: 'sales_invoice',
        voucher_number: formData.voucher_number,
        voucher_date: formData.voucher_date,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        party_ledger_id: formData.party_ledger_id,
        reference: formData.reference,
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
      console.log('\n🌐 Making API Call to:', 'voucherAPI.salesInvoice.create');
      
      const startTime = Date.now();
      const response = await voucherAPI.salesInvoice.create(payload);
      const endTime = Date.now();
      
      console.log(`\n✅ API Call Successful (${endTime - startTime}ms)`);
      console.log('📥 API Response:', JSON.stringify(response.data, null, 2));
      
      // Extract voucher ID from response
      const voucherId = response.data?.data?.id || response.data?.id;
      setSavedVoucherId(voucherId);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Sales invoice ${status === 'draft' ? 'saved as draft' : 'posted'} successfully`
      });
      
      // Auto-generate e-invoice, e-way bill, and calculate TDS if enabled
      if (status === 'posted' && voucherId) {
        await handlePostSaveOperations(voucherId);
      }
      
      console.log('🎉 === SALES INVOICE SAVE COMPLETED ===\n');
      
      // Navigate back after a short delay to allow operations to complete
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      const endTime = Date.now();
      console.log(`\n❌ API Call Failed (${endTime - (Date.now() - 1000)}ms)`);
      console.error('💥 Save Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      if (error.response?.data) {
        console.log('🔍 Backend Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save sales invoice'
      });
      console.log('💔 === SALES INVOICE SAVE FAILED ===\n');
    } finally {
      setLoading(false);
    }
  };

  // Handle post-save operations (e-invoice, e-way bill, TDS)
  const handlePostSaveOperations = async (voucherId) => {
    console.log('\n🔄 === POST-SAVE OPERATIONS STARTED ===');
    console.log('📋 Voucher ID:', voucherId);
    console.log('📋 E-Invoice Enabled:', eInvoiceEnabled);
    console.log('📋 E-Way Bill Enabled:', eWayBillEnabled);
    console.log('📋 TDS Enabled:', tdsEnabled);
    
    // Auto-generate e-invoice if enabled
    if (eInvoiceEnabled && autoGenerateEInvoice) {
      try {
        console.log('📄 Generating e-invoice...');
        setEInvoiceLoading(true);
        const eInvoiceResult = await EInvoiceService.generateEInvoice({
          voucherId: voucherId,
          voucherType: 'SALES_INVOICE'
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
    
    // Auto-generate e-way bill if enabled and threshold met
    if (eWayBillEnabled && autoGenerateEWayBill) {
      try {
        const meetsThreshold = await EWayBillService.checkThreshold(formData.total_amount);
        if (meetsThreshold) {
          console.log('🚚 Generating e-way bill...');
          setEWayBillLoading(true);
          const eWayBillResult = await EWayBillService.generateEWayBill({
            voucherId: voucherId,
            voucherType: 'SALES_INVOICE',
            amount: formData.total_amount
          });
          updateEWayBillStatus(eWayBillResult);
          console.log('✅ E-Way Bill generated successfully');
          showNotification({
            type: 'success',
            title: 'E-Way Bill Generated',
            message: `EWB No: ${eWayBillResult.ewbNumber || 'Pending'}`
          });
        } else {
          console.log('ℹ️ E-Way Bill not required (below threshold)');
        }
      } catch (error) {
        console.error('❌ E-Way Bill generation failed:', error);
        showNotification({
          type: 'error',
          title: 'E-Way Bill Failed',
          message: error.message || 'Failed to generate e-way bill'
        });
      } finally {
        setEWayBillLoading(false);
      }
    }
    
    // Calculate TDS if enabled
    if (tdsEnabled) {
      try {
        console.log('🧮 Calculating TDS...');
        setTdsLoading(true);
        // Note: TDS calculation requires section selection, so we'll just show the card
        // The actual calculation will happen when user selects a section
        console.log('ℹ️ TDS card will be shown for user to select section');
      } catch (error) {
        console.error('❌ TDS calculation failed:', error);
      } finally {
        setTdsLoading(false);
      }
    }
    
    console.log('✅ === POST-SAVE OPERATIONS COMPLETED ===\n');
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.ledger_name || customer.name || '').toLowerCase().includes(searchQuery.toLowerCase())
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
        message: 'Please save the invoice first'
      });
      return;
    }

    try {
      setEInvoiceLoading(true);
      const result = await EInvoiceService.generateEInvoice({
        voucherId: savedVoucherId,
        voucherType: 'SALES_INVOICE'
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

  // E-Way Bill handlers
  const handleEWayBillGenerate = async (vehicleNumber, transporterId) => {
    if (!savedVoucherId) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please save the invoice first'
      });
      return;
    }

    try {
      setEWayBillLoading(true);
      const result = await EWayBillService.generateEWayBill({
        voucherId: savedVoucherId,
        voucherType: 'SALES_INVOICE',
        amount: formData.total_amount,
        vehicleNumber,
        transporterId
      });
      updateEWayBillStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'E-Way Bill generated successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to generate e-way bill'
      });
    } finally {
      setEWayBillLoading(false);
    }
  };

  const handleEWayBillCancel = async (reason, reasonCode) => {
    if (!eWayBillStatus?.ewbNumber) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No e-way bill number found to cancel'
      });
      return;
    }

    try {
      setEWayBillLoading(true);
      const result = await EWayBillService.cancelEWayBill({
        voucherId: savedVoucherId,
        ewbNumber: eWayBillStatus.ewbNumber,
        reason,
        reasonCode
      });
      updateEWayBillStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'E-Way Bill cancelled successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to cancel e-way bill'
      });
    } finally {
      setEWayBillLoading(false);
    }
  };

  const handleEWayBillUpdateVehicle = async (vehicleNumber, reason) => {
    if (!eWayBillStatus?.id) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No e-way bill record found to update'
      });
      return;
    }

    try {
      setEWayBillLoading(true);
      const result = await EWayBillService.updateVehicleDetails({
        id: eWayBillStatus.id,
        vehicleNumber,
        reasonCode: '1',
        reasonRemark: reason
      });
      updateEWayBillStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Vehicle details updated successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update vehicle details'
      });
    } finally {
      setEWayBillLoading(false);
    }
  };

  const handleEWayBillRetry = async () => {
    if (!eWayBillStatus?.id) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No e-way bill record found to retry'
      });
      return;
    }

    try {
      setEWayBillLoading(true);
      const result = await EWayBillService.retryEWayBillGeneration(eWayBillStatus.id);
      updateEWayBillStatus(result);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'E-Way Bill retry initiated'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to retry e-way bill generation'
      });
    } finally {
      setEWayBillLoading(false);
    }
  };

  // TDS handlers
  const handleTDSSectionChange = async (section) => {
    if (!savedVoucherId) {
      console.log('No voucher ID available for TDS calculation');
      return;
    }

    try {
      setTdsLoading(true);
      const result = await TDSService.calculateTDS({
        voucherId: savedVoucherId,
        amount: formData.total_amount,
        section,
        deducteeType: 'COMPANY', // Default, should be configurable
        panNumber: null // Should be fetched from customer data
      });
      updateTdsDetails(result);
      showNotification({
        type: 'success',
        title: 'TDS Calculated',
        message: `TDS Amount: ${formatCurrency(result.amount)}`
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

  const handleTDSCalculate = async () => {
    if (!tdsDetails?.section) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select a TDS section first'
      });
      return;
    }

    await handleTDSSectionChange(tdsDetails.section);
  };

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item)}
    >
      <View style={styles.customerContent}>
        <Text style={styles.customerName}>
          {item.ledger_name || item.name || 'Unnamed Customer'}
        </Text>
        
        {/* Show account group name prominently */}
        {item.account_group?.name && (
          <Text style={styles.customerGroup}>
            {item.account_group.name}
          </Text>
        )}
        
        {/* Show contact info if available */}
        {item.contact_number && (
          <Text style={styles.customerContact}>📞 {item.contact_number}</Text>
        )}
        {item.email && (
          <Text style={styles.customerContact}>✉️ {item.email}</Text>
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
        title="Sales Invoice" 
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

        {/* E-Way Bill Status Card - Conditional */}
        {eWayBillEnabled && savedVoucherId && eWayBillStatus && (
          <EWayBillStatusCard
            status={eWayBillStatus}
            onGenerate={handleEWayBillGenerate}
            onCancel={handleEWayBillCancel}
            onUpdateVehicle={handleEWayBillUpdateVehicle}
            onRetry={handleEWayBillRetry}
            loading={eWayBillLoading}
          />
        )}

        {/* TDS Calculation Card - Conditional */}
        {tdsEnabled && savedVoucherId && (
          <TDSCalculationCard
            tdsDetails={tdsDetails}
            amount={formData.total_amount}
            onSectionChange={handleTDSSectionChange}
            onCalculate={handleTDSCalculate}
            loading={tdsLoading}
          />
        )}

        {/* Loading Indicators for Operations */}
        {(eInvoiceLoading || eWayBillLoading || tdsLoading) && (
          <View style={styles.operationLoadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.operationLoadingText}>
              {eInvoiceLoading && 'Generating e-invoice...'}
              {eWayBillLoading && 'Generating e-way bill...'}
              {tdsLoading && 'Calculating TDS...'}
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
            onPress={() => {
              console.log('🚨 SALES POST BUTTON CLICKED!');
              console.log('🔘 Post button pressed, loading:', loading);
              console.log('🔘 Form data summary:', {
                party_ledger_id: formData.party_ledger_id,
                party_name: formData.party_name,
                items_count: formData.items.length,
                total_amount: formData.total_amount
              });
              debugFormState();
              if (loading) {
                console.log('⚠️ Button is disabled due to loading state');
                return;
              }
              console.log('✅ Proceeding with handleSave...');
              handleSave('posted');
            }}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {loading ? 'Posting...' : 'Post Invoice'}
            </Text>
          </TouchableOpacity>
        </View>
        </>
        )}
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
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowCustomerModal(false);
                  setShowCreateLedgerModal(true);
                }}
                style={styles.addSupplierButton}
              >
                <Ionicons name="add" size={20} color="#3e60ab" />
                <Text style={styles.addSupplierText}>Add Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCustomerModal(false)}
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
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No customers found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {customers.length === 0 
                    ? 'Create a new customer to get started' 
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

      {/* Create Customer Modal */}
      <CreateLedgerModal
        visible={showCreateLedgerModal}
        onClose={() => setShowCreateLedgerModal(false)}
        onLedgerCreated={handleCustomerCreated}
        title="Create New Customer"
        accountGroupFilter="Sundry Debtors"
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
    backgroundColor: '#10b981',
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
    color: '#10b981'
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
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  grandTotalValue: {
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
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  modalItemDetail: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  // Customer item styles
  customerItem: {
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
  customerContent: {
    flex: 1,
  },
  customerName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  customerGroup: {
    ...FONT_STYLES.caption,
    color: '#3b82f6',
    marginBottom: 4
  },
  customerContact: {
    ...FONT_STYLES.caption,
    color: '#6b7280'
  },
  // Item option styles
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
  itemName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
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
  // Empty state styles
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