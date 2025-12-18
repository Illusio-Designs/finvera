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

export default function CreditNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyLedger, setPartyLedger] = useState(null);
  const [supplierState, setSupplierState] = useState('Maharashtra');

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    place_of_supply: '',
    narration: '',
    status: 'posted',
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
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

  const ledgers = useMemo(() => ledgersData?.data || ledgersData || [], [ledgersData]);
  const inventoryItems = useMemo(() => inventoryData?.data || inventoryData || [], [inventoryData]);

  // Filter for Sundry Debtors (customers)
  const customerLedgers = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];
    return ledgers.filter((ledger) => {
      const groupName = (
        ledger.account_group?.group_name || 
        ledger.account_group?.name || 
        ledger.account_group_name ||
        ''
      ).toLowerCase();
      return (
        groupName.includes('sundry debtor') ||
        groupName.includes('debtor')
      );
    });
  }, [ledgers]);

  const ledgerOptions = customerLedgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''} [Customer]`,
  }));

  const inventoryOptions = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.item_name}${item.item_code ? ` (${item.item_code})` : ''}`,
    item,
  }));

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
  };

  const handleInventoryItemSelect = (itemId, selectedInventoryId) => {
    if (!selectedInventoryId) return;

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
          };

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

      const subtotal = totals.subtotal;
      const totalAmount = totals.roundedTotal;

      // Create credit note using generic voucher endpoint
      await accountingAPI.vouchers.create({
        voucher_type: 'Credit Note',
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        place_of_supply: formData.place_of_supply || supplierState,
        narration: formData.narration || null,
        subtotal,
        cgst_amount: totals.totalCGST,
        sgst_amount: totals.totalSGST,
        igst_amount: totals.totalIGST,
        round_off: totals.roundOff,
        total_amount: totalAmount,
        items: apiItems,
      });

      toast.success('Credit note created successfully');
      router.push('/client/vouchers/vouchers');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create credit note';
      toast.error(errorMessage);
      console.error('Error creating credit note:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <ClientLayout title="Credit Note">
        <PageLayout
          title="Create Credit Note"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'Credit Note' },
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
                <span>{loading ? 'Saving...' : 'Save Credit Note'}</span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Credit Note Details</h2>
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
                  label="Credit Note Date"
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
