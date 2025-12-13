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

export default function CommissionsList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(adminAPI.commissions.list, {});

  const columns = [
    {
      key: 'commission_type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant="primary">{value || 'N/A'}</Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'commission_rate',
      label: 'Rate',
      sortable: true,
      render: (value) => (value ? `${value}%` : 'N/A'),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          pending: 'warning',
          approved: 'info',
          paid: 'success',
          cancelled: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'commission_date',
      label: 'Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Commissions - Admin Panel">
        <PageLayout
          title="Commission Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Commissions' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/commissions/calculate')}>
              Calculate Commissions
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
            onRowClick={(row) => router.push(`/admin/commissions/${row.id}`)}
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

