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
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import { formatCurrency } from '../../../lib/formatters';

export default function JournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    narration: '',
  });

  const [entries, setEntries] = useState([
    {
      id: Date.now(),
      ledger_id: '',
      debit_amount: '0',
      credit_amount: '0',
      narration: '',
    },
    {
      id: Date.now() + 1,
      ledger_id: '',
      debit_amount: '0',
      credit_amount: '0',
      narration: '',
    },
  ]);

  // Fetch ledgers
  const { data: ledgersData, loading: ledgersLoading } = useApi(
    () => accountingAPI.ledgers.list({ limit: 1000, is_active: true }),
    true
  );

  const ledgers = useMemo(() => ledgersData?.data || ledgersData || [], [ledgersData]);

  const ledgerOptions = ledgers.map((ledger) => ({
    value: ledger.id,
    label: `${ledger.ledger_name}${ledger.ledger_code ? ` (${ledger.ledger_code})` : ''}`,
  }));

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEntryChange = (entryId, field, value) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        return { ...entry, [field]: value };
      })
    );
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        ledger_id: '',
        debit_amount: '0',
        credit_amount: '0',
        narration: '',
      },
    ]);
  };

  const removeEntry = (entryId) => {
    if (entries.length > 2) {
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach((entry) => {
      totalDebit += parseFloat(entry.debit_amount) || 0;
      totalCredit += parseFloat(entry.credit_amount) || 0;
    });

    return {
      totalDebit,
      totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }, [entries]);

  const validate = () => {
    const newErrors = {};

    if (!formData.voucher_date) {
      newErrors.voucher_date = 'Date is required';
    }

    if (entries.length < 2) {
      newErrors.entries = 'At least two entries are required';
    }

    entries.forEach((entry, index) => {
      if (!entry.ledger_id) {
        newErrors[`ledger_${index}`] = 'Ledger is required';
      }
      const debit = parseFloat(entry.debit_amount) || 0;
      const credit = parseFloat(entry.credit_amount) || 0;
      if (debit === 0 && credit === 0) {
        newErrors[`amount_${index}`] = 'Either debit or credit amount is required';
      }
      if (debit > 0 && credit > 0) {
        newErrors[`amount_${index}`] = 'Cannot have both debit and credit amounts';
      }
    });

    if (!totals.isBalanced) {
      newErrors.balance = `Journal entry must balance. Difference: ${formatCurrency(totals.difference)}`;
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
      const ledgerEntries = entries.map((entry) => ({
        ledger_id: entry.ledger_id,
        debit_amount: parseFloat(entry.debit_amount) || 0,
        credit_amount: parseFloat(entry.credit_amount) || 0,
        narration: entry.narration || null,
      }));

      await accountingAPI.journals.create({
        voucher_date: formData.voucher_date,
        narration: formData.narration || null,
        ledger_entries,
      });
      toast.success('Journal voucher created successfully');
      router.push('/client/vouchers/vouchers');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create journal voucher';
      toast.error(errorMessage);
      console.error('Error creating journal voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Journal Voucher">
        <PageLayout
          title="Create Journal Voucher"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: 'Journal' },
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
                <span>{loading ? 'Saving...' : 'Save Journal'}</span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Journal Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker
                  name="voucher_date"
                  label="Journal Date"
                  value={formData.voucher_date}
                  onChange={handleFormChange}
                  error={errors.voucher_date}
                  required
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

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Ledger Entries</h2>
                <Button type="button" onClick={addEntry} variant="outline" className="flex items-center gap-2">
                  <FiPlus className="h-4 w-4" />
                  <span>Add Entry</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ledger</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narration</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-2">
                          <FormSelect
                            name={`ledger_${entry.id}`}
                            value={entry.ledger_id}
                            onChange={(name, value) => handleEntryChange(entry.id, 'ledger_id', value)}
                            options={ledgerOptions}
                            error={errors[`ledger_${index}`]}
                            placeholder="Select ledger"
                            required
                            disabled={ledgersLoading}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`debit_${entry.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={entry.debit_amount}
                            onChange={(name, value) => {
                              handleEntryChange(entry.id, 'debit_amount', value);
                              if (parseFloat(value) > 0) {
                                handleEntryChange(entry.id, 'credit_amount', '0');
                              }
                            }}
                            error={errors[`amount_${index}`]}
                            placeholder="0.00"
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`credit_${entry.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={entry.credit_amount}
                            onChange={(name, value) => {
                              handleEntryChange(entry.id, 'credit_amount', value);
                              if (parseFloat(value) > 0) {
                                handleEntryChange(entry.id, 'debit_amount', '0');
                              }
                            }}
                            error={errors[`amount_${index}`]}
                            placeholder="0.00"
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormInput
                            name={`entry_narration_${entry.id}`}
                            value={entry.narration}
                            onChange={(name, value) => handleEntryChange(entry.id, 'narration', value)}
                            placeholder="Entry narration"
                            className="text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {entries.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeEntry(entry.id)}
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

              {errors.balance && (
                <div className="mt-4 text-red-600 text-sm">{errors.balance}</div>
              )}

              <div className="mt-4 flex justify-end">
                <div className="w-full md:w-96 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Debit:</span>
                    <span className="font-medium">{formatCurrency(totals.totalDebit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Credit:</span>
                    <span className="font-medium">{formatCurrency(totals.totalCredit)}</span>
                  </div>
                  <div className={`flex justify-between border-t pt-2 ${totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Difference:</span>
                    <span className="font-bold">{formatCurrency(totals.difference)}</span>
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
