import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import AdminLayout from '../../../../components/layouts/AdminLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Card from '../../../../components/ui/Card';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { useApi } from '../../../../hooks/useApi';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';

export default function SalesmanPerformance() {
  const router = useRouter();
  const { id } = router.query;
  const { data: salesmanData, loading: salesmanLoading } = useApi(() => adminAPI.salesmen.get(id), !!id);
  const { data: performanceData, loading: performanceLoading } = useApi(
    () => adminAPI.salesmen.getPerformance(id, {}),
    !!id
  );

  if (salesmanLoading || performanceLoading) {
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

  const salesman = salesmanData?.data || salesmanData;
  const performance = performanceData?.data || performanceData || {};

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title={`${salesman?.full_name} Performance - Admin Panel`}>
        <PageLayout
          title={`${salesman?.full_name} - Performance`}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Salesmen', href: '/admin/salesmen' },
            { label: salesman?.full_name, href: `/admin/salesmen/${id}` },
            { label: 'Performance' },
          ]}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="text-gray-500 text-sm font-medium">Total Leads</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{performance.totalLeads || 0}</div>
            </Card>
            <Card>
              <div className="text-gray-500 text-sm font-medium">Converted Leads</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{performance.convertedLeads || 0}</div>
            </Card>
            <Card>
              <div className="text-gray-500 text-sm font-medium">Total Commission</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(performance.totalCommission || 0)}
              </div>
            </Card>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

