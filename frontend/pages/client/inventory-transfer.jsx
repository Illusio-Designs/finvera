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

export default function StockTransferPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    quantity: '0',
    reason: '',
  });
  const [errors, setErrors] = useState({});

  // Memoize the fetch function
  const fetchFn = useMemo(
    () => (params) => accountingAPI.stockTransfers.list(params),
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

  const warehouseOptions = warehouses.map((wh) => ({
    value: wh.id,
    label: wh.warehouse_name + (wh.warehouse_code ? ` (${wh.warehouse_code})` : ''),
  }));

  const itemOptions = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.item_name}${item.item_code ? ` (${item.item_code})` : ''}`,
  }));

  const resetForm = () => {
    setFormData({
      inventory_item_id: '',
      from_warehouse_id: '',
      to_warehouse_id: '',
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

    if (!formData.from_warehouse_id) {
      newErrors.from_warehouse_id = 'From warehouse is required';
    }

    if (!formData.to_warehouse_id) {
      newErrors.to_warehouse_id = 'To warehouse is required';
    }

    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      newErrors.to_warehouse_id = 'To warehouse must be different from from warehouse';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero';
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
        from_warehouse_id: formData.from_warehouse_id,
        to_warehouse_id: formData.to_warehouse_id,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason || null,
      };

      await accountingAPI.stockTransfers.create(payload);
      toast.success('Stock transfer created successfully');
      
      resetForm();
      fetchData();
      window.location.reload();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create stock transfer';
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
      render: (value) => (value ? formatDate(value) : '-'),
    },
    { key: 'item_name', label: 'Item Name' },
    { key: 'item_code', label: 'Item Code' },
    { key: 'from_warehouse_name', label: 'From Warehouse' },
    { key: 'to_warehouse_name', label: 'To Warehouse' },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value) => (value ? parseFloat(value).toFixed(3) : '0.000'),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (value) => formatCurrency(value || 0),
    },
    { key: 'narration', label: 'Reason/Narration' },
  ];

  const tableData = Array.isArray(data) ? data : [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Stock Transfer">
        <PageLayout
          title="Stock Transfer"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Inventory', href: '/client/inventory' },
            { label: 'Stock Transfer' },
          ]}
          actions={
            !showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>New Transfer</span>
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
                <h2 className="text-xl font-semibold text-gray-900">New Stock Transfer</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Transfer stock from one warehouse to another
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
                    name="from_warehouse_id"
                    label="From Warehouse"
                    value={formData.from_warehouse_id}
                    onChange={(name, value) => handleChange(name, value)}
                    options={warehouseOptions}
                    error={errors.from_warehouse_id}
                    placeholder="Select source warehouse"
                    required
                  />

                  <FormSelect
                    name="to_warehouse_id"
                    label="To Warehouse"
                    value={formData.to_warehouse_id}
                    onChange={(name, value) => handleChange(name, value)}
                    options={warehouseOptions.filter(
                      (opt) => opt.value !== formData.from_warehouse_id
                    )}
                    error={errors.to_warehouse_id}
                    placeholder="Select destination warehouse"
                    required
                  />

                  <FormInput
                    name="quantity"
                    label="Transfer Quantity"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.quantity}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.quantity}
                    placeholder="Enter quantity to transfer"
                    required
                  />

                  <div className="md:col-span-2">
                    <FormTextarea
                      name="reason"
                      label="Reason/Narration"
                      value={formData.reason}
                      onChange={(name, value) => handleChange(name, value)}
                      error={errors.reason}
                      placeholder="Enter reason for transfer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{loading ? 'Transferring...' : 'Create Transfer'}</span>
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
                searchPlaceholder="Search transfers..."
              />
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
