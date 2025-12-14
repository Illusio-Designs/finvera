import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { useTable } from '../../../hooks/useTable';
import { adminAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';

export default function CommissionsPayoutsList() {
  const router = useRouter();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'pending',
    remark: '',
  });
  const [updating, setUpdating] = useState(false);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.commissionPayouts.summary, {});

  const handleStatusClick = (row) => {
    setSelectedRow(row);
    setStatusForm({
      status: row.payout_status || 'pending',
      remark: row.payout_remark || '',
    });
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRow) return;

    if (statusForm.status === 'reject' && !statusForm.remark.trim()) {
      toast.error('Remark is required when rejecting payout');
      return;
    }

    setUpdating(true);
    try {
      await adminAPI.commissionPayouts.updateStatus(
        selectedRow.role,
        selectedRow.user_id,
        {
          status: statusForm.status,
          remark: statusForm.status === 'reject' ? statusForm.remark : null,
        }
      );
      toast.success('Payout status updated successfully');
      setStatusModalOpen(false);
      setSelectedRow(null);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payout status');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: 'user_name',
      label: 'User',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.user_code || ''}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'distributor' ? 'primary' : 'info'}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'total_commission',
      label: 'Total Commission',
      sortable: true,
      render: (value) => (
        <div className="font-semibold text-gray-900">{formatCurrency(value || 0)}</div>
      ),
    },
    {
      key: 'commission_count',
      label: 'Commission Count',
      sortable: true,
      render: (value) => <div className="text-gray-600">{value || 0}</div>,
    },
    {
      key: 'payout_status',
      label: 'Payout Status',
      sortable: true,
      render: (value, row) => {
        const variants = {
          pending: 'warning',
          paid: 'success',
          reject: 'danger',
        };
        return (
          <div>
            <Badge variant={variants[value] || 'default'}>
              {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Pending'}
            </Badge>
            {value === 'reject' && row.payout_remark && (
              <div className="text-xs text-gray-500 mt-1" title={row.payout_remark}>
                {row.payout_remark.length > 50
                  ? row.payout_remark.substring(0, 50) + '...'
                  : row.payout_remark}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const actions = (row) => (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleStatusClick(row);
      }}
    >
      Manage Status
    </Button>
  );

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Commissions & Payouts - Admin Panel">
        <Toaster />
        <PageLayout
          title="Commission & Payout Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Commissions & Payouts' },
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
            actions={actions}
          />
        </PageLayout>

        {/* Status Update Modal */}
        <Modal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedRow(null);
            setStatusForm({ status: 'pending', remark: '' });
          }}
          title="Manage Payout Status"
          size="md"
        >
          {selectedRow && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">User</div>
                <div className="font-semibold text-gray-900">{selectedRow.user_name}</div>
                <div className="text-sm text-gray-500">{selectedRow.user_code}</div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Total Commission: </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedRow.total_commission || 0)}
                  </span>
                </div>
              </div>

              <Select
                label="Payout Status"
                name="status"
                value={statusForm.status}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, status: e.target.value, remark: '' })
                }
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'reject', label: 'Reject' },
                ]}
                required
              />

              {statusForm.status === 'reject' && (
                <Textarea
                  label="Remark"
                  name="remark"
                  value={statusForm.remark}
                  onChange={(e) => setStatusForm({ ...statusForm, remark: e.target.value })}
                  placeholder="Enter reason for rejection"
                  required
                  rows={4}
                />
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusModalOpen(false);
                    setSelectedRow(null);
                    setStatusForm({ status: 'pending', remark: '' });
                  }}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate} disabled={updating}>
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </AdminLayout>
    </ProtectedRoute>
  );
}
