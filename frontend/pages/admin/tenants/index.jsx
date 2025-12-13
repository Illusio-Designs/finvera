import { useState } from 'react';
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
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function TenantsList() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleDelete = async (id) => {
    try {
      await adminAPI.tenants.delete(id);
      toast.success('Tenant deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tenant');
    }
  };

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

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/tenants/${row.id}`);
        }}
      >
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/tenants/edit/${row.id}`);
        }}
      >
        Edit
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteId(row.id);
          setShowDeleteDialog(true);
        }}
      >
        Delete
      </Button>
    </div>
  );

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
            actions={actions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            sortField={sort.field}
            sortOrder={sort.order}
            onRowClick={(row) => router.push(`/admin/tenants/${row.id}`)}
          />

          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
            onConfirm={() => handleDelete(deleteId)}
            title="Delete Tenant"
            message="Are you sure you want to delete this tenant? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

