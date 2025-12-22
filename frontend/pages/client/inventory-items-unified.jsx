import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import SearchableHSNSelect from '../../components/forms/SearchableHSNSelect';
import DataTable from '../../components/tables/DataTable';
import { accountingAPI } from '../../lib/api';
import { useTable } from '../../hooks/useTable';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';
import { formatCurrency } from '../../lib/formatters';

export default function InventoryItemsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseOpeningStocks, setWarehouseOpeningStocks] = useState([]);
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    hsn_sac_code: '',
    uqc: '',
    gst_rate: '',
    quantity_on_hand: '0',
    avg_cost: '0',
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await accountingAPI.warehouses.getAll({ is_active: true });
        setWarehouses(response.data || []);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };
    fetchWarehouses();
  }, []);

  const warehouseOptions = warehouses.map((wh) => ({
    value: wh.id,
    label: wh.warehouse_name + (wh.warehouse_code ? ` (${wh.warehouse_code})` : ''),
  }));

  // Memoize the fetch function
  const fetchFn = useMemo(
    () => (params) => accountingAPI.inventory.items.list(params),
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
      item_code: '',
      item_name: '',
      hsn_sac_code: '',
      uqc: '',
      gst_rate: '',
      quantity_on_hand: '0',
      avg_cost: '0',
      is_active: true,
    });
    setErrors({});
    setWarehouseOpeningStocks([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleHSNSelect = (hsnData) => {
    setFormData((prev) => ({
      ...prev,
      hsn_sac_code: hsnData.hsn_sac_code,
      gst_rate: hsnData.gst_rate ? hsnData.gst_rate.toString() : prev.gst_rate,
      uqc: hsnData.uqc || prev.uqc,
    }));
  };

  const handleEdit = async (id) => {
    try {
      const response = await accountingAPI.inventory.items.get(id);
      const item = response.data;
      setFormData({
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        hsn_sac_code: item.hsn_sac_code || '',
        uqc: item.uqc || '',
        gst_rate: item.gst_rate ? item.gst_rate.toString() : '',
        quantity_on_hand: item.quantity_on_hand ? item.quantity_on_hand.toString() : '0',
        avg_cost: item.avg_cost ? item.avg_cost.toString() : '0',
        is_active: item.is_active !== false,
      });

      // Fetch warehouse stocks for this item
      try {
        const warehouseStockResponse = await accountingAPI.inventory.items.getWarehouseStock(id);
        const warehouseStocks = warehouseStockResponse.data || [];
        setWarehouseOpeningStocks(
          warehouseStocks.map((ws) => ({
            warehouse_id: ws.warehouse_id,
            quantity: ws.quantity ? ws.quantity.toString() : '0',
            avg_cost: ws.avg_cost ? ws.avg_cost.toString() : '0',
          }))
        );
      } catch (error) {
        console.error('Error fetching warehouse stock:', error);
        setWarehouseOpeningStocks([]);
      }

      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await accountingAPI.inventory.items.delete(id);
      toast.success('Item deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete item');
    }
  };

  const addWarehouseOpeningStock = () => {
    setWarehouseOpeningStocks([
      ...warehouseOpeningStocks,
      { warehouse_id: '', quantity: '0', avg_cost: '0' },
    ]);
  };

  const removeWarehouseOpeningStock = (index) => {
    setWarehouseOpeningStocks(warehouseOpeningStocks.filter((_, i) => i !== index));
  };

  const updateWarehouseOpeningStock = (index, field, value) => {
    const updated = [...warehouseOpeningStocks];
    updated[index] = { ...updated[index], [field]: value };
    setWarehouseOpeningStocks(updated);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.item_name?.trim()) {
      newErrors.item_name = 'Item name is required';
    }

    if (formData.gst_rate && (isNaN(formData.gst_rate) || parseFloat(formData.gst_rate) < 0 || parseFloat(formData.gst_rate) > 100)) {
      newErrors.gst_rate = 'GST rate must be between 0 and 100';
    }

    if (formData.quantity_on_hand && (isNaN(formData.quantity_on_hand) || parseFloat(formData.quantity_on_hand) < 0)) {
      newErrors.quantity_on_hand = 'Quantity must be a positive number';
    }

    if (formData.avg_cost && (isNaN(formData.avg_cost) || parseFloat(formData.avg_cost) < 0)) {
      newErrors.avg_cost = 'Average cost must be a positive number';
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
        item_code: formData.item_code || null,
        item_name: formData.item_name.trim(),
        hsn_sac_code: formData.hsn_sac_code || null,
        uqc: formData.uqc || null,
        gst_rate: formData.gst_rate ? parseFloat(formData.gst_rate) : null,
        quantity_on_hand: parseFloat(formData.quantity_on_hand) || 0,
        avg_cost: parseFloat(formData.avg_cost) || 0,
        is_active: formData.is_active,
      };

      let itemId;
      if (editingId) {
        await accountingAPI.inventory.items.update(editingId, payload);
        itemId = editingId;
        toast.success('Item updated successfully');
      } else {
        const response = await accountingAPI.inventory.items.create(payload);
        itemId = response.data.id;
        toast.success('Item created successfully');
      }

      // Save warehouse opening stocks (only for new items or when explicitly updating)
      if (warehouseOpeningStocks.length > 0) {
        for (const ws of warehouseOpeningStocks) {
          if (ws.warehouse_id && parseFloat(ws.quantity) >= 0) {
            try {
              await accountingAPI.inventory.items.setOpeningStock(itemId, {
                warehouse_id: ws.warehouse_id,
                quantity: parseFloat(ws.quantity) || 0,
                avg_cost: parseFloat(ws.avg_cost) || 0,
              });
            } catch (error) {
              console.error('Error setting warehouse opening stock:', error);
              // Continue with other warehouses even if one fails
            }
          }
        }
      }

      resetForm();
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save item';
      toast.error(errorMessage);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'item_name', label: 'Item Name', sortable: true },
    { key: 'item_code', label: 'Item Code', sortable: true },
    { key: 'hsn_sac_code', label: 'HSN/SAC Code' },
    { key: 'uqc', label: 'Unit' },
    {
      key: 'quantity_on_hand',
      label: 'Stock Qty',
      render: (value) => value ? parseFloat(value).toFixed(3) : '0.000'
    },
    {
      key: 'avg_cost',
      label: 'Avg Cost',
      render: (value) => formatCurrency(value || 0)
    },
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
      <ClientLayout title="Inventory Items">
        <PageLayout
          title="Inventory Items"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Inventory Items' },
          ]}
          actions={
            !showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Item</span>
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
                  {editingId ? 'Edit Inventory Item' : 'New Inventory Item'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingId ? 'Update item information' : 'Add a new inventory item'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="item_name"
                    label="Item Name"
                    value={formData.item_name}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.item_name}
                    required
                    placeholder="Enter item name"
                  />

                  <FormInput
                    name="item_code"
                    label="Item Code"
                    value={formData.item_code}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.item_code}
                    placeholder="Enter item code (optional)"
                  />

                  <SearchableHSNSelect
                    name="hsn_sac_code"
                    label="HSN/SAC Code"
                    value={formData.hsn_sac_code}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.hsn_sac_code}
                    placeholder="Search HSN/SAC code..."
                    onHSNSelect={handleHSNSelect}
                  />

                  <FormInput
                    name="uqc"
                    label="Unit of Measurement (UQC)"
                    value={formData.uqc}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.uqc}
                    placeholder="e.g., NOS, KGS, LTR (optional)"
                  />

                  <FormInput
                    name="gst_rate"
                    label="GST Rate (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.gst_rate}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.gst_rate}
                    placeholder="Enter GST rate (optional)"
                  />

                  <FormInput
                    name="quantity_on_hand"
                    label="Initial Stock Quantity"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.quantity_on_hand}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.quantity_on_hand}
                    placeholder="0"
                  />

                  <FormInput
                    name="avg_cost"
                    label="Average Cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.avg_cost}
                    onChange={(name, value) => handleChange(name, value)}
                    error={errors.avg_cost}
                    placeholder="0.00"
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

                {/* Warehouse Opening Stock Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Opening Stock by Warehouse</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Set initial stock quantity and cost for specific warehouses (optional)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addWarehouseOpeningStock}
                      className="flex items-center gap-2"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Add Warehouse</span>
                    </Button>
                  </div>

                  {warehouseOpeningStocks.length > 0 && (
                    <div className="space-y-4">
                      {warehouseOpeningStocks.map((ws, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <FormSelect
                            name={`warehouse_${index}`}
                            label="Warehouse"
                            value={ws.warehouse_id}
                            onChange={(name, value) => updateWarehouseOpeningStock(index, 'warehouse_id', value)}
                            options={warehouseOptions}
                            placeholder="Select warehouse"
                            required
                          />
                          <FormInput
                            name={`quantity_${index}`}
                            label="Quantity"
                            type="number"
                            step="0.001"
                            min="0"
                            value={ws.quantity}
                            onChange={(name, value) => updateWarehouseOpeningStock(index, 'quantity', value)}
                            placeholder="0"
                            required
                          />
                          <FormInput
                            name={`cost_${index}`}
                            label="Average Cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={ws.avg_cost}
                            onChange={(name, value) => updateWarehouseOpeningStock(index, 'avg_cost', value)}
                            placeholder="0.00"
                            required
                          />
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeWarehouseOpeningStock(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {warehouseOpeningStocks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No warehouse opening stock entries. Click &quot;Add Warehouse&quot; to add one.</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : editingId ? 'Update Item' : 'Create Item'}</span>
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
