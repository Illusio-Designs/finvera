import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import { adminAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalDistributors: 0,
    totalSalesmen: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.dashboard();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Dashboard">
        <Toaster />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Total Tenants</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTenants}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Distributors</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDistributors}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Salesmen</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSalesmen}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Active Subscriptions</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSubscriptions}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push('/admin/tenants')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-900">Manage Tenants</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage all tenants</div>
                  </button>
                  <button
                    onClick={() => router.push('/admin/distributors')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-900">Manage Distributors</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage distributors</div>
                  </button>
                  <button
                    onClick={() => router.push('/admin/salesmen')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-900">Manage Salesmen</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage salesmen</div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

