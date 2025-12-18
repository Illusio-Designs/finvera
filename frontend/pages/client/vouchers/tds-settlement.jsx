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

export default function TDSSettlementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    bank_ledger_id: '',
    tds_ledger_id: '',
    amount: '',
    tds_section: '',
    settlement_type: 'payment',
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

  // Filter for TDS payable ledgers
  const tdsLedgers = useMemo(() => {
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
        ledgerName.includes('tds') ||
        ledgerName.includes('tax deducted') ||
        groupName.includes('duties') ||
        groupName.includes('taxes')
      );
    });
  }, [ledgers]);

  const bankOptions = bankLedgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const tdsOptions = tdsLedgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const tdsSectionOptions = [
    { value: '194A', label: '194A - Interest other than interest on securities' },
    { value: '194C', label: '194C - Payment to contractors' },
    { value: '194H', label: '194H - Commission or brokerage' },
    { value: '194I', label: '194I - Rent' },
    { value: '194J', label: '194J - Professional or technical services' },
    { value: '194Q', label: '194Q - Purchase of goods' },
    { value: '194S', label: '194S - TDS on transfer of virtual digital assets' },
    { value: 'other', label: 'Other' },
  ];

  const settlementTypeOptions = [
    { value: 'payment', label: 'Payment to Government' },
    { value: 'adjustment', label: 'Adjustment/Refund' },
    { value: 'other', label: 'Other Settlement' },
  ];

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.bank_ledger_id) {
      newErrors.bank_ledger_id = 'Bank/Cash account is required';
    }
    if (!formData.tds_ledger_id) {
      newErrors.tds_ledger_id = 'TDS ledger is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.voucher_date) {
      newErrors.voucher_date = 'Date is required';
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
      const amount = parseFloat(formData.amount);

      // Create ledger entries for TDS settlement
      // Debit TDS payable ledger, Credit Bank/Cash (for payment)
      // Or reverse for adjustment/refund
      const ledgerEntries = [];

      if (formData.settlement_type === 'payment') {
        // Payment: Debit TDS, Credit Bank
        ledgerEntries.push({
          ledger_id: formData.tds_ledger_id,
          debit_amount: amount,
          credit_amount: 0,
          narration: `TDS Settlement - Section ${formData.tds_section || 'N/A'}`,
        });
        ledgerEntries.push({
          ledger_id: formData.bank_ledger_id,
          debit_amount: 0,
          credit_amount: amount,
          narration: 'TDS Settlement Payment',
        });
      } else if (formData.settlement_type === 'adjustment') {
        // Adjustment/Refund: Debit Bank, Credit TDS
        ledgerEntries.push({
          ledger_id: formData.bank_ledger_id,
          debit_amount: amount,
          credit_amount: 0,
          narration: 'TDS Settlement - Adjustment/Refund',
        });
        ledgerEntries.push({
          ledger_id: formData.tds_ledger_id,
          debit_amount: 0,
          credit_amount: amount,
          narration: `TDS Settlement - Section ${formData.tds_section || 'N/A'}`,
        });
      } else {
        // Other: Standard payment flow
        ledgerEntries.push({
          ledger_id: formData.tds_ledger_id,
          debit_amount: amount,
          credit_amount: 0,
          narration: `TDS Settlement - Section ${formData.tds_section || 'N/A'}`,
        });
        ledgerEntries.push({
          ledger_id: formData.bank_ledger_id,
          debit_amount: 0,
          credit_amount: amount,
          narration: 'TDS Settlement',
        });
      }

      await accountingAPI.vouchers.create({
        voucher_type: 'TDS Settlement',
        voucher_date: formData.voucher_date,
        narration: formData.narration || `TDS Settlement - ${formData.settlement_type} - Section ${formData.tds_section || 'N/A'} - Challan: ${formData.challan_number || 'N/A'}`,
        reference_number: formData.challan_number || null,
        reference_date: formData.challan_date || null,
        total_amount: amount,
        ledger_entries,
      });

      toast.success('TDS settlement voucher created successfully');
      router.push('/client/vouchers/vouchers');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create TDS settlement voucher';
      toast.error(errorMessage);
      console.error('Error creating TDS settlement voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="TDS Settlement">
        <PageLayout
          title="Create TDS Settlement Voucher"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'TDS Settlement' },
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
                <span>{loading ? 'Saving...' : 'Save Settlement'}</span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">TDS Settlement Details</h2>
                <p className="text-sm text-gray-500 mt-1">Record TDS settlement (payment, adjustment, or refund)</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  name="settlement_type"
                  label="Settlement Type"
                  value={formData.settlement_type}
                  onChange={handleFormChange}
                  options={settlementTypeOptions}
                  error={errors.settlement_type}
                  required
                />

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

                <FormSelect
                  name="tds_ledger_id"
                  label="TDS Payable Ledger"
                  value={formData.tds_ledger_id}
                  onChange={handleFormChange}
                  options={tdsOptions}
                  error={errors.tds_ledger_id}
                  placeholder="Select TDS ledger"
                  required
                  disabled={ledgersLoading}
                />

                <FormDatePicker
                  name="voucher_date"
                  label="Settlement Date"
                  value={formData.voucher_date}
                  onChange={handleFormChange}
                  error={errors.voucher_date}
                  required
                />

                <FormInput
                  name="amount"
                  label="Settlement Amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={handleFormChange}
                  error={errors.amount}
                  placeholder="Enter settlement amount"
                  required
                />

                <FormSelect
                  name="tds_section"
                  label="TDS Section"
                  value={formData.tds_section}
                  onChange={handleFormChange}
                  options={tdsSectionOptions}
                  error={errors.tds_section}
                  placeholder="Select TDS section"
                />

                <FormInput
                  name="challan_number"
                  label="Challan/Reference Number"
                  value={formData.challan_number}
                  onChange={handleFormChange}
                  error={errors.challan_number}
                  placeholder="Enter challan or reference number"
                />

                <FormDatePicker
                  name="challan_date"
                  label="Challan/Reference Date"
                  value={formData.challan_date}
                  onChange={handleFormChange}
                  error={errors.challan_date}
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
          </form>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
