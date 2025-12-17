import { useRouter } from 'next/router';
import { useApi } from '../../../hooks/useApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { eWayBillAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function EWayBillDetail() {
  const router = useRouter();
  const { voucher_id } = router.query;

  const { data, loading, execute, setData } = useApi(
    () => eWayBillAPI.get(voucher_id),
    true,
    [voucher_id]
  );

  const ewb = data?.eWayBill || data?.data?.eWayBill || data?.data || data?.eWayBill || null;

  const handleCancel = async () => {
    try {
      await eWayBillAPI.cancel(voucher_id, { reason: 'Cancelled by user' });
      toast.success('E-Way Bill cancelled');
      // refresh
      const fresh = await eWayBillAPI.get(voucher_id);
      setData(fresh.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <ProtectedRoute>
      <ClientLayout title="E-Way Bill - Client Portal">
        <Toaster />
        <PageLayout
          title="E-Way Bill"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'E-Way Bill', href: '/client/ewaybill' },
            { label: String(voucher_id || '').slice(0, 8).toUpperCase() || 'Detail' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/client/ewaybill')}>
                Back
              </Button>
              <Button onClick={() => router.push('/client/ewaybill/generate')}>Generate</Button>
            </div>
          }
        >
          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!loading && !ewb && (
            <Card>
              <div className="text-sm text-gray-600">No E-Way Bill found for this voucher.</div>
              <div className="mt-4">
                <Button onClick={() => router.push('/client/ewaybill/generate')}>Generate E-Way Bill</Button>
              </div>
            </Card>
          )}

          {!loading && ewb && (
            <Card title="Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">E-Way Bill No</div>
                  <div className="font-semibold">{ewb.eway_bill_no || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div>
                    <Badge
                      variant={
                        ewb.status === 'generated'
                          ? 'success'
                          : ewb.status === 'cancelled'
                          ? 'danger'
                          : ewb.status === 'pending'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {ewb.status || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Generated At</div>
                  <div className="font-medium">
                    {ewb.generated_at ? new Date(ewb.generated_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Valid Upto</div>
                  <div className="font-medium">
                    {ewb.valid_upto ? new Date(ewb.valid_upto).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Vehicle No</div>
                  <div className="font-medium">{ewb.vehicle_no || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Transport Mode</div>
                  <div className="font-medium">{ewb.transport_mode || 'N/A'}</div>
                </div>
              </div>

              {ewb.status === 'generated' && (
                <div className="mt-6">
                  <Button variant="danger" onClick={handleCancel}>
                    Cancel E-Way Bill
                  </Button>
                </div>
              )}
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

