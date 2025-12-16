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
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfitLoss() {
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const { data, loading, execute } = useApi(
    () => reportsAPI.profitLoss(dateRange),
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

  const reportData = data?.data || data || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Profit & Loss - Client Portal">
        <Toaster />
        <PageLayout
          title="Profit & Loss Statement"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Profit & Loss' },
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

          {reportData.income && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Income">
                <div className="space-y-4">
                  {reportData.income.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                    <span>Total Income</span>
                    <span>{formatCurrency(reportData.total_income || 0)}</span>
                  </div>
                </div>
              </Card>

              <Card title="Expenses">
                <div className="space-y-4">
                  {reportData.expenses?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(reportData.total_expenses || 0)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {reportData.net_profit !== undefined && (
            <Card title="Net Profit/Loss" className="mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(reportData.net_profit || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {reportData.net_profit >= 0 ? 'Profit' : 'Loss'}
                </div>
              </div>
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

