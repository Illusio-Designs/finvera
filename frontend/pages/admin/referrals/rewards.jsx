import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import { useTable } from '../../../hooks/useTable';
import { referralAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/formatters';

export default function ReferralRewards() {
  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(referralAPI.getRewards, {});

  const columns = [
    {
      key: 'referrer_type',
      label: 'Referrer Type',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
    {
      key: 'reward_type',
      label: 'Reward Type',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'reward_amount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'reward_status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          pending: 'warning',
          paid: 'success',
          cancelled: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'reward_date',
      label: 'Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Referral Rewards - Admin Panel">
        <PageLayout
          title="Referral Rewards"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Referrals', href: '/admin/referrals' },
            { label: 'Rewards' },
          ]}
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
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

