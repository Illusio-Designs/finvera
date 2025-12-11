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

export default function CommissionDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error, execute } = useApi(() => adminAPI.commissions.get(id), !!id);

  useEffect(() => {
    if (id) {
      execute();
    }
  }, [id, execute]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="super_admin">
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
      <ProtectedRoute requiredRole="super_admin">
        <AdminLayout>
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Commission not found'}</p>
            <Button variant="outline" onClick={() => router.push('/admin/commissions')} className="mt-4">
              Back to Commissions
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const commission = data.data || data;

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Commission Details - Admin Panel">
        <PageLayout
          title="Commission Details"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Commissions', href: '/admin/commissions' },
            { label: 'Details' },
          ]}
        >
          <Card title="Commission Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1">
                  <Badge variant="primary">{commission.commission_type || 'N/A'}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(commission.amount)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {commission.commission_rate ? `${commission.commission_rate}%` : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      commission.status === 'paid'
                        ? 'success'
                        : commission.status === 'approved'
                        ? 'info'
                        : commission.status === 'cancelled'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {commission.status || 'N/A'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {commission.commission_date
                    ? new Date(commission.commission_date).toLocaleDateString()
                    : 'N/A'}
                </dd>
              </div>
            </dl>
          </Card>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

