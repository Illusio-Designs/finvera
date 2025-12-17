import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import FormInput from '../../../components/forms/FormInput';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import Button from '../../../components/ui/Button';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../lib/dateUtils';

export default function StockLedger() {
  const [filters, setFilters] = useState({
    item_key: '',
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const { data, loading, execute } = useApi(() => reportsAPI.stockLedger(filters), false);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.data?.data || data?.data || [];

  const columns = [
    { key: 'date', label: 'Date', sortable: true, render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    { key: 'item_name', label: 'Item', sortable: true, render: (v) => v || '-' },
    { key: 'movement_type', label: 'Type', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true },
    { key: 'rate', label: 'Rate', sortable: true, render: (v) => formatCurrency(v || 0) },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => formatCurrency(v || 0) },
    { key: 'narration', label: 'Narration', sortable: false, render: (v) => v || '-' },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Stock Ledger - Client Portal">
        <PageLayout
          title="Stock Ledger"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports/trial-balance' },
            { label: 'Stock Ledger' },
          ]}
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                name="item_key"
                label="Item Key (optional)"
                value={filters.item_key}
                onChange={(name, value) => setFilters((p) => ({ ...p, item_key: value }))}
                placeholder="(item_code or name key)"
              />
              <FormDatePicker
                name="from_date"
                label="From Date"
                value={filters.from_date}
                onChange={(name, value) => setFilters((p) => ({ ...p, from_date: value }))}
              />
              <FormDatePicker
                name="to_date"
                label="To Date"
                value={filters.to_date}
                onChange={(name, value) => setFilters((p) => ({ ...p, to_date: value }))}
              />
            </div>
            <div className="mt-4">
              <Button onClick={() => execute()} loading={loading}>
                Refresh
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <DataTable columns={columns} data={rows || []} loading={loading} searchable />
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

