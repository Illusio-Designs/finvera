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
import { useTable } from '../../hooks/useTable';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiBriefcase } from 'react-icons/fi';

export default function TenantsList() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    password: '',
    gstin: '',
    pan: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.tenants.list, {});

  const handleCreate = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (row) => {
    try {
      const response = await adminAPI.tenants.get(row.id);
      const tenant = response.data?.data || response.data;
      setFormData({
        company_name: tenant.company_name || '',
        email: tenant.email || '',
        password: '',
        gstin: tenant.gstin || '',
        pan: tenant.pan || '',
        is_active: tenant.is_active !== undefined ? tenant.is_active : true,
      });
      setEditingId(row.id);
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load tenant');
    }
  };

  const handleView = async (row) => {
    try {
      const response = await adminAPI.tenants.get(row.id);
      const tenant = response.data?.data || response.data;
      setSelectedTenant(tenant);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load tenant details');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      await adminAPI.tenants.delete(deleteId);
      toast.success('Tenant deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tenant');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors = {};
    if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (modalMode === 'create' && !formData.password.trim()) {
      errors.password = 'Password is required';
    }
    if (formData.gstin && formData.gstin.length !== 15) {
      errors.gstin = 'GSTIN must be 15 characters';
    }
    if (formData.pan && formData.pan.length !== 10) {
      errors.pan = 'PAN must be 10 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = { ...formData };
      if (modalMode === 'edit' && !payload.password) {
        delete payload.password; // Don't update password if empty
      }

      if (modalMode === 'create') {
        await adminAPI.tenants.create(payload);
        toast.success('Tenant created successfully');
      } else {
        await adminAPI.tenants.update(editingId, payload);
        toast.success('Tenant updated successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} tenant`);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      email: '',
      password: '',
      gstin: '',
      pan: '',
      is_active: true,
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
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleView(row)}
            className="text-blue-600 hover:text-blue-700"
            title="View"
          >
            <FiEye className="h-5 w-5" />
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
      <AdminLayout>
        <Toaster />
        <PageLayout
          title="Tenant Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Tenants' },
          ]}
          actions={
            <Button onClick={handleCreate}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          }
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
            />
          </Card>

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={modalMode === 'create' ? 'Create New Tenant' : 'Edit Tenant'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FiBriefcase className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Tenant Information</h3>
              </div>
              <FormInput
                name="company_name"
                label="Company Name"
                value={formData.company_name}
                onChange={handleChange}
                error={formErrors.company_name}
                touched={!!formErrors.company_name}
                required
              />

              <FormInput
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                touched={!!formErrors.email}
                required
                disabled={modalMode === 'edit'}
              />

              {modalMode === 'create' && (
                <FormInput
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  touched={!!formErrors.password}
                  required
                />
              )}

              {modalMode === 'edit' && (
                <FormInput
                  name="password"
                  label="Password (leave blank to keep current)"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  touched={!!formErrors.password}
                />
              )}

              <FormInput
                name="gstin"
                label="GSTIN"
                value={formData.gstin}
                onChange={handleChange}
                error={formErrors.gstin}
                touched={!!formErrors.gstin}
                placeholder="15 characters"
                maxLength={15}
              />

              <FormInput
                name="pan"
                label="PAN"
                value={formData.pan}
                onChange={handleChange}
                error={formErrors.pan}
                touched={!!formErrors.pan}
                placeholder="10 characters"
                maxLength={10}
              />

              {modalMode === 'edit' && (
                <FormSelect
                  name="is_active"
                  label="Status"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(name, value) => handleChange('is_active', value === 'true')}
                  error={formErrors.is_active}
                  options={[
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button type="submit">
                  <FiSave className="h-4 w-4 mr-2" />
                  {modalMode === 'create' ? 'Create Tenant' : 'Update Tenant'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>

          {/* Detail View Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedTenant(null);
            }}
            title={selectedTenant?.company_name || 'Tenant Details'}
            size="lg"
          >
            {selectedTenant && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.company_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.gstin || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">PAN</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.pan || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <Badge variant={selectedTenant.is_active ? 'success' : 'danger'}>
                          {selectedTenant.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Plan</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.subscription_plan || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedTenant.subscription_start ? new Date(selectedTenant.subscription_start).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedTenant.subscription_end ? new Date(selectedTenant.subscription_end).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedTenant) handleEdit({ id: selectedTenant.id });
                      setShowDetailModal(false);
                    }}
                  >
                    <FiEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTenant(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteId(null);
            }}
            onConfirm={handleDelete}
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

