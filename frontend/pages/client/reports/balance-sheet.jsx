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
import { getEndOfMonth } from '../../../lib/dateUtils';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

export default function BalanceSheet() {
  const [asOnDate, setAsOnDate] = useState(getEndOfMonth());

  const { data, loading, execute } = useApi(
    () => reportsAPI.balanceSheet({ as_on_date: asOnDate }),
    false
  );

  const handleGenerate = () => {
    execute();
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const reportData = data?.data || data || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Balance Sheet - Client Portal">
        <Toaster />
        <PageLayout
          title="Balance Sheet"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Balance Sheet' },
          ]}
          actions={
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          }
        >
          <Card className="mb-6">
            <div className="max-w-xs">
              <FormDatePicker
                name="as_on_date"
                label="As On Date"
                value={asOnDate}
                onChange={(name, value) => setAsOnDate(value)}
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

          {reportData.assets && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Assets">
                <div className="space-y-4">
                  {reportData.assets.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                    <span>Total Assets</span>
                    <span>{formatCurrency(reportData.total_assets || 0)}</span>
                  </div>
                </div>
              </Card>

              <Card title="Liabilities & Capital">
                <div className="space-y-4">
                  {reportData.liabilities?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                    <span>Total Liabilities & Capital</span>
                    <span>{formatCurrency(reportData.total_liabilities || 0)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

