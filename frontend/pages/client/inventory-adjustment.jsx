import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';
import { FiEdit, FiPlus } from 'react-icons/fi';

export default function StockAdjustmentPage() {
  const [loading, setLoading] = useState(false);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'item', label: 'Item' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reason', label: 'Reason' },
    { key: 'actions', label: 'Actions' },
  ];

  const data = [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Stock Adjustment">
        <PageLayout
          title="Stock Adjustment"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Stock Adjustment' },
          ]}
          actions={
            <Button
              onClick={() => window.location.href = '/client/inventory/adjustment/new'}
              className="flex items-center gap-3"
            >
              <FiPlus className="h-4 w-4" />
              <span>New Adjustment</span>
            </Button>
          }
        >
          <Card>
            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              emptyMessage="No stock adjustments found. Click 'New Adjustment' to create one."
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
