import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import { useTable } from '../../../hooks/useTable';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Badge from '../../../components/ui/Badge';

export default function TenantsList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    error,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.tenants.list, {});

  const columns = [
    { key: 'company_name', label: 'Company Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'gstin', label: 'GSTIN', sortable: false },
    {
      key: 'subscription_plan',
      label: 'Plan',
      sortable: true,
      render: (value) => value || 'N/A',
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
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  // No actions for tenant rows - view only

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Tenants - Admin Panel">
        <Toaster />
        <PageLayout
          title="Tenant Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Tenants' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/tenants/new')}>
              Add Tenant
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
            onRowClick={(row) => router.push(`/admin/tenants/${row.id}`)}
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

