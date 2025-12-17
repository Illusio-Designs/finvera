import { useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Card from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';

export default function StockSummary() {
  const { data, loading, execute } = useApi(() => reportsAPI.stockSummary(), false);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.data?.data || data?.data || [];
  const totals = data?.data?.totals || data?.totals || {};

  const columns = [
    { key: 'item_name', label: 'Item', sortable: true },
    { key: 'hsn_sac_code', label: 'HSN/SAC', sortable: true, render: (v) => v || '-' },
    { key: 'uqc', label: 'UQC', sortable: true, render: (v) => v || '-' },
    { key: 'quantity_on_hand', label: 'Qty', sortable: true, render: (v) => v ?? 0 },
    { key: 'avg_cost', label: 'Avg Cost', sortable: true, render: (v) => formatCurrency(v || 0) },
    { key: 'stock_value', label: 'Value', sortable: true, render: (v) => formatCurrency(v || 0) },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Stock Summary - Client Portal">
        <Toaster />
        <PageLayout
          title="Stock Summary"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports/trial-balance' },
            { label: 'Stock Summary' },
          ]}
          actions={
            <button
              className="text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              type="button"
              onClick={() => toast.info('Export coming soon')}
            >
              Export
            </button>
          }
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={rows || []} loading={loading} searchable />
              <Card title="Totals" className="mt-6">
                <div className="text-sm text-gray-600">
                  Stock Value: <span className="font-semibold text-gray-900">{formatCurrency(totals.stock_value || 0)}</span>
                </div>
              </Card>
            </>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

