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

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    bank_ledger_id: '',
    amount: '',
    payment_mode: 'cash',
    narration: '',
  });

  // Fetch ledgers
  const { data: ledgersData, loading: ledgersLoading } = useApi(
    () => accountingAPI.ledgers.list({ limit: 1000, is_active: true }),
    true
  );

  const ledgers = useMemo(() => ledgersData?.data || ledgersData || [], [ledgersData]);

  // Filter for party ledgers (suppliers/creditors) and bank/cash ledgers
  const partyLedgers = useMemo(() => {
    if (!ledgers || ledgers.length === 0) return [];
    return ledgers.filter((ledger) => {
      const groupName = (
        ledger.account_group?.group_name || 
        ledger.account_group?.name || 
        ledger.account_group_name ||
        ''
      ).toLowerCase();
      return (
        groupName.includes('sundry creditor') ||
        groupName.includes('creditor') ||
        groupName.includes('expense')
      );
    });
  }, [ledgers]);

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

  const partyOptions = partyLedgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const bankOptions = bankLedgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const paymentModeOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'neft', label: 'NEFT' },
    { value: 'rtgs', label: 'RTGS' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'other', label: 'Other' },
  ];

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.party_ledger_id) {
      newErrors.party_ledger_id = 'Party is required';
    }
    if (!formData.bank_ledger_id) {
      newErrors.bank_ledger_id = 'Bank/Cash account is required';
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
      await accountingAPI.payments.create({
        voucher_date: formData.voucher_date,
        party_ledger_id: formData.party_ledger_id,
        bank_ledger_id: formData.bank_ledger_id,
        amount: parseFloat(formData.amount),
        payment_mode: formData.payment_mode,
        narration: formData.narration || null,
      });
      toast.success('Payment voucher created successfully');
      router.push('/client/vouchers/vouchers');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create payment voucher';
      toast.error(errorMessage);
      console.error('Error creating payment voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Payment Voucher">
        <PageLayout
          title="Create Payment Voucher"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'Payment' },
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
                <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  name="party_ledger_id"
                  label="Party (Supplier/Creditor)"
                  value={formData.party_ledger_id}
                  onChange={handleFormChange}
                  options={partyOptions}
                  error={errors.party_ledger_id}
                  placeholder="Select party"
                  required
                  disabled={ledgersLoading}
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

                <FormDatePicker
                  name="voucher_date"
                  label="Payment Date"
                  value={formData.voucher_date}
                  onChange={handleFormChange}
                  error={errors.voucher_date}
                  required
                />

                <FormInput
                  name="amount"
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={handleFormChange}
                  error={errors.amount}
                  placeholder="Enter amount"
                  required
                />

                <FormSelect
                  name="payment_mode"
                  label="Payment Mode"
                  value={formData.payment_mode}
                  onChange={handleFormChange}
                  options={paymentModeOptions}
                  error={errors.payment_mode}
                />

                <div></div>
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
