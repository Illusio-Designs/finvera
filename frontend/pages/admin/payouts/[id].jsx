import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useApi } from '../../../hooks/useApi';
import { adminAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';

export default function PayoutDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error, execute } = useApi(() => adminAPI.payouts.get(id), !!id);

  useEffect(() => {
    if (id) {
      execute();
    }
  }, [id, execute]);

  const handleProcess = async () => {
    try {
      await adminAPI.payouts.process(id, {});
      toast.success('Payout processed successfully');
      execute();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payout');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout>
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Payout not found'}</p>
            <Button variant="outline" onClick={() => router.push('/admin/payouts')} className="mt-4">
              Back to Payouts
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const payout = data.data || data;

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Payout Details - Admin Panel">
        <Toaster />
        <PageLayout
          title="Payout Details"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Payouts', href: '/admin/payouts' },
            { label: 'Details' },
          ]}
          actions={
            payout.status === 'pending' && (
              <Button onClick={handleProcess}>Process Payout</Button>
            )
          }
        >
          <Card title="Payout Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1">
                  <Badge variant="primary">{payout.payout_type || 'N/A'}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(payout.total_amount)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      payout.status === 'completed'
                        ? 'success'
                        : payout.status === 'processing'
                        ? 'info'
                        : payout.status === 'failed'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {payout.status || 'N/A'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900">{payout.payment_method || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Paid Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {payout.paid_date ? new Date(payout.paid_date).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </Card>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

