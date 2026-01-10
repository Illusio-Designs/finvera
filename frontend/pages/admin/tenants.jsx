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
import FormPhoneInput from '../../components/forms/FormPhoneInput';
import FormPasswordInput from '../../components/forms/FormPasswordInput';
import FormSelect from '../../components/forms/FormSelect';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useTable } from '../../hooks/useTable';
import { adminAPI, pricingAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import { extractPANFromGSTIN, validateGSTIN, validatePAN } from '../../lib/formatters';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiBriefcase, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

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
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    subscription_plan: '',
    referral_code: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    fetchData,
  } = useTable(adminAPI.tenants.list, {});

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await pricingAPI.list({ is_active: true });
      const plans = response.data?.data || response.data || [];
      setSubscriptionPlans(Array.isArray(plans) ? plans : []);
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

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
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
        pincode: tenant.pincode || '',
        phone: tenant.phone || '',
        subscription_plan: tenant.subscription_plan || '',
        referral_code: tenant.referral_code || '',
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

  const handleProvisionDatabase = async () => {
    if (!selectedTenant) return;
    
    try {
      toast.loading('Provisioning database...', { id: 'provision' });
      const response = await adminAPI.tenants.provision(selectedTenant.id);
      toast.success(response?.data?.message || 'Database provisioned successfully', { id: 'provision' });
      
      // Reload tenant details to show updated status
      const tenantResponse = await adminAPI.tenants.get(selectedTenant.id);
      const updatedTenant = tenantResponse.data?.data || tenantResponse.data;
      setSelectedTenant(updatedTenant);
      
      // Refresh the table
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to provision database', { id: 'provision' });
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
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (modalMode === 'create' && !formData.password.trim()) {
      errors.password = 'Password is required';
    }
    if (formData.gstin && !validateGSTIN(formData.gstin)) {
      errors.gstin = 'GSTIN must be 15 alphanumeric characters';
    }
    if (formData.pan && !validatePAN(formData.pan)) {
      errors.pan = 'PAN must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)';
    }
    if (formData.pincode && formData.pincode.length !== 6) {
      errors.pincode = 'Pincode must be 6 digits';
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
        const response = await adminAPI.tenants.create(payload);
        toast.success(response?.data?.message || 'Tenant created successfully');
      } else {
        const response = await adminAPI.tenants.update(editingId, payload);
        toast.success(response?.data?.message || 'Tenant updated successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} tenant`;
      
      // If backend returns field-specific error, set it in formErrors
      if (errorData?.field && errorData?.field !== 'unknown') {
        setFormErrors(prev => ({
          ...prev,
          [errorData.field]: errorMessage
        }));
      } else {
        // Show general error toast
        toast.error(errorMessage);
      }
      
      // Also show toast for 409 (Conflict) errors
      if (error.response?.status === 409) {
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      email: '',
      password: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      subscription_plan: '',
      referral_code: '',
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
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-fill PAN from GSTIN when GSTIN is entered
      if (name === 'gstin' && value) {
        const cleanedGST = value.replace(/\s/g, '').toUpperCase();
        if (cleanedGST.length === 15) {
          const extractedPAN = extractPANFromGSTIN(cleanedGST);
          if (extractedPAN && !prev.pan) {
            // Only auto-fill if PAN is empty
            updated.pan = extractedPAN;
          }
        }
      }
      
      return updated;
    });
    
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
      render: (value, row) => {
        // Show plan name if available, otherwise show plan code, otherwise N/A
        if (row.subscription_plan_name) {
          return `${row.subscription_plan_name} (${value})`;
        }
        return value || 'N/A';
      },
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
          <Card className="shadow-sm border border-gray-200 w-full">
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
            closeOnClickOutside={modalMode !== 'edit'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="flex items-center gap-2 mb-4">
                <FiBriefcase className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
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

              <FormPhoneInput
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                error={formErrors.phone}
                touched={!!formErrors.phone}
                required
                defaultCountry="IN"
              />

              {modalMode === 'create' && (
                <FormPasswordInput
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  touched={!!formErrors.password}
                  required
                />
              )}

              {modalMode === 'edit' && (
                <FormPasswordInput
                  name="password"
                  label="Password (leave blank to keep current)"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  touched={!!formErrors.password}
                />
              )}

              {/* Tax Information */}
              <div className="flex items-center gap-2 mb-4 mt-6 pt-4 border-t border-gray-200">
                <FiBriefcase className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Tax Information</h3>
              </div>

              <FormInput
                name="gstin"
                label="GSTIN"
                value={formData.gstin}
                onChange={(name, value) => {
                  // Convert to uppercase automatically
                  const upperValue = value.toUpperCase();
                  setFormData(prev => {
                    const updated = { ...prev, [name]: upperValue };
                    
                    // Auto-fill PAN from GSTIN when GSTIN is 15 characters
                    if (upperValue.length === 15) {
                      const extractedPAN = extractPANFromGSTIN(upperValue);
                      if (extractedPAN && !prev.pan) {
                        // Only auto-fill if PAN is empty
                        updated.pan = extractedPAN;
                      }
                    }
                    
                    return updated;
                  });
                  
                  // Clear error if exists
                  if (formErrors[name]) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[name];
                      return newErrors;
                    });
                  }
                }}
                error={formErrors.gstin}
                touched={!!formErrors.gstin}
                placeholder="24ABKPZ9119Q1ZL (15 characters)"
                maxLength={15}
                style={{ textTransform: 'uppercase' }}
              />

              <FormInput
                name="pan"
                label="PAN (Auto-filled from GSTIN)"
                value={formData.pan}
                onChange={(name, value) => {
                  // Convert to uppercase automatically
                  handleChange(name, value.toUpperCase());
                }}
                error={formErrors.pan}
                touched={!!formErrors.pan}
                placeholder="ABKPZ9119Q1 (10 characters)"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />

              {/* Address Information */}
              <div className="flex items-center gap-2 mb-4 mt-6 pt-4 border-t border-gray-200">
                <FiMapPin className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Address Information</h3>
              </div>

              <FormInput
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                error={formErrors.address}
                touched={!!formErrors.address}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  name="city"
                  label="City"
                  value={formData.city}
                  onChange={handleChange}
                  error={formErrors.city}
                  touched={!!formErrors.city}
                />

                <FormInput
                  name="state"
                  label="State"
                  value={formData.state}
                  onChange={handleChange}
                  error={formErrors.state}
                  touched={!!formErrors.state}
                />
              </div>

              <FormInput
                name="pincode"
                label="Pincode"
                value={formData.pincode}
                onChange={(name, value) => {
                  // Only allow digits
                  const digitsOnly = value.replace(/\D/g, '');
                  handleChange(name, digitsOnly);
                }}
                error={formErrors.pincode}
                touched={!!formErrors.pincode}
                placeholder="6 digits"
                maxLength={6}
                type="tel"
              />

              {/* Subscription Information */}
              <div className="flex items-center gap-2 mb-4 mt-6 pt-4 border-t border-gray-200">
                <FiBriefcase className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Subscription Information</h3>
              </div>

              <FormSelect
                name="subscription_plan"
                label="Subscription Plan"
                value={formData.subscription_plan}
                onChange={handleChange}
                error={formErrors.subscription_plan}
                options={[
                  { value: '', label: 'Select a plan' },
                  ...subscriptionPlans.map(plan => ({
                    value: plan.plan_code,
                    label: `${plan.plan_name} (${plan.plan_code})`,
                  })),
                ]}
                disabled={loadingPlans}
              />

              <FormInput
                name="referral_code"
                label="Referral Code (Optional)"
                value={formData.referral_code}
                onChange={handleChange}
                error={formErrors.referral_code}
                touched={!!formErrors.referral_code}
                placeholder="Enter referral code if applicable"
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

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <FiSave className="h-4 w-4 mr-2" />
                  {modalMode === 'create' ? 'Create Tenant' : 'Update Tenant'}
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
                  <div className="flex items-center gap-2 mb-4">
                    <FiBriefcase className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                  </div>
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
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.phone || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedTenant.gstin || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">PAN</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedTenant.pan || 'N/A'}</dd>
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
                  <div className="flex items-center gap-2 mb-4">
                    <FiMapPin className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                  </div>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.address || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">City</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedTenant.city || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">State</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedTenant.state || 'N/A'}</dd>
                      </div>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Pincode</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.pincode || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FiBriefcase className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                  </div>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Plan</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedTenant.subscription_plan_name 
                          ? `${selectedTenant.subscription_plan_name} (${selectedTenant.subscription_plan})`
                          : selectedTenant.subscription_plan || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Referral Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTenant.referral_code || 'N/A'}</dd>
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

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FiBriefcase className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Database Information</h3>
                    </div>
                    {!selectedTenant.db_provisioned && (
                      <Button
                        onClick={handleProvisionDatabase}
                        variant="primary"
                        size="sm"
                      >
                        Provision Database
                      </Button>
                    )}
                  </div>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Database Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedTenant.db_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Provision Status</dt>
                      <dd className="mt-1">
                        <Badge variant={selectedTenant.db_provisioned ? 'success' : 'warning'}>
                          {selectedTenant.db_provisioned ? 'Provisioned' : 'Not Provisioned'}
                        </Badge>
                      </dd>
                    </div>
                    {selectedTenant.db_provisioned_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Provisioned At</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(selectedTenant.db_provisioned_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTenant(null);
                    }}
                  >
                    Close
                  </Button>
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

