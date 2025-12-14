import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import { useTable } from '../../../hooks/useTable';
import { referralAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';

export default function ReferralsList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(referralAPI.listCodes, {});

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    {
      key: 'owner_type',
      label: 'Owner Type',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
    {
      key: 'discount_type',
      label: 'Discount Type',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'current_uses',
      label: 'Uses',
      sortable: true,
      render: (value, row) => `${value || 0} / ${row.max_uses || '∞'}`,
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Referrals - Admin Panel">
        <PageLayout
          title="Referral Code Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Referrals' },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/referrals/rewards')}
              >
                View Rewards
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/referrals/discount-config')}
              >
                Discount Settings
              </Button>
              <Button onClick={() => router.push('/admin/referrals/new')}>
                Create Referral Code
              </Button>
            </>
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
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

