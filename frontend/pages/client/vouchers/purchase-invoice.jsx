import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import FormTextarea from '../../../components/forms/FormTextarea';
import SearchableHSNSelect from '../../../components/forms/SearchableHSNSelect';
import Checkbox from '../../../components/ui/Checkbox';
import { accountingAPI } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import { formatCurrency } from '../../../lib/formatters';

// Helper function to calculate GST
function calculateGST(taxableAmount, gstRate, supplierState, placeOfSupply) {
  const amount = parseFloat(taxableAmount) || 0;
  const rate = parseFloat(gstRate) || 0;
  const isInterstate = supplierState !== placeOfSupply;

  if (isInterstate) {
    const igst = (amount * rate) / 100;
    return {
      cgst: 0,
      sgst: 0,
      igst: parseFloat(igst.toFixed(2)),
      totalTax: parseFloat(igst.toFixed(2)),
    };
  } else {
    const halfRate = rate / 2;
    const cgst = (amount * halfRate) / 100;
    const sgst = (amount * halfRate) / 100;
    return {
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: 0,
      totalTax: parseFloat((cgst + sgst).toFixed(2)),
    };
  }
}

export default function PurchaseInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyLedger, setPartyLedger] = useState(null);
  const [supplierState, setSupplierState] = useState('Maharashtra'); // Default, should come from company

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    place_of_supply: '',
    narration: '',
    status: 'posted',
    is_reverse_charge: false,
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      inventory_item_id: '',
      warehouse_id: '',
      item_code: '',
      item_description: '',
      hsn_sac_code: '',
      uqc: '',
      quantity: '1',
      rate: '0',
      discount_percent: '0',
      gst_rate: '18',
      taxable_amount: '0',
      cgst_amount: '0',
      sgst_amount: '0',
      igst_amount: '0',
      total_amount: '0',
      available_stock: 0,
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
    
    const filtered = ledgers.filter((ledger) => {
      const groupName = (
        ledger.account_group?.group_name || 
        ledger.account_group?.name || 
        ledger.account_group_name ||
        ''
      ).toLowerCase();
      
      return (
        groupName.includes('sundry creditor') ||
        groupName.includes('creditor')
      );
    });
    
    return filtered.length > 0 ? filtered : ledgers;
  }, [ledgers]);

  const ledgerOptions = supplierLedgers.map((ledger) => {
    return {
      value: ledger.id,
      label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''} [Supplier]`,
    };
  });

  const inventoryOptions = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.item_name}${item.item_code ? ` (${item.item_code})` : ''}`,
    item,
  }));

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.warehouse_name || warehouse.name,
  }));

  // Update place of supply when party ledger changes
  useEffect(() => {
    if (formData.party_ledger_id) {
      const selectedLedger = ledgers.find((l) => l.id === formData.party_ledger_id);
      if (selectedLedger) {
        setPartyLedger(selectedLedger);
        setFormData((prev) => ({
          ...prev,
          place_of_supply: selectedLedger.state || supplierState,
        }));
      }
    } else {
      setPartyLedger(null);
    }
  }, [formData.party_ledger_id, ledgers, supplierState]);

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [field]: value };

        // Calculate taxable amount
        const qty = parseFloat(updated.quantity) || 0;
        const rate = parseFloat(updated.rate) || 0;
        const discountPercent = parseFloat(updated.discount_percent) || 0;
        const discountAmount = (qty * rate * discountPercent) / 100;
        updated.taxable_amount = (qty * rate - discountAmount).toFixed(2);

        // Calculate GST
        const gstRate = parseFloat(updated.gst_rate) || 0;
        const taxable = parseFloat(updated.taxable_amount) || 0;
        const gst = calculateGST(taxable, gstRate, supplierState, formData.place_of_supply || supplierState);
        updated.cgst_amount = gst.cgst.toFixed(2);
        updated.sgst_amount = gst.sgst.toFixed(2);
        updated.igst_amount = gst.igst.toFixed(2);

        // Calculate total
        const total = taxable + gst.totalTax;
        updated.total_amount = total.toFixed(2);

        return updated;
      })
    );
  };

  const handleInventoryItemSelect = async (itemId, selectedInventoryId) => {
    if (!selectedInventoryId) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, inventory_item_id: '', warehouse_id: '', available_stock: 0 };
        })
      );
      return;
    }

    const inventoryItem = inventoryItems.find((item) => item.id === selectedInventoryId);
    if (inventoryItem) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;

          const updated = {
            ...item,
            inventory_item_id: inventoryItem.id,
            item_code: inventoryItem.item_code || '',
            item_description: inventoryItem.item_name || '',
            hsn_sac_code: inventoryItem.hsn_sac_code || '',
            uqc: inventoryItem.uqc || '',
            gst_rate: inventoryItem.gst_rate ? String(inventoryItem.gst_rate) : '18',
            rate: inventoryItem.avg_cost ? String(inventoryItem.avg_cost) : item.rate,
            warehouse_id: item.warehouse_id || '', // Keep existing warehouse if any
          };

          // Recalculate
          const qty = parseFloat(updated.quantity) || 0;
          const rate = parseFloat(updated.rate) || 0;
          const discountPercent = parseFloat(updated.discount_percent) || 0;
          const discountAmount = (qty * rate * discountPercent) / 100;
          updated.taxable_amount = (qty * rate - discountAmount).toFixed(2);

          const gstRate = parseFloat(updated.gst_rate) || 0;
          const taxable = parseFloat(updated.taxable_amount) || 0;
          const gst = calculateGST(taxable, gstRate, supplierState, formData.place_of_supply || supplierState);
          updated.cgst_amount = gst.cgst.toFixed(2);
          updated.sgst_amount = gst.sgst.toFixed(2);
          updated.igst_amount = gst.igst.toFixed(2);

          const total = taxable + gst.totalTax;
          updated.total_amount = total.toFixed(2);

          return updated;
        })
      );

      // Fetch stock for selected warehouse if warehouse is already selected
      const currentItem = items.find((i) => i.id === itemId);
      if (currentItem?.warehouse_id) {
        await fetchWarehouseStock(itemId, selectedInventoryId, currentItem.warehouse_id);
      }
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

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return { ...i, warehouse_id: warehouseId, available_stock: 0 };
      })
    );

    // Fetch stock for selected warehouse
    if (warehouseId) {
      await fetchWarehouseStock(itemId, item.inventory_item_id, warehouseId);
    }
  };

  const handleHSNSelect = (itemId, hsnData) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = {
          ...item,
          hsn_sac_code: hsnData.hsn_sac_code || item.hsn_sac_code,
          gst_rate: hsnData.gst_rate ? String(hsnData.gst_rate) : item.gst_rate,
          uqc: hsnData.uqc || item.uqc,
        };

        // Recalculate GST
        const taxable = parseFloat(updated.taxable_amount) || 0;
        const gstRate = parseFloat(updated.gst_rate) || 0;
        const gst = calculateGST(taxable, gstRate, supplierState, formData.place_of_supply || supplierState);
        updated.cgst_amount = gst.cgst.toFixed(2);
        updated.sgst_amount = gst.sgst.toFixed(2);
        updated.igst_amount = gst.igst.toFixed(2);

        const total = taxable + gst.totalTax;
        updated.total_amount = total.toFixed(2);

        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
        {
          id: Date.now() + Math.random(),
          inventory_item_id: '',
          warehouse_id: '',
          item_code: '',
          item_description: '',
          hsn_sac_code: '',
          uqc: '',
          quantity: '1',
          rate: '0',
          discount_percent: '0',
          gst_rate: '18',
          taxable_amount: '0',
          cgst_amount: '0',
          sgst_amount: '0',
          igst_amount: '0',
          total_amount: '0',
          available_stock: 0,
        },
    ]);
  };

  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    items.forEach((item) => {
      subtotal += parseFloat(item.taxable_amount) || 0;
      totalCGST += parseFloat(item.cgst_amount) || 0;
      totalSGST += parseFloat(item.sgst_amount) || 0;
      totalIGST += parseFloat(item.igst_amount) || 0;
    });

    const totalTax = totalCGST + totalSGST + totalIGST;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;

    return {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax,
      grandTotal,
      roundedTotal,
      roundOff,
    };
  }, [items]);

  const validate = () => {
    const newErrors = {};

    if (!formData.party_ledger_id) {
      newErrors.party_ledger_id = 'Supplier is required';
    }

    if (!formData.voucher_date) {
      newErrors.voucher_date = 'Voucher date is required';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    items.forEach((item, index) => {
      if (!item.item_description) {
        newErrors[`item_description_${index}`] = 'Item description is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_quantity_${index}`] = 'Valid quantity is required';
      }
      if (!item.rate || parseFloat(item.rate) < 0) {
        newErrors[`item_rate_${index}`] = 'Valid rate is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        place_of_supply: formData.place_of_supply || supplierState,
        is_reverse_charge: formData.is_reverse_charge || false,
        narration: formData.narration || null,
        items: items.map((item) => ({
          item_code: item.item_code,
          item_description: item.item_description,
          hsn_sac_code: item.hsn_sac_code,
          uqc: item.uqc,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          discount_percent: parseFloat(item.discount_percent) || 0,
          gst_rate: parseFloat(item.gst_rate),
        })),
      };

      await accountingAPI.invoices.createPurchase(payload);
      toast.success('Purchase invoice created successfully');
      router.push('/client/vouchers/vouchers');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create purchase invoice';
      toast.error(errorMessage);
      console.error('Error creating purchase invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  // Indian states list
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
    'Lakshadweep', 'Puducherry',
  ];

  const stateOptions = indianStates.map((state) => ({ value: state, label: state }));

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Purchase Invoice">
        <PageLayout
          title="Create Purchase Invoice"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'Purchase Invoice' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/client/vouchers/vouchers')}
                className="flex items-center gap-2"
              >
                <FiArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FiSave className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Invoice'}</span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect
                  name="party_ledger_id"
                  label="Supplier"
                  value={formData.party_ledger_id}
                  onChange={handleFormChange}
                  options={ledgerOptions}
                  error={errors.party_ledger_id}
                  placeholder="Select supplier"
                  required
                  disabled={ledgersLoading}
                />

                <FormDatePicker
                  name="voucher_date"
                  label="Invoice Date"
                  value={formData.voucher_date}
                  onChange={handleFormChange}
                  error={errors.voucher_date}
                  required
                />

                <FormSelect
                  name="place_of_supply"
                  label="Place of Supply"
                  value={formData.place_of_supply}
                  onChange={handleFormChange}
                  options={stateOptions}
                  error={errors.place_of_supply}
                  placeholder="Select state"
                  required
                />
              </div>

              <div className="mt-4">
                <Checkbox
                  name="is_reverse_charge"
                  label="Reverse Charge Mechanism (RCM)"
                  checked={formData.is_reverse_charge || false}
                  onChange={(e) => {
                    const checked = e.target?.checked ?? false;
                    handleFormChange('is_reverse_charge', checked);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Enable if GST is payable under Reverse Charge Mechanism. When enabled, RCM Output (liability) and RCM Input (ITC) ledgers will be created.
                </p>
              </div>

              <div className="mt-4">
                <FormTextarea
                  name="narration"
                  label="Narration/Remarks"
                  value={formData.narration}
                  onChange={handleFormChange}
                  error={errors.narration}
                  placeholder="Enter any additional remarks"
                />
              </div>
            </Card>

            {/* Items Table */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                <Button type="button" onClick={addItem} variant="outline" className="flex items-center gap-2">
                  <FiPlus className="h-4 w-4" />
                  <span>Add Item</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disc. %</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <FormSelect
                              name={`inventory_item_${item.id}`}
                              value={item.inventory_item_id}
                              onChange={(name, value) => handleInventoryItemSelect(item.id, value)}
                              options={[
                                { value: '', label: 'Manual Entry' },
                                ...inventoryOptions,
                              ]}
                              placeholder="Select item"
                              className="text-sm"
                            />
                            {item.inventory_item_id && (
                              <FormSelect
                                name={`warehouse_${item.id}`}
                                value={item.warehouse_id}
                                onChange={(name, value) => handleWarehouseSelect(item.id, value)}
                                options={[
                                  { value: '', label: 'Select Warehouse' },
                                  ...warehouseOptions,
                                ]}
                                placeholder="Select warehouse"
                                className="text-sm"
                              />
                            )}
                            {item.warehouse_id && item.available_stock !== undefined && (
                              <div className="text-xs text-gray-600">
                                Available: {item.available_stock.toFixed(2)} {item.uqc || ''}
                              </div>
                            )}
                            <FormInput
                              name={`item_description_${item.id}`}
                              value={item.item_description}
                              onChange={(name, value) => handleItemChange(item.id, 'item_description', value)}
                              placeholder="Item description"
                              error={errors[`item_description_${index}`]}
                              className="text-sm"
                              required
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <SearchableHSNSelect
                            name={`hsn_${item.id}`}
                            value={item.hsn_sac_code}
                            onChange={(name, value) => handleItemChange(item.id, 'hsn_sac_code', value)}
                            onHSNSelect={(hsnData) => handleHSNSelect(item.id, hsnData)}
                            placeholder="HSN/SAC"
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`quantity_${item.id}`}
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={item.quantity}
                            onChange={(name, value) => handleItemChange(item.id, 'quantity', value)}
                            error={errors[`item_quantity_${index}`]}
                            className="text-sm"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`rate_${item.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(name, value) => handleItemChange(item.id, 'rate', value)}
                            error={errors[`item_rate_${index}`]}
                            className="text-sm"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`discount_${item.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.discount_percent}
                            onChange={(name, value) => handleItemChange(item.id, 'discount_percent', value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium">{formatCurrency(item.taxable_amount)}</div>
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`gst_rate_${item.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.gst_rate}
                            onChange={(name, value) => handleItemChange(item.id, 'gst_rate', value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            {parseFloat(item.igst_amount) > 0 && (
                              <div>IGST: {formatCurrency(item.igst_amount)}</div>
                            )}
                            {parseFloat(item.cgst_amount) > 0 && (
                              <>
                                <div>CGST: {formatCurrency(item.cgst_amount)}</div>
                                <div>SGST: {formatCurrency(item.sgst_amount)}</div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-semibold">{formatCurrency(item.total_amount)}</div>
                        </td>
                        <td className="px-3 py-2">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Totals */}
            <Card>
              <div className="flex justify-end">
                <div className="w-full md:w-96 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.totalCGST > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CGST:</span>
                        <span className="font-medium">{formatCurrency(totals.totalCGST)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SGST:</span>
                        <span className="font-medium">{formatCurrency(totals.totalSGST)}</span>
                      </div>
                    </>
                  )}
                  {totals.totalIGST > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IGST:</span>
                      <span className="font-medium">{formatCurrency(totals.totalIGST)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium">{formatCurrency(totals.totalTax)}</span>
                  </div>
                  {totals.roundOff !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Round Off:</span>
                      <span className="font-medium">{formatCurrency(totals.roundOff)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(totals.roundedTotal)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </form>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
