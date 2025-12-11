import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import FormSelect from '../../../components/forms/FormSelect';
import Button from '../../../components/ui/Button';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI, accountingAPI } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../lib/dateUtils';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

export default function LedgerStatementReport() {
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });
  const [ledgerId, setLedgerId] = useState('');

  const { data: ledgersData } = useApi(() => accountingAPI.ledgers.list({ limit: 1000 }), true);
  const { data, loading, execute } = useApi(
    () => reportsAPI.ledgerStatement({ ...dateRange, ledger_id: ledgerId }),
    false
  );

  const ledgers = ledgersData?.data || ledgersData || [];
  const ledgerOptions = ledgers.map((l) => ({
    value: l.id,
    label: `${l.ledger_code} - ${l.ledger_name}`,
  }));

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    if (!ledgerId) {
      toast.error('Please select a ledger');
      return;
    }
    execute();
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value, 'DD-MM-YYYY'),
    },
    {
      key: 'voucher_number',
      label: 'Voucher No.',
    },
    {
      key: 'particulars',
      label: 'Particulars',
    },
    {
      key: 'debit',
      label: 'Debit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatCurrency(value || 0),
    },
  ];

  const reportData = data?.data || data || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Ledger Statement - Client Portal">
        <Toaster />
        <PageLayout
          title="Ledger Statement"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Ledger Statement' },
          ]}
          actions={
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          }
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect
                name="ledger_id"
                label="Ledger"
                value={ledgerId}
                onChange={(name, value) => setLedgerId(value)}
                options={ledgerOptions}
                required
              />
              <FormDatePicker
                name="from_date"
                label="From Date"
                value={dateRange.from_date}
                onChange={(name, value) => handleDateChange('from_date', value)}
              />
              <FormDatePicker
                name="to_date"
                label="To Date"
                value={dateRange.to_date}
                onChange={(name, value) => handleDateChange('to_date', value)}
              />
            </div>
            <div className="mt-4">
              <Button onClick={handleGenerate} loading={loading}>
                Generate Report
              </Button>
            </div>
          </Card>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {reportData.transactions && (
            <>
              <DataTable
                columns={columns}
                data={reportData.transactions || []}
                loading={loading}
              />

              {reportData.summary && (
                <Card title="Summary" className="mt-6">
                  <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Opening Balance</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.opening_balance || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Debit</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.total_debit || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Credit</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.total_credit || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Closing Balance</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.closing_balance || 0)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              )}
            </>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

