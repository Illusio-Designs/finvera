import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import { useTable } from '../../hooks/useTable';
import { gstAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye } from 'react-icons/fi';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function GSTINsList() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    gstin: '',
    business_name: '',
    state: '',
    is_primary: false,
  });
  const [formErrors, setFormErrors] = useState({});

  const stateOptions = INDIAN_STATES.map((state) => ({
    value: state,
    label: state,
  }));

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(gstAPI.gstins.list, {});

  // Load GSTIN data when editing
  useEffect(() => {
    if (editingId && showForm) {
      // Fetch GSTIN details if API supports it
      // For now, we'll handle it in the form
    }
  }, [editingId, showForm]);

  const handleChange = (name, value) => {
    if (name === 'is_primary') {
      setFormData((prev) => ({ ...prev, [name]: value === 'true' || value === true }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.gstin.trim()) errors.gstin = 'GSTIN is required';
    if (formData.gstin.length !== 15) errors.gstin = 'GSTIN must be 15 characters';
    if (!formData.business_name.trim()) errors.business_name = 'Business name is required';
    if (!formData.state) errors.state = 'State is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      if (editingId) {
        // Update GSTIN if API supports it
        await gstAPI.gstins.update?.(editingId, formData);
        toast.success('GSTIN updated successfully');
      } else {
        await gstAPI.gstins.create(formData);
        toast.success('GSTIN created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      refetch();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save GSTIN';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };

  const handleEdit = (gstin) => {
    setEditingId(gstin.id);
    setFormData({
      gstin: gstin.gstin || '',
      business_name: gstin.business_name || '',
      state: gstin.state || '',
      is_primary: gstin.is_primary || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this GSTIN?')) return;
    try {
      await gstAPI.gstins.delete?.(id);
      toast.success('GSTIN deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete GSTIN');
    }
  };

  const resetForm = () => {
    setFormData({
      gstin: '',
      business_name: '',
      state: '',
      is_primary: false,
    });
    setFormErrors({});
  };

  const columns = [
    { key: 'gstin', label: 'GSTIN', sortable: true },
    {
      key: 'is_primary',
      label: 'Primary',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { key: 'business_name', label: 'Business Name', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-primary-600 hover:text-primary-700"
            title="Edit"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          {gstAPI.gstins.delete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.id);
              }}
              className="text-red-600 hover:text-red-700"
              title="Delete"
            >
              <FiTrash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="GSTINs - Client Portal">
        <PageLayout
          title="GSTIN Management"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GSTINs', href: '/client/gstins' },
          ]}
          actions={
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                resetForm();
              }}
            >
              <FiPlus className="h-4 w-4 mr-2" />
              Add GSTIN
            </Button>
          }
        >
          {/* Create/Edit Modal */}
          <Modal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            }}
            title={editingId ? 'Edit GSTIN' : 'New GSTIN'}
            size="md"
            closeOnClickOutside={!editingId}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="gstin"
                label="GSTIN"
                value={formData.gstin}
                onChange={handleChange}
                error={formErrors.gstin}
                touched={!!formErrors.gstin}
                required
                maxLength={15}
                placeholder="15 characters"
                disabled={!!editingId}
              />

              <FormInput
                name="business_name"
                label="Business Name"
                value={formData.business_name}
                onChange={handleChange}
                error={formErrors.business_name}
                touched={!!formErrors.business_name}
                required
              />

              <FormSelect
                name="state"
                label="State"
                value={formData.state}
                onChange={handleChange}
                error={formErrors.state}
                touched={!!formErrors.state}
                required
                options={stateOptions}
              />

              <FormSelect
                name="is_primary"
                label="Primary GSTIN"
                value={formData.is_primary ? 'true' : 'false'}
                onChange={handleChange}
                error={formErrors.is_primary}
                touched={!!formErrors.is_primary}
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <FiSave className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'} GSTIN
                </Button>
              </div>
            </form>
          </Modal>

          {/* Main List Table */}
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
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
