import { useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import DataTable from '../../../../components/tables/DataTable';
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
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <FiMove className="h-6 w-6" />
                  Stock Transfer
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Transfer stock between locations
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/client/inventory/transfer/new'}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                New Transfer
              </Button>
            </div>

            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              emptyMessage="No stock transfers found. Click 'New Transfer' to create one."
            />
          </Card>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}
