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
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import FormSelect from '../../components/forms/FormSelect';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { useTable } from '../../hooks/useTable';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiUsers, FiBriefcase, FiMapPin } from 'react-icons/fi';
import { validateGSTIN } from '../../lib/formatters';

// Indian States for territory selection
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function DistributorsList() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    distributor_code: '',
    company_name: '',
    gstin: '',
    commission_rate: '',
    payment_terms: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const {
    data: tableData,
    loading: tableLoading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.distributors.list, {});

  const handleCreate = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (row) => {
    try {
      setLoading(true);
      const response = await adminAPI.distributors.get(row.id);
      const distributor = response.data?.data || response.data;
      const user = distributor.User || {};
      
      setFormData({
        email: user.email || '',
        password: '',
        full_name: user.full_name || '',
        distributor_code: distributor.distributor_code || '',
        company_name: distributor.company_name || '',
        gstin: distributor.gstin || '',
        commission_rate: distributor.commission_rate || '',
        payment_terms: distributor.payment_terms || '',
        is_active: distributor.is_active !== undefined ? distributor.is_active : true,
      });

      // Handle territory
      let territoryArray = [];
      if (distributor.territory) {
        if (Array.isArray(distributor.territory)) {
          territoryArray = distributor.territory;
        } else if (typeof distributor.territory === 'string') {
          try {
            const parsed = JSON.parse(distributor.territory);
            if (Array.isArray(parsed)) {
              territoryArray = parsed;
            }
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            territoryArray = distributor.territory.split(',').map(s => s.trim()).filter(s => s);
          }
        }
      }
      setSelectedStates(territoryArray);

      setEditingId(row.id);
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load distributor');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (row) => {
    try {
      setLoading(true);
      const response = await adminAPI.distributors.get(row.id);
      const distributor = response.data?.data || response.data;
      setSelectedDistributor(distributor);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load distributor details');
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
      await adminAPI.distributors.delete(deleteId);
      toast.success('Distributor deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete distributor');
    }
  };

  const handleStateToggle = (state) => {
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        return prev.filter(s => s !== state);
      } else {
        return [...prev, state];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (modalMode === 'create' && !formData.password.trim()) {
      errors.password = 'Password is required';
    }
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    // Distributor code is immutable and auto-generated/assigned; don't validate in UI
    if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
    if (formData.gstin && !validateGSTIN(formData.gstin)) {
      errors.gstin = 'GSTIN must be 15 alphanumeric characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        territory: selectedStates,
      };
      // Codes are immutable; never send on update. On create, omit if blank to auto-generate.
      if (modalMode === 'edit') {
        delete payload.distributor_code;
      } else if (!payload.distributor_code?.trim()) {
        delete payload.distributor_code;
      }
      if (modalMode === 'edit' && !payload.password) {
        delete payload.password; // Don't update password if empty
      }

      if (modalMode === 'create') {
        await adminAPI.distributors.create(payload);
        toast.success('Distributor created successfully');
      } else {
        await adminAPI.distributors.update(editingId, payload);
        toast.success('Distributor updated successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} distributor`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      distributor_code: '',
      company_name: '',
      gstin: '',
      commission_rate: '',
      payment_terms: '',
      is_active: true,
    });
    setSelectedStates([]);
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

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <Toaster />
        <PageLayout
          title="Distributor Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Distributors' },
          ]}
          actions={
            <Button onClick={handleCreate}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Distributor
            </Button>
          }
        >
          <Card className="shadow-sm border border-gray-200">
          <DataTable
            columns={columns}
            data={tableData?.data || tableData || []}
            loading={tableLoading}
            actions={(row) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(row)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FiEye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEdit(row)}
                    className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <FiEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(row.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            )}
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
            title={modalMode === 'create' ? 'Create New Distributor' : 'Edit Distributor'}
            size="xl"
            className="max-h-[90vh] overflow-y-auto"
            closeOnClickOutside={modalMode !== 'edit'}
          >
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <LoadingSpinner size="lg" />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiUsers className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">User Account Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="distributor@example.com"
                  />

                  {modalMode === 'create' ? (
                    <FormPasswordInput
                      name="password"
                      label="Password"
                      value={formData.password}
                      onChange={handleChange}
                      error={formErrors.password}
                      touched={!!formErrors.password}
                      required
                      placeholder="Minimum 8 characters"
                    />
                  ) : (
                    <FormPasswordInput
                      name="password"
                      label="Password (leave blank to keep current)"
                      value={formData.password}
                      onChange={handleChange}
                      error={formErrors.password}
                      touched={!!formErrors.password}
                    />
                  )}

                  <FormInput
                    name="full_name"
                    label="Full Name"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={formErrors.full_name}
                    touched={!!formErrors.full_name}
                    required
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiBriefcase className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="distributor_code"
                    label="Distributor Code (leave blank to auto-generate)"
                    value={formData.distributor_code}
                    onChange={handleChange}
                    error={formErrors.distributor_code}
                    touched={!!formErrors.distributor_code}
                    disabled={modalMode === 'edit'}
                    placeholder="e.g. DIST001 (or leave blank)"
                  />

                  <FormInput
                    name="company_name"
                    label="Company Name"
                    value={formData.company_name}
                    onChange={handleChange}
                    error={formErrors.company_name}
                    touched={!!formErrors.company_name}
                    required
                    placeholder="ABC Distributors Pvt Ltd"
                  />

                  <FormInput
                    name="gstin"
                    label="GST Number (for invoicing)"
                    value={formData.gstin}
                    onChange={(name, value) => {
                      // Convert to uppercase automatically
                      const upperValue = value.toUpperCase();
                      handleChange(name, upperValue);
                    }}
                    error={formErrors.gstin}
                    touched={!!formErrors.gstin}
                    placeholder="24ABKPZ9119Q1ZL (15 characters)"
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                  />

                  <FormInput
                    name="commission_rate"
                    label="Commission Rate (%)"
                    type="number"
                    value={formData.commission_rate}
                    onChange={handleChange}
                    error={formErrors.commission_rate}
                    touched={!!formErrors.commission_rate}
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="5.00"
                  />

                  <FormInput
                    name="payment_terms"
                    label="Payment Terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    error={formErrors.payment_terms}
                    touched={!!formErrors.payment_terms}
                    placeholder="Net 30 days"
                  />
                </div>
              </div>

              {/* Territory Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Territory Coverage</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Select the states this distributor will cover</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                  {INDIAN_STATES.map((state) => (
                    <label
                      key={state}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(state)}
                        onChange={() => handleStateToggle(state)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
                
                {selectedStates.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected States ({selectedStates.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStates.map((state) => (
                        <span
                          key={state}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                        >
                          {state}
                          <button
                            type="button"
                            onClick={() => handleStateToggle(state)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {modalMode === 'edit' && (
                <FormSelect
                  name="is_active"
                  label="Status"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(name, value) => handleChange('is_active', value === 'true')}
                  error={formErrors.is_active}
                  touched={!!formErrors.is_active}
                  options={[
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />
              )}

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
                  {modalMode === 'create' ? 'Create Distributor' : 'Update Distributor'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Detail View Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedDistributor(null);
            }}
            title={selectedDistributor?.company_name || selectedDistributor?.distributor_code || 'Distributor Details'}
            size="lg"
          >
            {selectedDistributor && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distributor Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Distributor Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedDistributor.distributor_code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedDistributor.company_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedDistributor.User?.email || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedDistributor.User?.full_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedDistributor.commission_rate ? `${selectedDistributor.commission_rate}%` : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedDistributor.payment_terms || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <Badge variant={selectedDistributor.is_active ? 'success' : 'danger'}>
                          {selectedDistributor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedDistributor(null);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedDistributor) handleEdit({ id: selectedDistributor.id });
                      setShowDetailModal(false);
                    }}
                  >
                    <FiEdit className="h-4 w-4 mr-2" />
                    Edit
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
            title="Delete Distributor"
            message="Are you sure you want to delete this distributor? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

