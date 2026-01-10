import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { useTable } from '../../hooks/useTable';
import { adminAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import { FiDollarSign, FiSave, FiX } from 'react-icons/fi';

export default function CommissionsPayoutsList() {
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
      <AdminLayout>
        <Toaster />
        <PageLayout
          title="Commission & Payout Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Commissions & Payouts' },
          ]}
        >
          <Card className="shadow-sm border border-gray-200">
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
          </Card>
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
          {updating && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {selectedRow && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FiDollarSign className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">User Information</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusModalOpen(false);
                    setSelectedRow(null);
                    setStatusForm({ status: 'pending', remark: '' });
                  }}
                  disabled={updating}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate} disabled={updating} loading={updating}>
                  <FiSave className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </AdminLayout>
    </ProtectedRoute>
  );
}
