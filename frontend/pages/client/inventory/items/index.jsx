import { useRouter } from 'next/router';
import { useMemo } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import DataTable from '../../../../components/tables/DataTable';
import { accountingAPI } from '../../../../lib/api';
import { useTable } from '../../../../hooks/useTable';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../../../lib/formatters';

export default function InventoryItemsPage() {
  const router = useRouter();

  // Memoize the fetch function to prevent recreation on every render
  const fetchFn = useMemo(
    () => (params) => accountingAPI.inventory.items.list(params),
    []
  );

  const {
    data,
    loading,
    pagination,
    sort,
    handlePageChange,
    handleSort: handleTableSort,
    handleFilter,
    fetchData,
  } = useTable(fetchFn, { limit: 20 });

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

  const handleTableFilter = (filters) => {
    handleFilter(filters);
  };

  const handleTableSortClick = (field) => {
    handleTableSort(field);
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
            onClick={() => router.push(`/client/inventory/items/${row.id}/edit`)}
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
            { label: 'Inventory', href: '/client/inventory/items' },
            { label: 'Items' },
          ]}
          actions={
            <Button
              onClick={() => router.push('/client/inventory/items/new')}
              className="flex items-center gap-2"
            >
              <FiPlus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
          }
        >
          <Card>
            <DataTable
              columns={columns}
              data={tableData}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleTableSortClick}
              onFilter={handleTableFilter}
              sortField={sort.field}
              sortOrder={sort.order}
              searchable={true}
              searchPlaceholder="Search by name, code, or HSN/SAC..."
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
