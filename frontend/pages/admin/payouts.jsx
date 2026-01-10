import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import Badge from '../../components/ui/Badge';
import { useTable } from '../../hooks/useTable';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency } from '../../lib/formatters';
import { FiPlus, FiSave, FiX, FiEye, FiDollarSign } from 'react-icons/fi';

export default function PayoutsList() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutType, setPayoutType] = useState('distributor');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payout_type: 'distributor',
    distributor_id: '',
    salesman_id: '',
    total_amount: '',
    payment_method: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const { data: salesmenData } = useApi(() => adminAPI.salesmen.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || distributorsData || [];
  const salesmen = salesmenData?.data || salesmenData || [];

  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: `${d.distributor_code} - ${d.company_name || 'N/A'}`,
  }));

  const salesmanOptions = salesmen.map((s) => ({
    value: s.id,
    label: `${s.salesman_code} - ${s.full_name}`,
  }));

  const recipientOptions = payoutType === 'distributor' ? distributorOptions : salesmanOptions;

  const {
    data: tableData,
    loading: tableLoading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(adminAPI.payouts.list, {});

  useEffect(() => {
    if (formData.payout_type) {
      setPayoutType(formData.payout_type);
    }
  }, [formData.payout_type]);

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleView = async (row) => {
    try {
      setLoading(true);
      const response = await adminAPI.payouts.get(row.id);
      const payout = response.data?.data || response.data;
      setSelectedPayout(payout);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load payout details');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedPayout) return;
    try {
      setLoading(true);
      await adminAPI.payouts.process(selectedPayout.id, {});
      toast.success('Payout processed successfully');
      setShowDetailModal(false);
      setSelectedPayout(null);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payout');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.total_amount) errors.total_amount = 'Total amount is required';
    if (payoutType === 'distributor' && !formData.distributor_id) {
      errors.distributor_id = 'Please select a distributor';
    }
    if (payoutType === 'salesman' && !formData.salesman_id) {
      errors.salesman_id = 'Please select a salesman';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        payout_type: formData.payout_type,
        total_amount: parseFloat(formData.total_amount),
        payment_method: formData.payment_method,
        notes: formData.notes,
      };

      if (formData.payout_type === 'distributor') {
        payload.distributor_id = formData.distributor_id;
      } else {
        payload.salesman_id = formData.salesman_id;
      }

      await adminAPI.payouts.create(payload);
      toast.success('Payout created successfully');
      setShowModal(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create payout');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      payout_type: 'distributor',
      distributor_id: '',
      salesman_id: '',
      total_amount: '',
      payment_method: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const columns = [
    {
      key: 'payout_type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant="primary">{value || 'N/A'}</Badge>
      ),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          pending: 'warning',
          processing: 'info',
          completed: 'success',
          failed: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'paid_date',
      label: 'Paid Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => handleView(row)}
          className="text-blue-600 hover:text-blue-700"
          title="View"
        >
          <FiEye className="h-5 w-5" />
        </button>
      ),
    },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <Toaster />
        <PageLayout
          title="Payout Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Payouts' },
          ]}
          actions={
            <Button onClick={handleCreate}>
              <FiPlus className="h-4 w-4 mr-2" />
              Create Payout
            </Button>
          }
        >
          <Card className="shadow-sm border border-gray-200">
          <DataTable
            columns={columns}
            data={tableData?.data || tableData || []}
            loading={tableLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            sortField={sort.field}
            sortOrder={sort.order}
          />
          </Card>

          {/* Create Modal */}
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title="Create New Payout"
            size="lg"
          >
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <LoadingSpinner size="lg" />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FiDollarSign className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Payout Information</h3>
              </div>
              <FormSelect
                name="payout_type"
                label="Payout Type"
                value={formData.payout_type}
                onChange={handleChange}
                error={formErrors.payout_type}
                touched={!!formErrors.payout_type}
                required
                options={[
                  { value: 'distributor', label: 'Distributor' },
                  { value: 'salesman', label: 'Salesman' },
                ]}
              />

              {payoutType === 'distributor' ? (
                <FormSelect
                  name="distributor_id"
                  label="Distributor"
                  value={formData.distributor_id}
                  onChange={handleChange}
                  error={formErrors.distributor_id}
                  touched={!!formErrors.distributor_id}
                  required
                  options={recipientOptions}
                />
              ) : (
                <FormSelect
                  name="salesman_id"
                  label="Salesman"
                  value={formData.salesman_id}
                  onChange={handleChange}
                  error={formErrors.salesman_id}
                  touched={!!formErrors.salesman_id}
                  required
                  options={recipientOptions}
                />
              )}

              <FormInput
                name="total_amount"
                label="Total Amount"
                type="number"
                value={formData.total_amount}
                onChange={handleChange}
                error={formErrors.total_amount}
                touched={!!formErrors.total_amount}
                required
                step="0.01"
                min="0"
              />

              <FormInput
                name="payment_method"
                label="Payment Method"
                value={formData.payment_method}
                onChange={handleChange}
                error={formErrors.payment_method}
                touched={!!formErrors.payment_method}
                placeholder="Bank Transfer, UPI, etc."
              />

              <FormInput
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleChange}
                error={formErrors.notes}
                touched={!!formErrors.notes}
              />

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} loading={loading}>
                  <FiSave className="h-4 w-4 mr-2" />
                  Create Payout
                </Button>
              </div>
            </form>
          </Modal>

          {/* Detail View Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedPayout(null);
            }}
            title="Payout Details"
            size="lg"
          >
            {selectedPayout && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="mt-1">
                        <Badge variant="primary">{selectedPayout.payout_type || 'N/A'}</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(selectedPayout.total_amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <Badge
                          variant={
                            selectedPayout.status === 'completed'
                              ? 'success'
                              : selectedPayout.status === 'processing'
                              ? 'info'
                              : selectedPayout.status === 'failed'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {selectedPayout.status || 'N/A'}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedPayout.payment_method || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Paid Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedPayout.paid_date ? new Date(selectedPayout.paid_date).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedPayout(null);
                    }}
                    disabled={loading}
                  >
                    Close
                  </Button>
                  {selectedPayout.status === 'pending' && (
                    <Button onClick={handleProcess} disabled={loading} loading={loading}>
                      Process Payout
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
