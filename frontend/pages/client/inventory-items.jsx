import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';
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
        <PageLayout
          title="Inventory Items"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Inventory Items' },
          ]}
          actions={
            <Button
              onClick={() => window.location.href = '/client/inventory/items/new'}
              className="flex items-center gap-3"
            >
              <FiPlus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
          }
        >
          <Card>
            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              emptyMessage="No items found. Click 'Add Item' to create your first inventory item."
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
