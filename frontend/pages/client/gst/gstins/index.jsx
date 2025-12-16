import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import DataTable from '../../../../components/tables/DataTable';
import Button from '../../../../components/ui/Button';
import { useTable } from '../../../../hooks/useTable';
import { gstAPI } from '../../../../lib/api';
import Badge from '../../../../components/ui/Badge';

export default function GSTINsList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(gstAPI.gstins.list, {});

  const columns = [
    { key: 'gstin', label: 'GSTIN', sortable: true },
    {
      key: 'is_primary',
      label: 'Primary',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { key: 'business_name', label: 'Business Name', sortable: true },
    { key: 'state', label: 'State', sortable: true },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="GSTINs - Client Portal">
        <PageLayout
          title="GSTIN Management"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GST', href: '/client/gst' },
            { label: 'GSTINs' },
          ]}
          actions={
            <Button onClick={() => router.push('/client/gst/gstins/new')}>
              Add GSTIN
            </Button>
          }
        >
          <DataTable
            columns={columns}
            data={tableData?.data || tableData || []}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            sortField={sort.field}
            sortOrder={sort.order}
            onRowClick={(row) => router.push(`/client/gst/gstins/edit/${row.id}`)}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

