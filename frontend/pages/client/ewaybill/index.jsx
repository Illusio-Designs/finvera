import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useTable } from '../../../hooks/useTable';
import { eWayBillAPI } from '../../../lib/api';

export default function EWayBillList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(eWayBillAPI.list, {});

  const columns = [
    {
      key: 'eway_bill_no',
      label: 'E-Way Bill No',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'voucher_id',
      label: 'Voucher',
      sortable: false,
      render: (value) => (value ? String(value).slice(0, 8).toUpperCase() : 'N/A'),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          generated: 'success',
          cancelled: 'danger',
          pending: 'warning',
          failed: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'generated_at',
      label: 'Generated At',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleString() : ''),
    },
    {
      key: 'valid_upto',
      label: 'Valid Upto',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleString() : ''),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="E-Way Bill - Client Portal">
        <PageLayout
          title="E-Way Bill"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Compliance' },
            { label: 'E-Way Bill' },
          ]}
          actions={
            <Button onClick={() => router.push('/client/ewaybill/generate')}>
              Generate E-Way Bill
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
            onRowClick={(row) => router.push(`/client/ewaybill/${row.voucher_id}`)}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

