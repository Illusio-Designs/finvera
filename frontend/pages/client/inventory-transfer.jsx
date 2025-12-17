import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/tables/DataTable';
import { FiMove, FiPlus } from 'react-icons/fi';

export default function StockTransferPage() {
  const [loading, setLoading] = useState(false);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'item', label: 'Item' },
    { key: 'from', label: 'From Location' },
    { key: 'to', label: 'To Location' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'actions', label: 'Actions' },
  ];

  const data = [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Stock Transfer">
        <PageLayout
          title="Stock Transfer"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Stock Transfer' },
          ]}
          actions={
            <Button
              onClick={() => window.location.href = '/client/inventory/transfer/new'}
              className="flex items-center gap-3"
            >
              <FiPlus className="h-4 w-4" />
              <span>New Transfer</span>
            </Button>
          }
        >
          <Card>
            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              emptyMessage="No stock transfers found. Click 'New Transfer' to create one."
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
