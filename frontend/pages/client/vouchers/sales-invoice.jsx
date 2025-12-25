import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import FormTextarea from '../../../components/forms/FormTextarea';
import SearchableHSNSelect from '../../../components/forms/SearchableHSNSelect';
import { accountingAPI, eInvoiceAPI, eWayBillAPI } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiX, FiArrowLeft } from 'react-icons/fi';
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

export default function SalesInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyLedger, setPartyLedger] = useState(null);
  const [supplierState, setSupplierState] = useState('Maharashtra'); // Default, should come from company
  const [showEInvoiceModal, setShowEInvoiceModal] = useState(false);
  const [pendingVoucherId, setPendingVoucherId] = useState(null);
  const [eInvoiceOptions, setEInvoiceOptions] = useState({
    generate_e_invoice: false,
    generate_e_way_bill: false,
  });

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    place_of_supply: '',
    narration: '',
    status: 'posted',
    gst_bill_type: 'B2B', // B2B, B2C, Export, SEZ, Deemed Export
    shipping_option: 'same_as_ledger', // 'same_as_ledger', 'saved_location', 'new_address'
    shipping_address_id: '', // For selecting from customer's shipping locations
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
    shipping_country: 'India',
    // Transport details
    transporter_name: '',
    transporter_id: '',
    vehicle_no: '',
    transport_mode: 'ROAD', // ROAD, RAIL, AIR, SHIP
    distance_km: '',
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
      available_stock: 0, // Available stock in selected warehouse
    },
  ]);

  const [errors, setErrors] = useState({});

  // Fetch ledgers (customers - Sundry Debtors)
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

  // Filter for Sundry Debtors (customers) and Sundry Creditors
  const customerLedgers = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];
    
    const filtered = ledgers.filter((ledger) => {
      // Check nested account_group object - try multiple possible field names
      const groupName = (
        ledger.account_group?.group_name || 
        ledger.account_group?.name || 
        ledger.account_group_name ||
        ''
      ).toLowerCase();
      
      return (
        groupName.includes('sundry debtor') || 
        groupName.includes('sundry creditor') ||
        groupName.includes('debtor') ||
        groupName.includes('creditor')
      );
    });
    
    // If no filtered results, show all ledgers (fallback for debugging)
    return filtered.length > 0 ? filtered : ledgers;
  }, [ledgers]);

  const ledgerOptions = customerLedgers.map((ledger) => {
    const groupName = (
      ledger.account_group?.group_name || 
      ledger.account_group?.name || 
      ledger.account_group_name ||
      ''
    ).toLowerCase();
    
    // Determine ledger type based on group name
    let ledgerType = '';
    if (groupName.includes('creditor')) {
      ledgerType = 'Creditor';
    } else if (groupName.includes('debtor')) {
      ledgerType = 'Debtor';
    } else if (groupName) {
      ledgerType = 'Other';
    }
    
    const typeLabel = ledgerType ? ` [${ledgerType}]` : '';
    return {
      value: ledger.id,
      label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}${typeLabel}`,
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

  // Get shipping locations from selected ledger
  const shippingLocations = useMemo(() => {
    if (!partyLedger) return [];
    
    // Check if shipping_locations array exists in additional_fields
    const locations = partyLedger.additional_fields?.shipping_locations || [];
    
    // Also check if direct shipping fields exist and add as an option
    if (partyLedger.shipping_address || partyLedger.shipping_city) {
      return [
        {
          id: 'default',
          name: 'Default Shipping Address',
          address: partyLedger.shipping_address || '',
          city: partyLedger.shipping_city || '',
          state: partyLedger.shipping_state || '',
          pincode: partyLedger.shipping_pincode || '',
          country: partyLedger.shipping_country || 'India',
        },
        ...locations,
      ];
    }
    
    return locations;
  }, [partyLedger]);

  const shippingLocationOptions = shippingLocations.map((loc, index) => ({
    value: loc.id || `location_${index}`,
    label: loc.name || loc.location_name || `Shipping Location ${index + 1}`,
    location: loc,
  }));

  // Fetch full ledger details when party ledger is selected to get shipping locations
  useEffect(() => {
    const fetchLedgerDetails = async () => {
      if (formData.party_ledger_id) {
        try {
          const response = await accountingAPI.ledgers.get(formData.party_ledger_id);
          const fullLedgerData = response.data?.data || response.data;
          if (fullLedgerData) {
            setPartyLedger(fullLedgerData);
            setFormData((prev) => ({
              ...prev,
              place_of_supply: fullLedgerData.state || supplierState,
            }));
          } else {
            // Fallback to basic ledger from list
            const selectedLedger = ledgers.find((l) => l.id === formData.party_ledger_id);
            if (selectedLedger) {
              setPartyLedger(selectedLedger);
              setFormData((prev) => ({
                ...prev,
                place_of_supply: selectedLedger.state || supplierState,
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching ledger details:', error);
          // Fallback to basic ledger from list
          const selectedLedger = ledgers.find((l) => l.id === formData.party_ledger_id);
          if (selectedLedger) {
            setPartyLedger(selectedLedger);
            setFormData((prev) => ({
              ...prev,
              place_of_supply: selectedLedger.state || supplierState,
            }));
          }
        }
      } else {
        setPartyLedger(null);
        setFormData((prev) => ({
          ...prev,
          shipping_address_id: '',
          shipping_address: '',
          shipping_city: '',
          shipping_state: '',
          shipping_pincode: '',
        }));
      }
    };

    fetchLedgerDetails();
  }, [formData.party_ledger_id, supplierState, ledgers]);

  // Update shipping address based on selected option
  useEffect(() => {
    if (!partyLedger) return;

    if (formData.shipping_option === 'same_as_ledger') {
      // Use ledger's registered address
      setFormData((prev) => ({
        ...prev,
        shipping_address: partyLedger.address || '',
        shipping_city: partyLedger.city || '',
        shipping_state: partyLedger.state || '',
        shipping_pincode: partyLedger.pincode || '',
        shipping_country: partyLedger.country || 'India',
        shipping_address_id: '',
      }));
    } else if (formData.shipping_option === 'saved_location' && formData.shipping_address_id && shippingLocations.length > 0) {
      // Use selected saved shipping location
      const selectedLocation = shippingLocations.find(
        (loc, index) => (loc.id || `location_${index}`) === formData.shipping_address_id
      );
      if (selectedLocation) {
        setFormData((prev) => ({
          ...prev,
          shipping_address: selectedLocation.address || selectedLocation.shipping_address || '',
          shipping_city: selectedLocation.city || selectedLocation.shipping_city || '',
          shipping_state: selectedLocation.state || selectedLocation.shipping_state || '',
          shipping_pincode: selectedLocation.pincode || selectedLocation.shipping_pincode || '',
          shipping_country: selectedLocation.country || selectedLocation.shipping_country || 'India',
        }));
      }
    } else if (formData.shipping_option === 'new_address') {
      // Clear shipping address fields so user can enter manually
      // Don't clear if user has already entered data
      if (!formData.shipping_address && !formData.shipping_city) {
        setFormData((prev) => ({
          ...prev,
          shipping_address: '',
          shipping_city: '',
          shipping_state: '',
          shipping_pincode: '',
          shipping_country: 'India',
          shipping_address_id: '',
        }));
      }
    }
  }, [formData.shipping_option, formData.shipping_address_id, shippingLocations, partyLedger, formData.shipping_address, formData.shipping_city]);

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
      newErrors.party_ledger_id = 'Customer is required';
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
      // Prepare items for API
      const apiItems = items.map((item) => ({
        inventory_item_id: item.inventory_item_id || null,
        item_code: item.item_code || null,
        item_description: item.item_description,
        hsn_sac_code: item.hsn_sac_code || null,
        uqc: item.uqc || null,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        discount_percent: parseFloat(item.discount_percent) || 0,
        discount_amount: (parseFloat(item.quantity) * parseFloat(item.rate) * parseFloat(item.discount_percent || 0)) / 100,
        taxable_amount: parseFloat(item.taxable_amount),
        gst_rate: parseFloat(item.gst_rate),
        cgst_amount: parseFloat(item.cgst_amount),
        sgst_amount: parseFloat(item.sgst_amount),
        igst_amount: parseFloat(item.igst_amount),
        total_amount: parseFloat(item.total_amount),
      }));

      // Use the dedicated sales invoice endpoint which handles all ledger entries automatically
      const payload = {
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        place_of_supply: formData.place_of_supply || supplierState,
        narration: formData.narration || null,
        items: apiItems.map((item) => ({
          inventory_item_id: item.inventory_item_id || null,
          warehouse_id: item.warehouse_id || null,
          item_code: item.item_code,
          item_description: item.item_description,
          hsn_sac_code: item.hsn_sac_code,
          uqc: item.uqc,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent || 0,
          gst_rate: item.gst_rate,
        })),
        // GST Bill Type (for reporting and compliance)
        gst_bill_type: formData.gst_bill_type || 'B2B',
        // Shipping address details
        shipping_address: formData.shipping_address || null,
        shipping_city: formData.shipping_city || null,
        shipping_state: formData.shipping_state || null,
        shipping_pincode: formData.shipping_pincode || null,
        shipping_country: formData.shipping_country || null,
        // Transport details (for e-way bill generation)
        transporter_name: formData.transporter_name || null,
        transporter_id: formData.transporter_id || null,
        vehicle_no: formData.vehicle_no || null,
        transport_mode: formData.transport_mode || 'ROAD',
        distance_km: formData.distance_km ? parseInt(formData.distance_km) : null,
      };

      const response = await accountingAPI.invoices.createSales(payload);
      const createdVoucher = response.data?.voucher;
      
      if (createdVoucher?.id) {
        // Check if e-invoice or e-way bill should be generated
        // For now, we'll always show the modal, but in production you'd check company configuration
        setPendingVoucherId(createdVoucher.id);
        setShowEInvoiceModal(true);
      } else {
        toast.success('Sales invoice created successfully');
        router.push('/client/vouchers/vouchers');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create sales invoice';
      toast.error(errorMessage);
      console.error('Error creating sales invoice:', error);
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
      <ClientLayout title="Sales Invoice">
        <PageLayout
          title="Create Sales Invoice"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'Sales Invoice' },
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push('/client/vouchers/vouchers')}
              className="flex items-center gap-2"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
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
                  label="Customer"
                  value={formData.party_ledger_id}
                  onChange={handleFormChange}
                  options={ledgerOptions}
                  error={errors.party_ledger_id}
                  placeholder="Select customer"
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
                  name="gst_bill_type"
                  label="GST Bill Type"
                  value={formData.gst_bill_type}
                  onChange={handleFormChange}
                  options={[
                    { value: 'B2B', label: 'B2B (Business to Business)' },
                    { value: 'B2C', label: 'B2C (Business to Consumer)' },
                    { value: 'Export', label: 'Export' },
                    { value: 'SEZ', label: 'SEZ (Special Economic Zone)' },
                    { value: 'Deemed Export', label: 'Deemed Export' },
                    { value: 'B2CL', label: 'B2CL (B2C Large)' },
                  ]}
                  error={errors.gst_bill_type}
                  required
                />
              </div>

              <div className="mt-4">
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
            </Card>

            {/* Shipping Address Section */}
            {formData.party_ledger_id && (
              <Card>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose shipping address option
                  </p>
                </div>

                {/* Shipping Address Options */}
                <div className="mb-6 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping_option"
                      value="same_as_ledger"
                      checked={formData.shipping_option === 'same_as_ledger'}
                      onChange={(e) => handleFormChange('shipping_option', e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Same as Ledger Address
                    </span>
                  </label>

                  {shippingLocationOptions.length > 0 && (
                    <div className="ml-7">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="shipping_option"
                          value="saved_location"
                          checked={formData.shipping_option === 'saved_location'}
                          onChange={(e) => handleFormChange('shipping_option', e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Use Saved Shipping Location
                        </span>
                      </label>
                      {formData.shipping_option === 'saved_location' && (
                        <div className="mt-2 ml-7">
                          <FormSelect
                            name="shipping_address_id"
                            label="Select Shipping Location"
                            value={formData.shipping_address_id}
                            onChange={handleFormChange}
                            options={shippingLocationOptions}
                            placeholder="Select shipping location"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping_option"
                      value="new_address"
                      checked={formData.shipping_option === 'new_address'}
                      onChange={(e) => handleFormChange('shipping_option', e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Add New Address for This Invoice Only
                    </span>
                  </label>
                </div>

                {/* Shipping Address Fields - Show for saved location and new address */}
                {(formData.shipping_option === 'new_address' || formData.shipping_option === 'saved_location') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="md:col-span-2">
                      <FormTextarea
                        name="shipping_address"
                        label="Shipping Address"
                        value={formData.shipping_address}
                        onChange={handleFormChange}
                        error={errors.shipping_address}
                        placeholder="Enter shipping address"
                        disabled={formData.shipping_option === 'saved_location'}
                      />
                    </div>

                    <FormInput
                      name="shipping_city"
                      label="City"
                      value={formData.shipping_city}
                      onChange={handleFormChange}
                      error={errors.shipping_city}
                      placeholder="Enter city"
                      disabled={formData.shipping_option === 'saved_location'}
                    />

                    <FormSelect
                      name="shipping_state"
                      label="State"
                      value={formData.shipping_state}
                      onChange={handleFormChange}
                      options={stateOptions}
                      error={errors.shipping_state}
                      placeholder="Select state"
                      disabled={formData.shipping_option === 'saved_location'}
                    />

                    <FormInput
                      name="shipping_pincode"
                      label="Pincode"
                      value={formData.shipping_pincode}
                      onChange={handleFormChange}
                      error={errors.shipping_pincode}
                      placeholder="Enter pincode"
                      disabled={formData.shipping_option === 'saved_location'}
                    />

                    <FormInput
                      name="shipping_country"
                      label="Country"
                      value={formData.shipping_country}
                      onChange={handleFormChange}
                      error={errors.shipping_country}
                      placeholder="Enter country"
                      disabled={formData.shipping_option === 'saved_location'}
                    />
                  </div>
                )}

                {/* Display ledger address when "same as ledger" is selected */}
                {formData.shipping_option === 'same_as_ledger' && partyLedger && (
                  <div className="border-t pt-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Shipping Address (Same as Ledger):</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {partyLedger.address && <p>{partyLedger.address}</p>}
                        <p>
                          {[partyLedger.city, partyLedger.state, partyLedger.pincode].filter(Boolean).join(', ')}
                          {partyLedger.country && `, ${partyLedger.country}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Transport Details Section */}
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Transport Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Transport information for e-way bill generation (if applicable)
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="transporter_name"
                  label="Transporter Name"
                  value={formData.transporter_name}
                  onChange={handleFormChange}
                  error={errors.transporter_name}
                  placeholder="Enter transporter name"
                />

                <FormInput
                  name="transporter_id"
                  label="Transporter ID / GSTIN"
                  value={formData.transporter_id}
                  onChange={handleFormChange}
                  error={errors.transporter_id}
                  placeholder="Enter transporter ID or GSTIN"
                />

                <FormInput
                  name="vehicle_no"
                  label="Vehicle Number"
                  value={formData.vehicle_no}
                  onChange={handleFormChange}
                  error={errors.vehicle_no}
                  placeholder="Enter vehicle number"
                />

                <FormSelect
                  name="transport_mode"
                  label="Transport Mode"
                  value={formData.transport_mode}
                  onChange={handleFormChange}
                  options={[
                    { value: 'ROAD', label: 'Road' },
                    { value: 'RAIL', label: 'Rail' },
                    { value: 'AIR', label: 'Air' },
                    { value: 'SHIP', label: 'Ship' },
                  ]}
                  error={errors.transport_mode}
                />

                <FormInput
                  name="distance_km"
                  label="Distance (km)"
                  type="number"
                  value={formData.distance_km}
                  onChange={handleFormChange}
                  error={errors.distance_km}
                  placeholder="Enter distance in kilometers"
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
                                required={!!item.inventory_item_id}
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

            {/* Narration/Remarks - At the end of the bill */}
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Narration / Remarks</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Additional notes or remarks for this invoice
                </p>
              </div>
              <FormTextarea
                name="narration"
                label="Narration/Remarks"
                value={formData.narration}
                onChange={handleFormChange}
                error={errors.narration}
                placeholder="Enter any additional remarks or notes"
              />
            </Card>

            {/* Save Button at the end */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/client/vouchers/vouchers')}
                className="flex items-center gap-2"
              >
                <FiX className="h-4 w-4" />
                <span>Cancel</span>
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
          </form>

          {/* E-Invoice and E-Way Bill Generation Modal */}
          <Modal
            isOpen={showEInvoiceModal}
            onClose={() => {
              setShowEInvoiceModal(false);
              router.push('/client/vouchers/vouchers');
            }}
            title="Generate E-Invoice and E-Way Bill"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Invoice has been created successfully. Would you like to generate e-invoice and/or e-way bill?
              </p>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={eInvoiceOptions.generate_e_invoice}
                    onChange={(e) =>
                      setEInvoiceOptions((prev) => ({
                        ...prev,
                        generate_e_invoice: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Generate E-Invoice (IRN)</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Generate Invoice Reference Number (IRN) for this invoice
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={eInvoiceOptions.generate_e_way_bill}
                    onChange={(e) =>
                      setEInvoiceOptions((prev) => ({
                        ...prev,
                        generate_e_way_bill: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Generate E-Way Bill</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Generate e-way bill for goods movement (required if value ≥ ₹50,000)
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEInvoiceModal(false);
                    router.push('/client/vouchers/vouchers');
                  }}
                >
                  Skip
                </Button>
                <Button
                  onClick={async () => {
                    if (!pendingVoucherId) return;

                    setLoading(true);
                    try {
                      const promises = [];

                      if (eInvoiceOptions.generate_e_invoice) {
                        promises.push(
                          eInvoiceAPI.generate({ voucher_id: pendingVoucherId }).catch((err) => {
                            console.error('E-invoice generation error:', err);
                            toast.error('Failed to generate e-invoice: ' + (err.response?.data?.message || err.message));
                            return null;
                          })
                        );
                      }

                      if (eInvoiceOptions.generate_e_way_bill) {
                        const ewayBillPayload = {
                          voucher_id: pendingVoucherId,
                          transporter_name: formData.transporter_name || null,
                          transporter_id: formData.transporter_id || null,
                          vehicle_no: formData.vehicle_no || null,
                          transport_mode: formData.transport_mode || 'ROAD',
                          distance_km: formData.distance_km ? parseInt(formData.distance_km) : null,
                          from_pincode: formData.shipping_pincode || null,
                          to_pincode: partyLedger?.pincode || null,
                        };
                        promises.push(
                          eWayBillAPI.generate(ewayBillPayload).catch((err) => {
                            console.error('E-way bill generation error:', err);
                            toast.error('Failed to generate e-way bill: ' + (err.response?.data?.message || err.message));
                            return null;
                          })
                        );
                      }

                      if (promises.length > 0) {
                        await Promise.all(promises);
                        toast.success('Document generation completed');
                      } else {
                        toast.success('Invoice saved successfully');
                      }

                      setShowEInvoiceModal(false);
                      router.push('/client/vouchers/vouchers');
                    } catch (error) {
                      console.error('Error generating documents:', error);
                      toast.error('Some documents could not be generated');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </Modal>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
