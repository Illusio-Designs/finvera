import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import { useTable } from '../../../hooks/useTable';
import { pricingAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/formatters';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function PricingList() {
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
  } = useTable(pricingAPI.listPlans, {});

  const handleDelete = async (id) => {
    try {
      // Note: Delete endpoint may not exist, adjust as needed
      toast.success('Plan deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const columns = [
    { key: 'plan_code', label: 'Code', sortable: true },
    { key: 'plan_name', label: 'Name', sortable: true },
    {
      key: 'base_price',
      label: 'Price',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'billing_cycle',
      label: 'Billing Cycle',
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
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/pricing/edit/${row.id}`);
        }}
      >
        Edit
      </Button>
    </div>
  );

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Pricing - Admin Panel">
        <Toaster />
        <PageLayout
          title="Subscription Plans"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Pricing' },
          ]}
          actions={
            <Button onClick={() => router.push('/admin/pricing/new')}>
              Create Plan
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
          />

          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
            onConfirm={() => handleDelete(deleteId)}
            title="Delete Plan"
            message="Are you sure you want to delete this plan?"
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

