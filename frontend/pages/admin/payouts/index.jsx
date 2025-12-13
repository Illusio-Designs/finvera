import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import { useTable } from '../../../hooks/useTable';
import { adminAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/formatters';

export default function PayoutsList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(adminAPI.payouts.list, {});

  const columns = [
    {
      key: 'payout_type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant="primary">{value || 'N/A'}</Badge>
      ),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          pending: 'warning',
          processing: 'info',
          completed: 'success',
          failed: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'paid_date',
      label: 'Paid Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Payouts - Admin Panel">
        <PageLayout
          title="Payout Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Payouts' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/payouts/new')}>
              Create Payout
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
            onRowClick={(row) => router.push(`/admin/payouts/${row.id}`)}
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

