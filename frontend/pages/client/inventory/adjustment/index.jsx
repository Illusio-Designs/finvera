import { useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import DataTable from '../../../../components/tables/DataTable';
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
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <FiEdit className="h-6 w-6" />
                  Stock Adjustment
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Adjust stock quantities for inventory items
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/client/inventory/adjustment/new'}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                New Adjustment
              </Button>
            </div>

            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              emptyMessage="No stock adjustments found. Click 'New Adjustment' to create one."
            />
          </Card>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}
