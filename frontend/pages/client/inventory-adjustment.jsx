import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormTextarea from '../../components/forms/FormTextarea';
import DataTable from '../../components/tables/DataTable';
import { accountingAPI } from '../../lib/api';
import { useTable } from '../../hooks/useTable';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiSave } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../lib/formatters';

export default function StockAdjustmentPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    warehouse_id: '',
    quantity: '0',
    reason: '',
  });
  const [errors, setErrors] = useState({});

  // Memoize the fetch function
  const fetchFn = useMemo(
    () => (params) => accountingAPI.stockAdjustments.list(params),
    []
  );

  const {
    data,
    loading: tableLoading,
    pagination,
    handlePageChange,
    fetchData,
  } = useTable(fetchFn, { limit: 20 });

  // Fetch warehouses and inventory items on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [warehousesRes, itemsRes] = await Promise.all([
          accountingAPI.warehouses.getAll({ is_active: true }).catch(() => ({ data: { data: [] } })),
          accountingAPI.inventory.items.list({ limit: 1000, is_active: true }).catch(() => ({ data: { data: [] } })),
        ]);
        
        const warehousesData = warehousesRes?.data?.data || warehousesRes?.data || [];
        const itemsData = itemsRes?.data?.data || itemsRes?.data || [];
        
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
        setInventoryItems(Array.isArray(itemsData) ? itemsData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const warehouseOptions = [
    { value: '', label: 'All Warehouses (Aggregate)' },
    ...warehouses.map((wh) => ({
      value: wh.id,
      label: wh.warehouse_name + (wh.warehouse_code ? ` (${wh.warehouse_code})` : ''),
    })),
  ];

  const itemOptions = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.item_name}${item.item_code ? ` (${item.item_code})` : ''}`,
  }));

  const resetForm = () => {
    setFormData({
      inventory_item_id: '',
      warehouse_id: '',
      quantity: '0',
      reason: '',
    });
    setErrors({});
    setShowForm(false);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.inventory_item_id) {
      newErrors.inventory_item_id = 'Inventory item is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) === 0) {
      newErrors.quantity = 'Quantity is required and cannot be zero';
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
        inventory_item_id: formData.inventory_item_id,
        warehouse_id: formData.warehouse_id || null,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason || null,
      };

      await accountingAPI.stockAdjustments.create(payload);
      toast.success('Stock adjustment created successfully');
      
      resetForm();
      fetchData();
      window.location.reload();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create stock adjustment';
      toast.error(errorMessage);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: 'date', 
      label: 'Date',
      render: (value) => value ? formatDate(value) : '-',
    },
    { key: 'item_name', label: 'Item Name' },
    { key: 'item_code', label: 'Item Code' },
    { key: 'warehouse_name', label: 'Warehouse' },
    {
      key: 'adjustment_type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value) => (value ? Math.abs(parseFloat(value)).toFixed(3) : '0.000'),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value || 0),
    },
    { key: 'narration', label: 'Reason/Narration' },
  ];

  const tableData = Array.isArray(data) ? data : [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Stock Adjustment">
        <PageLayout
          title="Stock Adjustment"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Inventory', href: '/client/inventory' },
            { label: 'Stock Adjustment' },
          ]}
          actions={
            !showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>New Adjustment</span>
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
                <h2 className="text-xl font-semibold text-gray-900">New Stock Adjustment</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Adjust stock quantities for inventory items (increase or decrease)
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormSelect
                    name="inventory_item_id"
                    label="Inventory Item"
                    value={formData.inventory_item_id}
                    onChange={(name, value) => handleChange(name, value)}
                    options={itemOptions}
                    error={errors.inventory_item_id}
                    placeholder="Select inventory item"
                    required
                  />

                  <FormSelect
                    name="warehouse_id"
                    label="Warehouse (Optional)"
                    value={formData.warehouse_id}
                    onChange={(name, value) => handleChange(name, value)}
                    options={warehouseOptions}
                    error={errors.warehouse_id}
                    placeholder="Select warehouse or leave blank for aggregate"
                  />

                  <FormInput
                    name="quantity"
                    label="Adjustment Quantity"
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.quantity}
                    placeholder="Positive for increase, negative for decrease"
                    required
                    helperText="Use positive number to increase stock, negative to decrease"
                  />

                  <FormTextarea
                    name="reason"
                    label="Reason/Narration"
                    value={formData.reason}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.reason}
                    placeholder="Enter reason for adjustment"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Create Adjustment'}</span>
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
                searchable={true}
                searchable={false}
              />
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
