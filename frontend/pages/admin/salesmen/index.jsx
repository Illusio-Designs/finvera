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

export default function SalesmenList() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.salesmen.list, {});

  const handleDelete = async (id) => {
    try {
      await adminAPI.salesmen.delete(id);
      toast.success('Salesman deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete salesman');
    }
  };

  const columns = [
    { key: 'salesman_code', label: 'Code', sortable: true },
    { key: 'full_name', label: 'Name', sortable: true },
    {
      key: 'commission_rate',
      label: 'Commission Rate',
      sortable: true,
      render: (value) => (value ? `${value}%` : 'N/A'),
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

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/salesmen/${row.id}`);
        }}
      >
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/salesmen/edit/${row.id}`);
        }}
      >
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/salesmen/${row.id}/performance`);
        }}
      >
        Performance
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
      <AdminLayout title="Salesmen - Admin Panel">
        <Toaster />
        <PageLayout
          title="Salesman Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Salesmen' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/salesmen/new')}>
              Add Salesman
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
            onRowClick={(row) => router.push(`/admin/salesmen/${row.id}`)}
          />

          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
            onConfirm={() => handleDelete(deleteId)}
            title="Delete Salesman"
            message="Are you sure you want to delete this salesman?"
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

