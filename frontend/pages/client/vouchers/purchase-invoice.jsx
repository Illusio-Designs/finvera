
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormSelectWithCreate from '../../../components/forms/FormSelectWithCreate';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import FormTextarea from '../../../components/forms/FormTextarea';
import SearchableHSNSelect from '../../../components/forms/SearchableHSNSelect';
import Checkbox from '../../../components/ui/Checkbox';
import BarcodeGenerationModal from '../../../components/modals/BarcodeGenerationModal';
import VariantSelectionModal from '../../../components/modals/VariantSelectionModal';
import CreateSupplierModal from '../../../components/modals/CreateSupplierModal';
import { accountingAPI } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import { formatCurrency } from '../../../lib/formatters';

// Helper function to calculate GST amounts
const calculateGST = (amount, gstRate, supplierState, companyState = 'Maharashtra') => {
  const gstAmount = (amount * gstRate) / 100;
  
  if (supplierState === companyState) {
    // Same state - CGST + SGST
    return {
      cgst_amount: (gstAmount / 2).toFixed(2),
      sgst_amount: (gstAmount / 2).toFixed(2),
      igst_amount: '0.00',
    };
  } else {
    // Different state - IGST
    return {
      cgst_amount: '0.00',
      sgst_amount: '0.00',
      igst_amount: gstAmount.toFixed(2),
    };
  }
};

export default function PurchaseInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyLedger, setPartyLedger] = useState(null);
  const [supplierState, setSupplierState] = useState('Maharashtra');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [createdItems, setCreatedItems] = useState([]);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);

  // State for variant selection
  const [isVariantModalOpen, setVariantModalOpen] = useState(false);
  const [variantsForItem, setVariantsForItem] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    voucher_number: '',
    party_ledger_id: '',
    reference_number: '',
    due_date: '',
    narration: '',
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      inventory_item_id: '',
      item_description: '',
      hsn_sac_code: '',
      uqc: '',
      quantity: '1',
      rate: '0',
      amount: '0.00',
      gst_rate: '0',
      cgst_amount: '0.00',
      sgst_amount: '0.00',
      igst_amount: '0.00',
      warehouse_id: '',
    },
  ]);

  const [errors, setErrors] = useState({});

  // Fetch ledgers (suppliers - Sundry Creditors)
  const { data: ledgersData, loading: ledgersLoading } = useApi(
    () => accountingAPI.ledgers.list({ limit: 1000, is_active: true }),
    true
  );

  // Fetch inventory items
  const { data: inventoryData, loading: inventoryLoading } = useApi(
    () => accountingAPI.inventory.items.list({ limit: 1000, is_active: true }),
    true
  );

  // Fetch warehouses
  const { data: warehousesData, loading: warehousesLoading } = useApi(
    () => accountingAPI.warehouses.list({ limit: 1000, is_active: true }),
    true
  );

  const ledgers = useMemo(() => ledgersData?.data || ledgersData || [], [ledgersData]);
  const inventoryItems = useMemo(() => inventoryData?.data || inventoryData || [], [inventoryData]);
  const warehouses = useMemo(() => warehousesData?.data || warehousesData || [], [warehousesData]);

  // Filter for Sundry Creditors (suppliers)
  const supplierLedgers = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];
    return ledgers.filter(ledger => {
      const groupName = ledger.account_group?.name?.toLowerCase() || '';
      return groupName.includes('sundry creditor') || groupName.includes('creditor');
    });
  }, [ledgers]);

  const ledgerOptions = useMemo(() => {
    return supplierLedgers.map((ledger) => ({
      value: ledger.id,
      label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
      ledger,
    }));
  }, [supplierLedgers]);

  const inventoryOptions = useMemo(() => {
    // Filter out variants from the main item list
    return inventoryItems
      .filter(item => !item.variant_of_id)
      .map((item) => ({
        value: item.id,
        label: `${item.item_name}${item.item_code ? ` (${item.item_code})` : ''}`,
        item,
      }));
  }, [inventoryItems]);

  const warehouseOptions = useMemo(() => {
    return warehouses.map((warehouse) => ({
      value: warehouse.id,
      label: `${warehouse.warehouse_name}${warehouse.warehouse_code ? ` (${warehouse.warehouse_code})` : ''}`,
    }));
  }, [warehouses]);

  // Fetch party ledger details when party_ledger_id changes
  useEffect(() => {
    if (formData.party_ledger_id) {
      const fetchPartyLedger = async () => {
        try {
          const response = await accountingAPI.ledgers.get(formData.party_ledger_id);
          const fullLedgerData = response.data?.data || response.data;
          if (fullLedgerData) {
            setPartyLedger(fullLedgerData);
            setSupplierState(fullLedgerData.state || 'Maharashtra');
          }
        } catch (error) {
          console.error('Error fetching party ledger:', error);
          // Fallback to basic ledger data from the list
          const selectedLedger = ledgers.find((l) => l.id === formData.party_ledger_id);
          if (selectedLedger) {
            setPartyLedger(selectedLedger);
            setSupplierState(selectedLedger.state || 'Maharashtra');
          }
        }
      };
      fetchPartyLedger();
    } else {
      setPartyLedger(null);
      setSupplierState('Maharashtra');
    }
  }, [formData.party_ledger_id, ledgers]);

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (itemId, name, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        
        const updated = { ...item, [name]: value };
        
        // Recalculate amounts when quantity or rate changes
        if (name === 'quantity' || name === 'rate') {
          const quantity = parseFloat(name === 'quantity' ? value : item.quantity) || 0;
          const rate = parseFloat(name === 'rate' ? value : item.rate) || 0;
          const amount = quantity * rate;
          
          updated.amount = amount.toFixed(2);
          
          // Recalculate GST
          const gstRate = parseFloat(item.gst_rate) || 0;
          const gstAmount = (amount * gstRate) / 100;
          
          if (supplierState === 'Maharashtra') {
            updated.cgst_amount = (gstAmount / 2).toFixed(2);
            updated.sgst_amount = (gstAmount / 2).toFixed(2);
            updated.igst_amount = '0.00';
          } else {
            updated.cgst_amount = '0.00';
            updated.sgst_amount = '0.00';
            updated.igst_amount = gstAmount.toFixed(2);
          }
        }
        
        return updated;
      })
    );
  };

  const handleInventoryItemSelect = async (itemId, selectedInventoryId) => {
    if (!selectedInventoryId) {
      // Reset item to default values
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            inventory_item_id: '',
            item_description: '',
            hsn_sac_code: '',
            uqc: '',
            gst_rate: '0',
            rate: '0',
            amount: '0.00',
            cgst_amount: '0.00',
            sgst_amount: '0.00',
            igst_amount: '0.00',
          };
        })
      );
      return;
    }

    const inventoryItem = inventoryItems.find((item) => item.id === selectedInventoryId);
    if (!inventoryItem) return;

    // Check for variants
    const variants = inventoryItems.filter(item => item.variant_of_id === selectedInventoryId);
    if (variants.length > 0) {
      setVariantsForItem(variants);
      setCurrentItemId(itemId);
      setVariantModalOpen(true);
    } else {
      // No variants, proceed as normal
      updateItemWithInventoryData(itemId, inventoryItem);
    }
  };

  const handleVariantSelect = (variant) => {
    if (currentItemId && variant) {
      updateItemWithInventoryData(currentItemId, variant);
    }
    setVariantModalOpen(false);
    setVariantsForItem([]);
    setCurrentItemId(null);
  };

  const updateItemWithInventoryData = (itemId, inventoryData) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = {
          ...item,
          inventory_item_id: inventoryData.id,
          item_code: inventoryData.item_code || '',
          item_description: inventoryData.item_name || '',
          hsn_sac_code: inventoryData.hsn_sac_code || '',
          uqc: inventoryData.uqc || '',
          gst_rate: inventoryData.gst_rate ? String(inventoryData.gst_rate) : '18',
          rate: inventoryData.avg_cost ? String(inventoryData.avg_cost) : item.rate,
          warehouse_id: item.warehouse_id || '',
        };

        // Recalculate amount and GST
        const quantity = parseFloat(updated.quantity) || 0;
        const rate = parseFloat(updated.rate) || 0;
        const amount = quantity * rate;
        updated.amount = amount.toFixed(2);
        
        // Calculate GST amounts
        const gstRate = parseFloat(updated.gst_rate) || 0;
        const gstCalc = calculateGST(amount, gstRate, supplierState);
        updated.cgst_amount = gstCalc.cgst_amount;
        updated.sgst_amount = gstCalc.sgst_amount;
        updated.igst_amount = gstCalc.igst_amount;

        return updated;
      })
    );
    
    const currentItem = items.find((i) => i.id === itemId);
    if (currentItem?.warehouse_id) {
      fetchWarehouseStock(itemId, inventoryData.id, currentItem.warehouse_id);
    }
  };

  // Fetch warehouse stock for an item
  const fetchWarehouseStock = async (itemId, inventoryItemId, warehouseId) => {
    if (!inventoryItemId || !warehouseId) return;

    try {
      const response = await accountingAPI.inventory.items.getWarehouseStock(inventoryItemId, { warehouse_id: warehouseId });
      const stockData = response?.data?.data || response?.data;
      // Handle both single object and array responses
      const warehouseStock = Array.isArray(stockData) 
        ? stockData.find((ws) => ws.warehouse_id === warehouseId) || { quantity: 0 }
        : stockData || { quantity: 0 };
      const availableStock = parseFloat(warehouseStock?.quantity || 0);

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, available_stock: availableStock };
        })
      );
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, available_stock: 0 };
        })
      );
    }
  };

  // Handle warehouse selection
  const handleWarehouseSelect = async (itemId, warehouseId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item?.inventory_item_id) {
      toast.error('Please select an item first');
      return;
    }

    handleItemChange(itemId, 'warehouse_id', warehouseId);
    if (warehouseId) {
      await fetchWarehouseStock(itemId, item.inventory_item_id, warehouseId);
    }
  };

  // Handle HSN selection
  const handleHSNSelect = (itemId, hsnData) => {
    if (!hsnData) return;
    
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        
        const updated = {
          ...item,
          hsn_sac_code: hsnData.hsn_code || hsnData.code || '',
          gst_rate: hsnData.gst_rate ? String(hsnData.gst_rate) : item.gst_rate,
        };
        
        // Recalculate GST with new rate
        const amount = parseFloat(item.amount) || 0;
        const gstRate = parseFloat(updated.gst_rate) || 0;
        const gstAmount = (amount * gstRate) / 100;
        
        if (supplierState === 'Maharashtra') {
          updated.cgst_amount = (gstAmount / 2).toFixed(2);
          updated.sgst_amount = (gstAmount / 2).toFixed(2);
          updated.igst_amount = '0.00';
        } else {
          updated.cgst_amount = '0.00';
          updated.sgst_amount = '0.00';
          updated.igst_amount = gstAmount.toFixed(2);
        }
        
        return updated;
      })
    );
  };

  // Add new item
  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      inventory_item_id: '',
      item_code: '',
      item_description: '',
      hsn_sac_code: '',
      uqc: '',
      quantity: '1',
      rate: '0',
      amount: '0.00',
      gst_rate: '18',
      cgst_amount: '0.00',
      sgst_amount: '0.00',
      igst_amount: '0.00',
      warehouse_id: '',
      available_stock: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove item
  const removeItem = (itemId) => {
    if (items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalCGST = items.reduce((sum, item) => sum + (parseFloat(item.cgst_amount) || 0), 0);
    const totalSGST = items.reduce((sum, item) => sum + (parseFloat(item.sgst_amount) || 0), 0);
    const totalIGST = items.reduce((sum, item) => sum + (parseFloat(item.igst_amount) || 0), 0);
    const totalGST = totalCGST + totalSGST + totalIGST;
    const grandTotal = subtotal + totalGST;

    return {
      subtotal: subtotal.toFixed(2),
      totalCGST: totalCGST.toFixed(2),
      totalSGST: totalSGST.toFixed(2),
      totalIGST: totalIGST.toFixed(2),
      totalGST: totalGST.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  }, [items]);

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.party_ledger_id) {
      newErrors.party_ledger_id = 'Supplier is required';
    }

    if (!formData.voucher_date) {
      newErrors.voucher_date = 'Date is required';
    }

    if (!formData.voucher_number.trim()) {
      newErrors.voucher_number = 'Invoice number is required';
    }

    // Validate items
    const itemErrors = {};
    items.forEach((item, index) => {
      if (!item.item_description.trim()) {
        itemErrors[`${item.id}_item_description`] = 'Item description is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        itemErrors[`${item.id}_quantity`] = 'Valid quantity is required';
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        itemErrors[`${item.id}_rate`] = 'Valid rate is required';
      }
    });

    setErrors({ ...newErrors, ...itemErrors });
    return Object.keys(newErrors).length === 0 && Object.keys(itemErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        voucher_type: 'Purchase',
        voucher_date: formData.voucher_date,
        voucher_number: formData.voucher_number,
        party_ledger_id: formData.party_ledger_id,
        reference_number: formData.reference_number || null,
        due_date: formData.due_date || null,
        narration: formData.narration || null,
        total_amount: parseFloat(totals.grandTotal),
        items: items.map((item) => ({
          inventory_item_id: item.inventory_item_id || null,
          item_description: item.item_description,
          hsn_sac_code: item.hsn_sac_code || null,
          uqc: item.uqc || null,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.amount),
          gst_rate: parseFloat(item.gst_rate),
          cgst_amount: parseFloat(item.cgst_amount),
          sgst_amount: parseFloat(item.sgst_amount),
          igst_amount: parseFloat(item.igst_amount),
          warehouse_id: item.warehouse_id || null,
        })),
      };

      const response = await accountingAPI.invoices.createPurchase(payload);
      const createdVoucher = response.data?.voucher;
      
      if (createdVoucher?.id) {
        setCreatedItems(items.filter(item => item.inventory_item_id));
        if (items.some(item => item.inventory_item_id)) {
          setShowBarcodeModal(true);
        }
      }

      toast.success('Purchase invoice created successfully');
      router.push('/client/vouchers');
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to create purchase invoice');
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode generation skip
  const handleSkipBarcode = () => {
    setShowBarcodeModal(false);
    setCreatedItems([]);
  };

  // Handle barcode generation
  const handleBarcodeGeneration = async (barcodeConfig) => {
    try {
      const itemIds = createdItems.map(item => item.inventory_item_id).filter(Boolean);
      if (itemIds.length === 0) return;

      await accountingAPI.inventory.items.bulkGenerateBarcodes({
        item_ids: itemIds,
        ...barcodeConfig,
      });

      toast.success('Barcodes generated successfully');
      setShowBarcodeModal(false);
      setCreatedItems([]);
    } catch (error) {
      console.error('Error generating barcodes:', error);
      toast.error('Failed to generate barcodes');
    }
  };

  // Handle supplier creation
  const handleSupplierCreated = async (newSupplier) => {
    try {
      // Refresh the ledgers list by re-fetching
      const response = await accountingAPI.ledgers.list({ limit: 1000, is_active: true });
      const updatedLedgers = response.data?.data || response.data || [];
      
      // Update the form with the newly created supplier
      if (newSupplier && newSupplier.id) {
        setFormData(prev => ({ ...prev, party_ledger_id: newSupplier.id }));
        setPartyLedger(newSupplier);
        setSupplierState(newSupplier.state || 'Maharashtra');
      }
      
      toast.success('Supplier created and selected successfully');
    } catch (error) {
      console.error('Error refreshing suppliers:', error);
      // Still set the supplier even if refresh fails
      if (newSupplier && newSupplier.id) {
        setFormData(prev => ({ ...prev, party_ledger_id: newSupplier.id }));
        setPartyLedger(newSupplier);
        setSupplierState(newSupplier.state || 'Maharashtra');
      }
      toast.success('Supplier created and selected successfully');
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Purchase Invoice">
        <PageLayout
          title="Purchase Invoice"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'Purchase Invoice' },
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push('/client/vouchers/vouchers')}
              className="flex items-center gap-2"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Vouchers</span>
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormDatePicker
                    name="voucher_date"
                    label="Invoice Date"
                    value={formData.voucher_date}
                    onChange={handleFormChange}
                    error={errors.voucher_date}
                    required
                  />
                  
                  <FormInput
                    name="voucher_number"
                    label="Invoice Number"
                    value={formData.voucher_number}
                    onChange={handleFormChange}
                    error={errors.voucher_number}
                    placeholder="Enter invoice number"
                    required
                  />

                  <FormSelectWithCreate
                    name="party_ledger_id"
                    label="Supplier"
                    value={formData.party_ledger_id}
                    onChange={handleFormChange}
                    options={ledgerOptions}
                    error={errors.party_ledger_id}
                    placeholder="Select supplier"
                    loading={ledgersLoading}
                    required
                    onCreateClick={() => setShowCreateSupplierModal(true)}
                    createButtonText="Create New Supplier"
                  />

                  <FormInput
                    name="reference_number"
                    label="Reference Number"
                    value={formData.reference_number}
                    onChange={handleFormChange}
                    placeholder="Enter reference number (optional)"
                  />

                  <FormDatePicker
                    name="due_date"
                    label="Due Date"
                    value={formData.due_date}
                    onChange={handleFormChange}
                    placeholder="Select due date (optional)"
                  />
                </div>

                {partyLedger && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Supplier Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {partyLedger.ledger_name}
                      </div>
                      {partyLedger.gstin && (
                        <div>
                          <span className="font-medium">GSTIN:</span> {partyLedger.gstin}
                        </div>
                      )}
                      {partyLedger.state && (
                        <div>
                          <span className="font-medium">State:</span> {partyLedger.state}
                        </div>
                      )}
                      {partyLedger.address && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Address:</span> {partyLedger.address}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    <span>Add Item</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                          <FormSelect
                            name={`inventory_item_${item.id}`}
                            label="Inventory Item"
                            value={item.inventory_item_id}
                            onChange={(name, value) => handleInventoryItemSelect(item.id, value)}
                            options={inventoryOptions}
                            placeholder="Select item (optional)"
                            loading={inventoryLoading}
                          />
                        </div>

                        <FormSelect
                          name={`warehouse_${item.id}`}
                          label="Warehouse"
                          value={item.warehouse_id}
                          onChange={(name, value) => handleWarehouseSelect(item.id, value)}
                          options={warehouseOptions}
                          placeholder="Select warehouse"
                          loading={warehousesLoading}
                        />

                        {item.available_stock !== undefined && (
                          <div className="flex items-end">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Available Stock:</span>
                              <span className="ml-1 text-gray-900">{item.available_stock}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="lg:col-span-2">
                          <FormInput
                            name={`item_description_${item.id}`}
                            label="Item Description"
                            value={item.item_description}
                            onChange={(name, value) => handleItemChange(item.id, 'item_description', value)}
                            error={errors[`${item.id}_item_description`]}
                            placeholder="Enter item description"
                            required
                          />
                        </div>

                        <SearchableHSNSelect
                          name={`hsn_sac_code_${item.id}`}
                          label="HSN/SAC Code"
                          value={item.hsn_sac_code}
                          onChange={(name, value) => handleItemChange(item.id, 'hsn_sac_code', value)}
                          placeholder="Search HSN/SAC code"
                          onHSNSelect={(hsnData) => handleHSNSelect(item.id, hsnData)}
                        />

                        <FormInput
                          name={`uqc_${item.id}`}
                          label="Unit (UQC)"
                          value={item.uqc}
                          onChange={(name, value) => handleItemChange(item.id, 'uqc', value)}
                          placeholder="e.g., NOS, KGS"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                        <FormInput
                          name={`quantity_${item.id}`}
                          label="Quantity"
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.quantity}
                          onChange={(name, value) => handleItemChange(item.id, 'quantity', value)}
                          error={errors[`${item.id}_quantity`]}
                          required
                        />

                        <FormInput
                          name={`rate_${item.id}`}
                          label="Rate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.rate}
                          onChange={(name, value) => handleItemChange(item.id, 'rate', value)}
                          error={errors[`${item.id}_rate`]}
                          required
                        />

                        <FormInput
                          name={`amount_${item.id}`}
                          label="Amount"
                          value={formatCurrency(item.amount)}
                          readOnly
                          className="bg-gray-50"
                        />

                        <FormInput
                          name={`gst_rate_${item.id}`}
                          label="GST Rate (%)"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.gst_rate}
                          onChange={(name, value) => handleItemChange(item.id, 'gst_rate', value)}
                        />

                        {supplierState === 'Maharashtra' ? (
                          <>
                            <FormInput
                              name={`cgst_amount_${item.id}`}
                              label="CGST"
                              value={formatCurrency(item.cgst_amount)}
                              readOnly
                              className="bg-gray-50"
                            />
                            <FormInput
                              name={`sgst_amount_${item.id}`}
                              label="SGST"
                              value={formatCurrency(item.sgst_amount)}
                              readOnly
                              className="bg-gray-50"
                            />
                          </>
                        ) : (
                          <div className="lg:col-span-2">
                            <FormInput
                              name={`igst_amount_${item.id}`}
                              label="IGST"
                              value={formatCurrency(item.igst_amount)}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Subtotal:</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                      </div>
                      {parseFloat(totals.totalCGST) > 0 && (
                        <div className="flex justify-between">
                          <span>CGST:</span>
                          <span>{formatCurrency(totals.totalCGST)}</span>
                        </div>
                      )}
                      {parseFloat(totals.totalSGST) > 0 && (
                        <div className="flex justify-between">
                          <span>SGST:</span>
                          <span>{formatCurrency(totals.totalSGST)}</span>
                        </div>
                      )}
                      {parseFloat(totals.totalIGST) > 0 && (
                        <div className="flex justify-between">
                          <span>IGST:</span>
                          <span>{formatCurrency(totals.totalIGST)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(totals.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <FormTextarea
                  name="narration"
                  label="Narration"
                  value={formData.narration}
                  onChange={handleFormChange}
                  placeholder="Enter additional notes (optional)"
                  rows={3}
                />
              </div>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/client/vouchers/vouchers')}
                className="flex items-center gap-2"
              >
                <FiArrowLeft className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FiSave className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Purchase Invoice'}</span>
              </Button>
            </div>
          </form>

          {/* Create Supplier Modal */}
          <CreateSupplierModal
            isOpen={showCreateSupplierModal}
            onClose={() => setShowCreateSupplierModal(false)}
            onSupplierCreated={handleSupplierCreated}
          />

          {/* Variant Selection Modal */}
          <VariantSelectionModal
            isOpen={isVariantModalOpen}
            onClose={() => setVariantModalOpen(false)}
            variants={variantsForItem}
            onSelectVariant={handleVariantSelect}
          />

          {/* Barcode Generation Modal */}
          <BarcodeGenerationModal
            isOpen={showBarcodeModal}
            onClose={handleSkipBarcode}
            items={createdItems}
            onGenerate={handleBarcodeGeneration}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
