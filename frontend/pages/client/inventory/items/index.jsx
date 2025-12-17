import { useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import DataTable from '../../../../components/tables/DataTable';
import { FiPackage, FiPlus } from 'react-icons/fi';

export default function InventoryItemsPage() {
  const [loading, setLoading] = useState(false);

  const columns = [
    { key: 'name', label: 'Item Name' },
    { key: 'code', label: 'Item Code' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'stock', label: 'Stock Qty' },
    { key: 'actions', label: 'Actions' },
  ];

  const data = [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Inventory Items">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <FiPackage className="h-6 w-6" />
                  Inventory Items
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your inventory items and products
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/client/inventory/items/new'}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              emptyMessage="No items found. Click 'Add Item' to create your first inventory item."
            />
          </Card>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}
