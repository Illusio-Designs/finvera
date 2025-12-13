import { useEffect, useState } from 'react';
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
import toast, { Toaster } from 'react-hot-toast';

export default function TenantDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error, execute } = useApi(() => adminAPI.tenants.get(id), !!id);

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
            <p className="text-red-600">{error || 'Tenant not found'}</p>
            <Button variant="outline" onClick={() => router.push('/admin/tenants')} className="mt-4">
              Back to Tenants
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const tenant = data.data || data;

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title={`${tenant.company_name} - Admin Panel`}>
        <Toaster />
        <PageLayout
          title={tenant.company_name}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Tenants', href: '/admin/tenants' },
            { label: tenant.company_name },
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/tenants/edit/${id}`)}
            >
              Edit
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Company Information">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.company_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.gstin || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">PAN</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.pan || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={tenant.is_active ? 'success' : 'danger'}>
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </Card>

            <Card title="Subscription">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.subscription_plan || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {tenant.subscription_start ? new Date(tenant.subscription_start).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {tenant.subscription_end ? new Date(tenant.subscription_end).toLocaleDateString() : 'N/A'}
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

