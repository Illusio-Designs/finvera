import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Card from '../../components/ui/Card';
import { useTable } from '../../hooks/useTable';
import { gstAPI } from '../../lib/api';

export default function GSTRatesList() {
  const { data, loading, pagination, handlePageChange, handleSort, sort } = useTable(gstAPI.rates.list, {});

  const columns = [
    { key: 'hsn_sac_code', label: 'HSN/SAC', sortable: true },
    { key: 'item_type', label: 'Type', sortable: true, render: (v) => v || 'goods' },
    { key: 'gst_rate', label: 'GST %', sortable: true, render: (v) => (v !== undefined && v !== null ? v : '-') },
    { key: 'is_active', label: 'Active', sortable: true, render: (v) => (v ? 'Yes' : 'No') },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="GST Rates - Client Portal">
        <PageLayout
          title="GST Rates"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GST Rates' },
          ]}
        >
          <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={data?.data || data || []}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
              searchable
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
