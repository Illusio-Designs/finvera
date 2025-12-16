import { useState } from 'react';
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
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { useTable } from '../../hooks/useTable';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency } from '../../lib/formatters';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiRotateCw, FiTarget } from 'react-icons/fi';

export default function TargetsList() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [assigneeType, setAssigneeType] = useState('salesman');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [formData, setFormData] = useState({
    assignee_id: '',
    target_type: 'revenue',
    target_period: 'monthly',
    target_value: '',
    achieved_value: '',
    start_date: '',
    end_date: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const { data: salesmenData } = useApi(() => adminAPI.salesmen.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || [];
  const salesmen = salesmenData?.data || [];

  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: `${d.distributor_code} - ${d.company_name}`,
  }));

  const salesmanOptions = salesmen.map((s) => ({
    value: s.id,
    label: `${s.salesman_code} - ${s.full_name}`,
  }));

  const {
    data: tableData,
    loading: tableLoading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.targets.list, {});

  const handleCreate = () => {
    setModalMode('create');
    setAssigneeType('salesman');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (row) => {
    try {
      setLoading(true);
      const response = await adminAPI.targets.get(row.id);
      const target = response.data?.data || response.data;
      
      const isDistributor = !!target.Distributor;
      setAssigneeType(isDistributor ? 'distributor' : 'salesman');
      
      setFormData({
        assignee_id: isDistributor ? target.distributor_id : target.salesman_id,
        target_type: target.target_type || 'revenue',
        target_period: target.target_period || 'monthly',
        target_value: target.target_value?.toString() || '',
        achieved_value: target.achieved_value?.toString() || '0',
        start_date: target.start_date ? target.start_date.split('T')[0] : '',
        end_date: target.end_date ? target.end_date.split('T')[0] : '',
      });
      setEditingId(row.id);
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load target');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      await adminAPI.targets.delete(deleteId);
      toast.success('Target deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete target');
    }
  };

  const handleRecalculate = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await adminAPI.targets.recalculate(id);
      toast.success('Achieved value recalculated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to recalculate');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.assignee_id) errors.assignee_id = 'Please select an assignee';
    if (!formData.target_value) errors.target_value = 'Target value is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.end_date) errors.end_date = 'End date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...(assigneeType === 'distributor'
          ? { distributor_id: formData.assignee_id }
          : { salesman_id: formData.assignee_id }),
        target_type: formData.target_type,
        target_period: formData.target_period,
        target_value: parseFloat(formData.target_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      if (modalMode === 'edit') {
        payload.achieved_value = parseFloat(formData.achieved_value || 0);
        await adminAPI.targets.update(editingId, payload);
        toast.success('Target updated successfully');
      } else {
        await adminAPI.targets.create(payload);
        toast.success('Target created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} target`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assignee_id: '',
      target_type: 'revenue',
      target_period: 'monthly',
      target_value: '',
      achieved_value: '',
      start_date: '',
      end_date: '',
    });
    setFormErrors({});
    setEditingId(null);
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
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => handleRecalculate(row.id, e)}
            className="text-blue-600 hover:text-blue-700"
            title="Recalculate achieved value"
          >
            <FiRotateCw className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-primary-600 hover:text-primary-700"
            title="Edit"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

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
              >
                <FiRotateCw className="h-4 w-4 mr-2" />
                {recalculating ? 'Recalculating...' : 'Recalculate All'}
              </Button>
              <Button onClick={handleCreate}>
                <FiPlus className="h-4 w-4 mr-2" />
                Set Target
              </Button>
            </div>
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

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={modalMode === 'create' ? 'Set New Target' : 'Edit Target'}
            size="lg"
          >
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <LoadingSpinner size="lg" />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {modalMode === 'create' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FiTarget className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="assigneeType"
                          value="salesman"
                          checked={assigneeType === 'salesman'}
                          onChange={(e) => {
                            setAssigneeType(e.target.value);
                            handleChange('assignee_id', '');
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Salesman</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="assigneeType"
                          value="distributor"
                          checked={assigneeType === 'distributor'}
                          onChange={(e) => {
                            setAssigneeType(e.target.value);
                            handleChange('assignee_id', '');
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Distributor</span>
                      </label>
                    </div>
                  </div>

                  <FormSelect
                    name="assignee_id"
                    label={assigneeType === 'distributor' ? 'Select Distributor' : 'Select Salesman'}
                    value={formData.assignee_id}
                    onChange={handleChange}
                    error={formErrors.assignee_id}
                    touched={!!formErrors.assignee_id}
                    options={assigneeType === 'distributor' ? distributorOptions : salesmanOptions}
                    placeholder={`Select ${assigneeType}`}
                    required
                  />
                </div>
              )}

              {modalMode === 'edit' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FiTarget className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To (read-only)
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                      {formData.assignee_id && (
                        <>
                          {assigneeType === 'distributor' 
                            ? distributorOptions.find(o => o.value === formData.assignee_id)?.label
                            : salesmanOptions.find(o => o.value === formData.assignee_id)?.label}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiTarget className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Target Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name="target_type"
                    label="Target Type"
                    value={formData.target_type}
                    onChange={handleChange}
                    error={formErrors.target_type}
                    touched={!!formErrors.target_type}
                    options={[
                      { value: 'revenue', label: 'Revenue' },
                      { value: 'subscription', label: 'Subscriptions' },
                    ]}
                    required
                  />

                  <FormSelect
                    name="target_period"
                    label="Target Period"
                    value={formData.target_period}
                    onChange={handleChange}
                    error={formErrors.target_period}
                    touched={!!formErrors.target_period}
                    options={[
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly' },
                      { value: 'yearly', label: 'Yearly' },
                    ]}
                    required
                  />

                  <FormInput
                    name="target_value"
                    label="Target Value"
                    type="number"
                    value={formData.target_value}
                    onChange={handleChange}
                    error={formErrors.target_value}
                    touched={!!formErrors.target_value}
                    required
                    step="0.01"
                    min="0"
                    placeholder="Enter target value"
                  />

                  {modalMode === 'edit' && (
                    <FormInput
                      name="achieved_value"
                      label="Achieved Value"
                      type="number"
                      value={formData.achieved_value}
                      onChange={handleChange}
                      error={formErrors.achieved_value}
                      touched={!!formErrors.achieved_value}
                      step="0.01"
                      min="0"
                    />
                  )}

                  <FormInput
                    name="start_date"
                    label="Start Date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    error={formErrors.start_date}
                    touched={!!formErrors.start_date}
                    required
                  />

                  <FormInput
                    name="end_date"
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    error={formErrors.end_date}
                    touched={!!formErrors.end_date}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button type="submit" disabled={loading} loading={loading}>
                  <FiSave className="h-4 w-4 mr-2" />
                  {modalMode === 'create' ? 'Set Target' : 'Update Target'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>

          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
            onConfirm={handleDelete}
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
