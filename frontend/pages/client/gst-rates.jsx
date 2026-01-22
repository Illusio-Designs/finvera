import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Card from '../../components/ui/Card';
import { useTable } from '../../hooks/useTable';
import { useState, useEffect } from 'react';

export default function GSTRatesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Since GST rates API was removed, we'll show a placeholder message
  useEffect(() => {
    setLoading(false);
    setData([]);
  }, []);

  const columns = [
    { key: 'hsn_sac_code', label: 'HSN/SAC', sortable: true },
    { key: 'item_type', label: 'Type', sortable: true, render: (v) => v || 'goods' },
    { key: 'gst_rate', label: 'GST %', sortable: true, render: (v) => (v !== undefined && v !== null ? v : '-') },
    { key: 'is_active', label: 'Active', sortable: true, render: (v) => (v ? 'Yes' : 'No') },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="GST Rates - Client Portal">
        <PageLayout
          title="GST Rates"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GST Rates' },
          ]}
        >
          <Card className="shadow-sm border border-gray-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">GST Rates</h3>
              <p className="text-gray-600 mb-4">
                GST rates are now fetched from live government APIs for accuracy.
              </p>
              <p className="text-sm text-gray-500">
                Use the HSN/SAC lookup in voucher creation to get current GST rates.
              </p>
            </div>
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
