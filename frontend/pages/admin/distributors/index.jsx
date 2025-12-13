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

export default function DistributorsList() {
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
  } = useTable(adminAPI.distributors.list, {});

  const handleDelete = async (id) => {
    try {
      await adminAPI.distributors.delete(id);
      toast.success('Distributor deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete distributor');
    }
  };

  const columns = [
    { key: 'distributor_code', label: 'Code', sortable: true },
    { key: 'company_name', label: 'Company Name', sortable: true },
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
          router.push(`/admin/distributors/${row.id}`);
        }}
      >
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/distributors/edit/${row.id}`);
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
      <AdminLayout title="Distributors - Admin Panel">
        <Toaster />
        <PageLayout
          title="Distributor Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Distributors' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/distributors/new')}>
              Add Distributor
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
            onRowClick={(row) => router.push(`/admin/distributors/${row.id}`)}
          />

          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
            onConfirm={() => handleDelete(deleteId)}
            title="Delete Distributor"
            message="Are you sure you want to delete this distributor?"
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

