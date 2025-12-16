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

export default function DistributorDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error, execute } = useApi(() => adminAPI.distributors.get(id), !!id);

  useEffect(() => {
    if (id) {
      execute();
    }
  }, [id, execute]);

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
            <p className="text-red-600">{error || 'Distributor not found'}</p>
            <Button variant="outline" onClick={() => router.push('/admin/distributors')} className="mt-4">
              Back to Distributors
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const distributor = data.data || data;

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title={`${distributor.company_name || distributor.distributor_code} - Admin Panel`}>
        <PageLayout
          title={distributor.company_name || distributor.distributor_code}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Distributors', href: '/admin/distributors' },
            { label: distributor.company_name || distributor.distributor_code },
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/distributors/edit/${id}`)}
            >
              Edit
            </Button>
          }
        >
          <Card title="Distributor Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Distributor Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{distributor.distributor_code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{distributor.company_name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {distributor.commission_rate ? `${distributor.commission_rate}%` : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
                <dd className="mt-1 text-sm text-gray-900">{distributor.payment_terms || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <Badge variant={distributor.is_active ? 'success' : 'danger'}>
                    {distributor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

