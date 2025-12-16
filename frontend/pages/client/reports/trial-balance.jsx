import { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import Button from '../../../components/ui/Button';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../lib/dateUtils';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

export default function TrialBalance() {
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const { data, loading, execute } = useApi(
    () => reportsAPI.trialBalance(dateRange),
    false
  );

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    execute();
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const columns = [
    {
      key: 'ledger_name',
      label: 'Ledger Name',
      sortable: true,
    },
    {
      key: 'debit',
      label: 'Debit',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'credit',
      label: 'Credit',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
  ];

  const reportData = data?.data || data || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Trial Balance - Client Portal">
        <Toaster />
        <PageLayout
          title="Trial Balance"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Trial Balance' },
          ]}
          actions={
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          }
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {reportData.ledgers && (
            <>
              <DataTable
                columns={columns}
                data={reportData.ledgers || []}
                loading={loading}
              />

              {reportData.summary && (
                <Card title="Summary" className="mt-6">
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      <dt className="text-sm font-medium text-gray-500">Difference</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(
                          (reportData.summary.total_debit || 0) - (reportData.summary.total_credit || 0)
                        )}
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

