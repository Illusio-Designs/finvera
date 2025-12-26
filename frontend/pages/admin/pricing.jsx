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
import FormTextarea from '../../components/forms/FormTextarea';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { useTable } from '../../hooks/useTable';
import { pricingAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { formatCurrency } from '../../lib/formatters';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiTag } from 'react-icons/fi';

export default function PricingList() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_code: '',
    plan_name: '',
    description: '',
    billing_cycle: 'monthly',
    base_price: '',
    discounted_price: '',
    trial_days: '0',
    max_users: '',
    max_invoices_per_month: '',
    max_companies: '1',
    storage_limit_gb: '',
    salesman_commission_rate: '',
    distributor_commission_rate: '',
    renewal_commission_rate: '',
    is_active: true,
    is_visible: true,
    is_featured: false,
    display_order: '',
    valid_from: '',
    valid_until: '',
    features: {
      gst_filing: false,
      e_invoicing: false,
      features_list: [],
    },
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
  } = useTable(pricingAPI.list, {});

  const handleCreate = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (row) => {
    try {
      setLoading(true);
      const response = await pricingAPI.get(row.id);
      const plan = response.data?.data || response.data;
      
      setFormData({
        plan_code: plan.plan_code || '',
        plan_name: plan.plan_name || '',
        description: plan.description || '',
        billing_cycle: plan.billing_cycle || 'monthly',
        base_price: plan.base_price?.toString() || '',
        discounted_price: plan.discounted_price?.toString() || '',
        trial_days: plan.trial_days?.toString() || '0',
        max_users: plan.max_users?.toString() || '',
        max_invoices_per_month: plan.max_invoices_per_month?.toString() || '',
        max_companies: plan.max_companies?.toString() || '1',
        storage_limit_gb: plan.storage_limit_gb?.toString() || '',
        salesman_commission_rate: plan.salesman_commission_rate?.toString() || '',
        distributor_commission_rate: plan.distributor_commission_rate?.toString() || '',
        renewal_commission_rate: plan.renewal_commission_rate?.toString() || '',
        is_active: plan.is_active !== undefined ? plan.is_active : true,
        is_visible: plan.is_visible !== undefined ? plan.is_visible : true,
        is_featured: plan.is_featured || false,
        display_order: plan.display_order?.toString() || '',
        valid_from: plan.valid_from ? new Date(plan.valid_from).toISOString().split('T')[0] : '',
        valid_until: plan.valid_until ? new Date(plan.valid_until).toISOString().split('T')[0] : '',
        features: (() => {
          if (typeof plan.features === 'string') {
            try {
              return JSON.parse(plan.features);
            } catch {
              return { gst_filing: false, e_invoicing: false, features_list: [] };
            }
          }
          return plan.features || {
            gst_filing: false,
            e_invoicing: false,
            features_list: [],
          };
        })(),
      });
      setEditingId(row.id);
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load plan');
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
      await pricingAPI.delete(deleteId);
      toast.success('Plan deactivated successfully');
      fetchData();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate plan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.plan_code.trim()) errors.plan_code = 'Plan code is required';
    if (!formData.plan_name.trim()) errors.plan_name = 'Plan name is required';
    if (!formData.base_price) errors.base_price = 'Base price is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        trial_days: parseInt(formData.trial_days) || 0,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_invoices_per_month: formData.max_invoices_per_month ? parseInt(formData.max_invoices_per_month) : null,
        max_companies: formData.max_companies ? parseInt(formData.max_companies) : 1,
        storage_limit_gb: formData.storage_limit_gb ? parseInt(formData.storage_limit_gb) : null,
        salesman_commission_rate: formData.salesman_commission_rate ? parseFloat(formData.salesman_commission_rate) : null,
        distributor_commission_rate: formData.distributor_commission_rate ? parseFloat(formData.distributor_commission_rate) : null,
        renewal_commission_rate: formData.renewal_commission_rate ? parseFloat(formData.renewal_commission_rate) : null,
        is_visible: formData.is_visible !== undefined ? formData.is_visible : true,
        is_featured: formData.is_featured || false,
        display_order: formData.display_order ? parseInt(formData.display_order) : null,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        features: formData.features || {
          gst_filing: false,
          e_invoicing: false,
          features_list: [],
        },
      };

      if (modalMode === 'create') {
        await pricingAPI.create(payload);
        toast.success('Plan created successfully');
      } else {
        await pricingAPI.update(editingId, payload);
        toast.success('Plan updated successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} plan`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plan_code: '',
      plan_name: '',
      description: '',
      billing_cycle: 'monthly',
      base_price: '',
      discounted_price: '',
      trial_days: '0',
      max_users: '',
      max_invoices_per_month: '',
      max_companies: '1',
      storage_limit_gb: '',
      salesman_commission_rate: '',
      distributor_commission_rate: '',
      renewal_commission_rate: '',
      is_active: true,
      is_visible: true,
      is_featured: false,
      display_order: '',
      valid_from: '',
      valid_until: '',
      features: {
        gst_filing: false,
        e_invoicing: false,
        features_list: [],
      },
    });
    setFormErrors({});
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (name, value) => {
    if (name === 'features' && typeof value === 'object') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
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
          title="Subscription Plans"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Pricing' },
          ]}
          actions={
            <Button onClick={handleCreate}>
              <FiPlus className="h-4 w-4 mr-2" />
              Create Plan
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
            title={modalMode === 'create' ? 'Create Subscription Plan' : 'Edit Subscription Plan'}
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
              <div className="flex items-center gap-2 mb-4">
                <FiTag className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Plan Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalMode === 'create' && (
                  <FormInput
                    name="plan_code"
                    label="Plan Code"
                    value={formData.plan_code}
                    onChange={handleChange}
                    error={formErrors.plan_code}
                    touched={!!formErrors.plan_code}
                    required
                  />
                )}
                <FormInput
                  name="plan_name"
                  label="Plan Name"
                  value={formData.plan_name}
                  onChange={handleChange}
                  error={formErrors.plan_name}
                  touched={!!formErrors.plan_name}
                  required
                />
              </div>

              <FormTextarea
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                error={formErrors.description}
                touched={!!formErrors.description}
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  name="billing_cycle"
                  label="Billing Cycle"
                  value={formData.billing_cycle}
                  onChange={handleChange}
                  error={formErrors.billing_cycle}
                  touched={!!formErrors.billing_cycle}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' },
                  ]}
                />

                <FormInput
                  name="base_price"
                  label="Base Price (₹)"
                  type="number"
                  value={formData.base_price}
                  onChange={handleChange}
                  error={formErrors.base_price}
                  touched={!!formErrors.base_price}
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <FormInput
                name="discounted_price"
                label="Discounted Price (₹)"
                type="number"
                value={formData.discounted_price}
                onChange={handleChange}
                error={formErrors.discounted_price}
                touched={!!formErrors.discounted_price}
                step="0.01"
                min="0"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  name="trial_days"
                  label="Trial Days"
                  type="number"
                  value={formData.trial_days}
                  onChange={handleChange}
                  error={formErrors.trial_days}
                  touched={!!formErrors.trial_days}
                  min="0"
                />

                <FormInput
                  name="max_users"
                  label="Max Users"
                  type="number"
                  value={formData.max_users}
                  onChange={handleChange}
                  error={formErrors.max_users}
                  touched={!!formErrors.max_users}
                  min="1"
                />

                <FormInput
                  name="max_invoices_per_month"
                  label="Max Invoices/Month"
                  type="number"
                  value={formData.max_invoices_per_month}
                  onChange={handleChange}
                  error={formErrors.max_invoices_per_month}
                  touched={!!formErrors.max_invoices_per_month}
                  min="0"
                />
              </div>

              <FormInput
                name="max_companies"
                label="Max Companies"
                type="number"
                value={formData.max_companies}
                onChange={handleChange}
                error={formErrors.max_companies}
                touched={!!formErrors.max_companies}
                min="1"
              />

              <FormInput
                name="storage_limit_gb"
                label="Storage Limit (GB)"
                type="number"
                value={formData.storage_limit_gb}
                onChange={handleChange}
                error={formErrors.storage_limit_gb}
                touched={!!formErrors.storage_limit_gb}
                min="0"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  name="salesman_commission_rate"
                  label="Salesman Commission (%)"
                  type="number"
                  value={formData.salesman_commission_rate}
                  onChange={handleChange}
                  error={formErrors.salesman_commission_rate}
                  touched={!!formErrors.salesman_commission_rate}
                  step="0.01"
                  min="0"
                  max="100"
                />

                <FormInput
                  name="distributor_commission_rate"
                  label="Distributor Commission (%)"
                  type="number"
                  value={formData.distributor_commission_rate}
                  onChange={handleChange}
                  error={formErrors.distributor_commission_rate}
                  touched={!!formErrors.distributor_commission_rate}
                  step="0.01"
                  min="0"
                  max="100"
                />

                <FormInput
                  name="renewal_commission_rate"
                  label="Renewal Commission (%)"
                  type="number"
                  value={formData.renewal_commission_rate}
                  onChange={handleChange}
                  error={formErrors.renewal_commission_rate}
                  touched={!!formErrors.renewal_commission_rate}
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex items-center gap-2 mb-4 mt-6 pt-4 border-t border-gray-200">
                <FiTag className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Visibility & Display</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormSelect
                  name="is_visible"
                  label="Visible"
                  value={formData.is_visible ? 'true' : 'false'}
                  onChange={(name, value) => handleChange('is_visible', value === 'true')}
                  error={formErrors.is_visible}
                  touched={!!formErrors.is_visible}
                  options={[
                    { value: 'true', label: 'Visible' },
                    { value: 'false', label: 'Hidden' },
                  ]}
                />

                <FormSelect
                  name="is_featured"
                  label="Featured"
                  value={formData.is_featured ? 'true' : 'false'}
                  onChange={(name, value) => handleChange('is_featured', value === 'true')}
                  error={formErrors.is_featured}
                  touched={!!formErrors.is_featured}
                  options={[
                    { value: 'true', label: 'Featured' },
                    { value: 'false', label: 'Not Featured' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  name="display_order"
                  label="Display Order"
                  type="number"
                  value={formData.display_order}
                  onChange={handleChange}
                  error={formErrors.display_order}
                  touched={!!formErrors.display_order}
                  min="0"
                  placeholder="Order in list"
                />

                <FormInput
                  name="valid_from"
                  label="Valid From"
                  type="date"
                  value={formData.valid_from}
                  onChange={handleChange}
                  error={formErrors.valid_from}
                  touched={!!formErrors.valid_from}
                />

                <FormInput
                  name="valid_until"
                  label="Valid Until"
                  type="date"
                  value={formData.valid_until}
                  onChange={handleChange}
                  error={formErrors.valid_until}
                  touched={!!formErrors.valid_until}
                />
              </div>

              <div className="flex items-center gap-2 mb-4 mt-6 pt-4 border-t border-gray-200">
                <FiTag className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-700">Features</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gst_filing"
                    checked={formData.features?.gst_filing || false}
                    onChange={(e) => handleChange('features', {
                      ...formData.features,
                      gst_filing: e.target.checked,
                    })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="gst_filing" className="text-sm font-medium text-gray-700">
                    GST Filing
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="e_invoicing"
                    checked={formData.features?.e_invoicing || false}
                    onChange={(e) => handleChange('features', {
                      ...formData.features,
                      e_invoicing: e.target.checked,
                    })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="e_invoicing" className="text-sm font-medium text-gray-700">
                    E-Invoicing
                  </label>
                </div>
              </div>

              <FormTextarea
                name="features_list"
                label="Features List (comma-separated)"
                value={Array.isArray(formData.features?.features_list) 
                  ? formData.features.features_list.join(', ') 
                  : (formData.features?.features_list || '')}
                onChange={(name, value) => {
                  const featuresList = value.split(',').map(f => f.trim()).filter(f => f);
                  handleChange('features', {
                    ...formData.features,
                    features_list: featuresList,
                  });
                }}
                error={formErrors.features_list}
                touched={!!formErrors.features_list}
                rows={4}
                placeholder="GST Filing, Basic Reports, Invoice Management, etc."
              />

              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <Button type="submit" disabled={loading} loading={loading}>
                  <FiSave className="h-4 w-4 mr-2" />
                  {modalMode === 'create' ? 'Create Plan' : 'Update Plan'}
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
