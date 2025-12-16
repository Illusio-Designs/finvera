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
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { useTable } from '../../hooks/useTable';
import { useApi } from '../../hooks/useApi';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiUsers, FiBriefcase, FiMapPin } from 'react-icons/fi';

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

export default function SalesmenList() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    salesman_code: '',
    full_name: '',
    distributor_id: '',
    commission_rate: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const distributors = distributorsData?.data || distributorsData || [];
  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: `${d.distributor_code} - ${d.company_name || 'N/A'}`,
  }));

  const {
    data: tableData,
    loading: tableLoading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.salesmen.list, {});

  const handleCreate = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (row) => {
    try {
      setLoading(true);
      const response = await adminAPI.salesmen.get(row.id);
      const salesman = response.data?.data || response.data;
      const user = salesman.User || {};
      
      setFormData({
        email: user.email || '',
        password: '',
        salesman_code: salesman.salesman_code || '',
        full_name: user.full_name || '',
        distributor_id: salesman.distributor_id || '',
        commission_rate: salesman.commission_rate || '',
        is_active: salesman.is_active !== undefined ? salesman.is_active : true,
      });

      let territoryArray = [];
      if (salesman.territory) {
        if (Array.isArray(salesman.territory)) {
          territoryArray = salesman.territory;
        } else if (typeof salesman.territory === 'string') {
          try {
            const parsed = JSON.parse(salesman.territory);
            if (Array.isArray(parsed)) {
              territoryArray = parsed;
            }
          } catch (e) {
            territoryArray = salesman.territory.split(',').map(s => s.trim()).filter(s => s);
          }
        }
      }
      setSelectedStates(territoryArray);

      setEditingId(row.id);
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load salesman');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (row) => {
    try {
      setLoading(true);
      const response = await adminAPI.salesmen.get(row.id);
      const salesman = response.data?.data || response.data;
      setSelectedSalesman(salesman);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load salesman details');
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
      await adminAPI.salesmen.delete(deleteId);
      toast.success('Salesman deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete salesman');
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

    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (modalMode === 'create' && !formData.password.trim()) {
      errors.password = 'Password is required';
    }
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.salesman_code.trim()) errors.salesman_code = 'Salesman code is required';

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
      if (modalMode === 'edit' && !payload.password) {
        delete payload.password;
      }

      if (modalMode === 'create') {
        await adminAPI.salesmen.create(payload);
        toast.success('Salesman created successfully');
      } else {
        await adminAPI.salesmen.update(editingId, payload);
        toast.success('Salesman updated successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} salesman`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      salesman_code: '',
      full_name: '',
      distributor_id: '',
      commission_rate: '',
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
          title="Salesman Management"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Salesmen' },
          ]}
          actions={
            <Button onClick={handleCreate}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Salesman
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

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={modalMode === 'create' ? 'Create New Salesman' : 'Edit Salesman'}
            size="xl"
            className="max-h-[90vh] overflow-y-auto"
          >
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <LoadingSpinner size="lg" />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="salesman@example.com"
                  />

                  {modalMode === 'create' ? (
                    <FormInput
                      name="password"
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={formErrors.password}
                      touched={!!formErrors.password}
                      required
                      placeholder="Minimum 8 characters"
                    />
                  ) : (
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

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiBriefcase className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="salesman_code"
                    label="Salesman Code"
                    value={formData.salesman_code}
                    onChange={handleChange}
                    error={formErrors.salesman_code}
                    touched={!!formErrors.salesman_code}
                    required
                    disabled={modalMode === 'edit'}
                    placeholder="SALE001"
                  />

                  <FormSelect
                    name="distributor_id"
                    label="Distributor"
                    value={formData.distributor_id || ''}
                    onChange={handleChange}
                    error={formErrors.distributor_id}
                    touched={!!formErrors.distributor_id}
                    options={distributorOptions}
                    placeholder="Select distributor (optional)"
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
                    placeholder="10.00"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Territory Coverage</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Select the states this salesman will cover</p>
                
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

              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button type="submit" disabled={loading} loading={loading}>
                  <FiSave className="h-4 w-4 mr-2" />
                  {modalMode === 'create' ? 'Create Salesman' : 'Update Salesman'}
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

          {/* Detail View Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedSalesman(null);
            }}
            title={selectedSalesman?.full_name || selectedSalesman?.salesman_code || 'Salesman Details'}
            size="lg"
          >
            {selectedSalesman && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Salesman Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Salesman Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedSalesman.salesman_code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedSalesman.full_name || selectedSalesman.User?.full_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedSalesman.User?.email || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedSalesman.commission_rate ? `${selectedSalesman.commission_rate}%` : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <Badge variant={selectedSalesman.is_active ? 'success' : 'danger'}>
                          {selectedSalesman.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedSalesman) handleEdit({ id: selectedSalesman.id });
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
                      setSelectedSalesman(null);
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
            title="Delete Salesman"
            message="Are you sure you want to delete this salesman? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
          />
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

