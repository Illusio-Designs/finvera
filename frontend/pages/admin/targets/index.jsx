import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useTable } from '../../../hooks/useTable';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../../lib/formatters';

export default function TargetsList() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.targets.list, {});

  const handleDelete = async (id) => {
    try {
      await adminAPI.targets.delete(id);
      toast.success('Target deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete target');
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      const response = await adminAPI.targets.recalculateAll();
      toast.success(response.data?.message || 'Achieved values recalculated successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to recalculate achieved values');
    } finally {
      setRecalculating(false);
    }
  };

  const columns = [
    {
      key: 'assignee',
      label: 'Assigned To',
      render: (_, row) => {
        if (row.Distributor) {
          return `${row.Distributor.distributor_code} - ${row.Distributor.company_name}`;
        } else if (row.Salesman) {
          return `${row.Salesman.salesman_code} - ${row.Salesman.full_name}`;
        }
        return 'N/A';
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (_, row) => (
        <Badge variant={row.Distributor ? 'primary' : 'info'}>
          {row.Distributor ? 'Distributor' : 'Salesman'}
        </Badge>
      ),
    },
    {
      key: 'target_type',
      label: 'Target Type',
      sortable: true,
      render: (value) => (
        <span className="capitalize">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'target_period',
      label: 'Period',
      sortable: true,
      render: (value) => (
        <span className="capitalize">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'target_value',
      label: 'Target',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'achieved_value',
      label: 'Achieved',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (_, row) => {
        const percentage = row.target_value > 0 
          ? ((row.achieved_value / row.target_value) * 100).toFixed(1) 
          : 0;
        const variant = percentage >= 100 ? 'success' : percentage >= 50 ? 'warning' : 'danger';
        return <Badge variant={variant}>{percentage}%</Badge>;
      },
    },
  ];

  const handleRecalculate = async (id, e) => {
    e.stopPropagation();
    try {
      await adminAPI.targets.recalculate(id);
      toast.success('Achieved value recalculated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to recalculate');
    }
  };

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleRecalculate(row.id, e)}
        title="Recalculate achieved value"
      >
        ↻
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/targets/edit/${row.id}`);
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
      <AdminLayout title="Targets - Admin Panel">
        <Toaster />
        <PageLayout
          title="Target Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Targets' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRecalculateAll}
                disabled={recalculating}
                loading={recalculating}
              >
                {recalculating ? 'Recalculating...' : 'Recalculate All'}
              </Button>
            <Button onClick={() => router.push('/admin/targets/new')}>
              Set Target
            </Button>
            </div>
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
            title="Delete Target"
            message="Are you sure you want to delete this target?"
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
