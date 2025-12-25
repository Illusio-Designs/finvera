import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/forms/FormInput';
import FormPhoneInput from '../../components/forms/FormPhoneInput';
import FormTextarea from '../../components/forms/FormTextarea';
import DataTable from '../../components/tables/DataTable';
import { accountingAPI } from '../../lib/api';
import { useTable } from '../../hooks/useTable';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';

export default function WarehousesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    warehouse_code: '',
    warehouse_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Memoize the fetch function
  const fetchFn = useMemo(
    () => (params) => accountingAPI.warehouses.list(params),
    []
  );

  const {
    data,
    loading: tableLoading,
    pagination,
    sort,
    handlePageChange,
    handleSort: handleTableSort,
    handleFilter,
    fetchData,
  } = useTable(fetchFn, { limit: 20 });

  const resetForm = () => {
    setFormData({
      warehouse_code: '',
      warehouse_name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      is_active: true,
    });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await accountingAPI.warehouses.get(id);
      const warehouse = response.data;
      setFormData({
        warehouse_code: warehouse.warehouse_code || '',
        warehouse_name: warehouse.warehouse_name || '',
        address: warehouse.address || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        pincode: warehouse.pincode || '',
        contact_person: warehouse.contact_person || '',
        contact_phone: warehouse.contact_phone || '',
        contact_email: warehouse.contact_email || '',
        is_active: warehouse.is_active !== false,
      });
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load warehouse');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) {
      return;
    }

    try {
      await accountingAPI.warehouses.delete(id);
      toast.success('Warehouse deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete warehouse');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.warehouse_name?.trim()) {
      newErrors.warehouse_name = 'Warehouse name is required';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        warehouse_code: formData.warehouse_code || null,
        warehouse_name: formData.warehouse_name.trim(),
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        contact_person: formData.contact_person || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        await accountingAPI.warehouses.update(editingId, payload);
        toast.success('Warehouse updated successfully');
      } else {
        await accountingAPI.warehouses.create(payload);
        toast.success('Warehouse created successfully');
      }

      resetForm();
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save warehouse';
      toast.error(errorMessage);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'warehouse_name', label: 'Warehouse Name', sortable: true },
    { key: 'warehouse_code', label: 'Code', sortable: true },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'contact_phone', label: 'Phone' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row.id)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Edit"
          >
            <FiEdit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const tableData = Array.isArray(data) ? data : [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Warehouses">
        <PageLayout
          title="Warehouses"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Warehouses' },
          ]}
          actions={
            !showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Warehouse</span>
              </Button>
            ) : (
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiX className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            )
          }
        >
          {showForm ? (
            <Card>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingId ? 'Edit Warehouse' : 'New Warehouse'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingId ? 'Update warehouse information' : 'Add a new warehouse to manage inventory locations'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="warehouse_name"
                    label="Warehouse Name"
                    value={formData.warehouse_name}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.warehouse_name}
                    required
                    placeholder="Enter warehouse name"
                  />

                  <FormInput
                    name="warehouse_code"
                    label="Warehouse Code"
                    value={formData.warehouse_code}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.warehouse_code}
                    placeholder="Enter warehouse code (optional)"
                  />

                  <FormTextarea
                    name="address"
                    label="Address"
                    value={formData.address}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.address}
                    placeholder="Enter address"
                  />

                  <FormInput
                    name="city"
                    label="City"
                    value={formData.city}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.city}
                    placeholder="Enter city"
                  />

                  <FormInput
                    name="state"
                    label="State"
                    value={formData.state}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.state}
                    placeholder="Enter state"
                  />

                  <FormInput
                    name="pincode"
                    label="Pincode"
                    value={formData.pincode}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.pincode}
                    placeholder="Enter pincode"
                  />

                  <FormInput
                    name="contact_person"
                    label="Contact Person"
                    value={formData.contact_person}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.contact_person}
                    placeholder="Enter contact person name"
                  />

                  <FormPhoneInput
                    name="contact_phone"
                    label="Contact Phone"
                    value={formData.contact_phone}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.contact_phone}
                    touched={!!errors.contact_phone}
                    defaultCountry="IN"
                  />

                  <FormInput
                    name="contact_email"
                    label="Contact Email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.contact_email}
                    placeholder="Enter contact email"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : editingId ? 'Update Warehouse' : 'Create Warehouse'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              <DataTable
                columns={columns}
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onSort={handleTableSort}
                onFilter={handleFilter}
                sortField={sort.field}
                sortOrder={sort.order}
                searchable={false}
              />
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
