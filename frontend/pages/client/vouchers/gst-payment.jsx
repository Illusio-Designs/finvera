import { useState, useMemo } from 'react';
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
import { accountingAPI } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { formatCurrency } from '../../../lib/formatters';

export default function GSTPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    bank_ledger_id: '',
    cgst_ledger_id: '',
    sgst_ledger_id: '',
    igst_ledger_id: '',
    cgst_amount: '0',
    sgst_amount: '0',
    igst_amount: '0',
    challan_number: '',
    challan_date: '',
    narration: '',
  });

  // Fetch ledgers
  const { data: ledgersData, loading: ledgersLoading } = useApi(
    () => accountingAPI.ledgers.list({ limit: 1000, is_active: true }),
    true
  );

  const ledgers = useMemo(() => ledgersData?.data || ledgersData || [], [ledgersData]);

  // Filter for bank/cash ledgers
  const bankLedgers = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];
    return ledgers.filter((ledger) => {
      const groupName = (
        ledger.account_group?.group_name || 
        ledger.account_group?.name || 
        ledger.account_group_name ||
        ''
      ).toLowerCase();
      return (
        groupName.includes('bank') ||
        groupName.includes('cash') ||
        groupName.includes('current account')
      );
    });
  }, [ledgers]);

  // Filter for GST liability ledgers
  const gstLedgers = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];
    return ledgers.filter((ledger) => {
      const ledgerName = (ledger.ledger_name || '').toLowerCase();
      const groupName = (
        ledger.account_group?.group_name || 
        ledger.account_group?.name || 
        ledger.account_group_name ||
        ''
      ).toLowerCase();
      return (
        ledgerName.includes('cgst') ||
        ledgerName.includes('sgst') ||
        ledgerName.includes('igst') ||
        groupName.includes('duties') ||
        groupName.includes('taxes')
      );
    });
  }, [ledgers]);

  const bankOptions = bankLedgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const cgstOptions = gstLedgers.filter((l) => (l.ledger_name || '').toLowerCase().includes('cgst')).map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const sgstOptions = gstLedgers.filter((l) => (l.ledger_name || '').toLowerCase().includes('sgst')).map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const igstOptions = gstLedgers.filter((l) => (l.ledger_name || '').toLowerCase().includes('igst')).map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Calculate total GST amount
  const totalGST = useMemo(() => {
    return (
      parseFloat(formData.cgst_amount || 0) +
      parseFloat(formData.sgst_amount || 0) +
      parseFloat(formData.igst_amount || 0)
    );
  }, [formData.cgst_amount, formData.sgst_amount, formData.igst_amount]);

  const validate = () => {
    const newErrors = {};

    if (!formData.bank_ledger_id) {
      newErrors.bank_ledger_id = 'Bank/Cash account is required';
    }
    if (!formData.voucher_date) {
      newErrors.voucher_date = 'Date is required';
    }
    if (totalGST <= 0) {
      newErrors.amount = 'At least one GST amount must be greater than 0';
    }
    if (formData.cgst_amount > 0 && !formData.cgst_ledger_id) {
      newErrors.cgst_ledger_id = 'CGST ledger is required when CGST amount is entered';
    }
    if (formData.sgst_amount > 0 && !formData.sgst_ledger_id) {
      newErrors.sgst_ledger_id = 'SGST ledger is required when SGST amount is entered';
    }
    if (formData.igst_amount > 0 && !formData.igst_ledger_id) {
      newErrors.igst_ledger_id = 'IGST ledger is required when IGST amount is entered';
    }

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
      // Create ledger entries for GST payment
      // Debit GST liability ledgers, Credit Bank/Cash
      const ledgerEntries = [];

      // Credit bank/cash
      ledgerEntries.push({
        ledger_id: formData.bank_ledger_id,
        debit_amount: 0,
        credit_amount: totalGST,
        narration: 'GST Payment',
      });

      // Debit CGST
      if (parseFloat(formData.cgst_amount) > 0 && formData.cgst_ledger_id) {
        ledgerEntries.push({
          ledger_id: formData.cgst_ledger_id,
          debit_amount: parseFloat(formData.cgst_amount),
          credit_amount: 0,
          narration: 'CGST Payment',
        });
      }

      // Debit SGST
      if (parseFloat(formData.sgst_amount) > 0 && formData.sgst_ledger_id) {
        ledgerEntries.push({
          ledger_id: formData.sgst_ledger_id,
          debit_amount: parseFloat(formData.sgst_amount),
          credit_amount: 0,
          narration: 'SGST Payment',
        });
      }

      // Debit IGST
      if (parseFloat(formData.igst_amount) > 0 && formData.igst_ledger_id) {
        ledgerEntries.push({
          ledger_id: formData.igst_ledger_id,
          debit_amount: parseFloat(formData.igst_amount),
          credit_amount: 0,
          narration: 'IGST Payment',
        });
      }

      await accountingAPI.vouchers.create({
        voucher_type: 'GST Payment',
        voucher_date: formData.voucher_date,
        narration: formData.narration || `GST Payment - Challan: ${formData.challan_number || 'N/A'}`,
        reference_number: formData.challan_number || null,
        reference_date: formData.challan_date || null,
        total_amount: totalGST,
        ledger_entries,
      });

      toast.success('GST payment voucher created successfully');
      router.push('/client/vouchers/vouchers');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create GST payment voucher';
      toast.error(errorMessage);
      console.error('Error creating GST payment voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="GST Payment">
        <PageLayout
          title="Create GST Payment Voucher"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'GST Payment' },
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
                <span>{loading ? 'Saving...' : 'Save Payment'}</span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">GST Payment Details</h2>
                <p className="text-sm text-gray-500 mt-1">Record payment of GST to government</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  name="bank_ledger_id"
                  label="Bank/Cash Account"
                  value={formData.bank_ledger_id}
                  onChange={handleFormChange}
                  options={bankOptions}
                  error={errors.bank_ledger_id}
                  placeholder="Select bank/cash account"
                  required
                  disabled={ledgersLoading}
                />

                <FormDatePicker
                  name="voucher_date"
                  label="Payment Date"
                  value={formData.voucher_date}
                  onChange={handleFormChange}
                  error={errors.voucher_date}
                  required
                />

                <FormInput
                  name="challan_number"
                  label="Challan Number"
                  value={formData.challan_number}
                  onChange={handleFormChange}
                  error={errors.challan_number}
                  placeholder="Enter GST challan number"
                />

                <FormDatePicker
                  name="challan_date"
                  label="Challan Date"
                  value={formData.challan_date}
                  onChange={handleFormChange}
                  error={errors.challan_date}
                />
              </div>

              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">GST Amounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FormSelect
                      name="cgst_ledger_id"
                      label="CGST Ledger"
                      value={formData.cgst_ledger_id}
                      onChange={handleFormChange}
                      options={cgstOptions}
                      error={errors.cgst_ledger_id}
                      placeholder="Select CGST ledger"
                      disabled={ledgersLoading}
                    />
                    <FormInput
                      name="cgst_amount"
                      label="CGST Amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cgst_amount}
                      onChange={handleFormChange}
                      error={errors.cgst_amount}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <FormSelect
                      name="sgst_ledger_id"
                      label="SGST Ledger"
                      value={formData.sgst_ledger_id}
                      onChange={handleFormChange}
                      options={sgstOptions}
                      error={errors.sgst_ledger_id}
                      placeholder="Select SGST ledger"
                      disabled={ledgersLoading}
                    />
                    <FormInput
                      name="sgst_amount"
                      label="SGST Amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sgst_amount}
                      onChange={handleFormChange}
                      error={errors.sgst_amount}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <FormSelect
                      name="igst_ledger_id"
                      label="IGST Ledger"
                      value={formData.igst_ledger_id}
                      onChange={handleFormChange}
                      options={igstOptions}
                      error={errors.igst_ledger_id}
                      placeholder="Select IGST ledger"
                      disabled={ledgersLoading}
                    />
                    <FormInput
                      name="igst_amount"
                      label="IGST Amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.igst_amount}
                      onChange={handleFormChange}
                      error={errors.igst_amount}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {errors.amount && (
                <div className="mt-2 text-red-600 text-sm">{errors.amount}</div>
              )}

              <div className="mt-4">
                <div className="flex justify-end">
                  <div className="w-full md:w-96">
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Total GST Payment:</span>
                      <span>{formatCurrency(totalGST)}</span>
                    </div>
                  </div>
                </div>
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
          </form>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
