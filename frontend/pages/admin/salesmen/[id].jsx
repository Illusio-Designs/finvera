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

export default function SalesmanDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error, execute } = useApi(() => adminAPI.salesmen.get(id), !!id);

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
            <p className="text-red-600">{error || 'Salesman not found'}</p>
            <Button variant="outline" onClick={() => router.push('/admin/salesmen')} className="mt-4">
              Back to Salesmen
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const salesman = data.data || data;

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title={`${salesman.full_name} - Admin Panel`}>
        <PageLayout
          title={salesman.full_name}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Salesmen', href: '/admin/salesmen' },
            { label: salesman.full_name },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/salesmen/${id}/performance`)}
              >
                Performance
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/salesmen/edit/${id}`)}
              >
                Edit
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Salesman Information">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Salesman Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{salesman.salesman_code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{salesman.full_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {salesman.commission_rate ? `${salesman.commission_rate}%` : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={salesman.is_active ? 'success' : 'danger'}>
                      {salesman.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

