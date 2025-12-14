import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import { adminAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_tenants: 0,
    active_tenants: 0,
    total_distributors: 0,
    total_salesmen: 0,
    total_commissions: 0,
    total_payouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.dashboard();
      const data = response.data.data || response.data;
      setStats(data);
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Tenants Stats */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-100 text-sm font-medium">Total Tenants</div>
                      <div className="text-3xl font-bold mt-2">{stats.total_tenants || 0}</div>
                      <div className="text-blue-100 text-xs mt-1">
                        {stats.active_tenants || 0} active
                      </div>
                    </div>
                    <div className="text-5xl opacity-20">🏢</div>
                  </div>
                </div>

                {/* Distributors Stats */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-purple-100 text-sm font-medium">Distributors</div>
                      <div className="text-3xl font-bold mt-2">{stats.total_distributors || 0}</div>
                      <div className="text-purple-100 text-xs mt-1">Total registered</div>
                    </div>
                    <div className="text-5xl opacity-20">👥</div>
                  </div>
                </div>

                {/* Salesmen Stats */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-100 text-sm font-medium">Salesmen</div>
                      <div className="text-3xl font-bold mt-2">{stats.total_salesmen || 0}</div>
                      <div className="text-green-100 text-xs mt-1">Total registered</div>
                    </div>
                    <div className="text-5xl opacity-20">👤</div>
                  </div>
                </div>

                {/* Commissions Stats */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-yellow-100 text-sm font-medium">Total Commissions</div>
                      <div className="text-3xl font-bold mt-2">
                        {formatCurrency(stats.total_commissions || 0)}
                      </div>
                      <div className="text-yellow-100 text-xs mt-1">Lifetime total</div>
                    </div>
                    <div className="text-5xl opacity-20">💰</div>
                  </div>
                </div>

                {/* Payouts Stats */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-100 text-sm font-medium">Total Payouts</div>
                      <div className="text-3xl font-bold mt-2">
                        {formatCurrency(stats.total_payouts || 0)}
                      </div>
                      <div className="text-red-100 text-xs mt-1">Lifetime total</div>
                    </div>
                    <div className="text-5xl opacity-20">💳</div>
                  </div>
                </div>

                {/* Pending Balance */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-lg shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-indigo-100 text-sm font-medium">Pending Balance</div>
                      <div className="text-3xl font-bold mt-2">
                        {formatCurrency((stats.total_commissions || 0) - (stats.total_payouts || 0))}
                      </div>
                      <div className="text-indigo-100 text-xs mt-1">To be paid out</div>
                    </div>
                    <div className="text-5xl opacity-20">📊</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => router.push('/admin/tenants')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="font-semibold text-gray-900">Manage Tenants</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage all tenants</div>
                  </button>
                  <button
                    onClick={() => router.push('/admin/distributors')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <div className="font-semibold text-gray-900">Manage Distributors</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage distributors</div>
                  </button>
                  <button
                    onClick={() => router.push('/admin/salesmen')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="text-2xl mb-2">👤</div>
                    <div className="font-semibold text-gray-900">Manage Salesmen</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage salesmen</div>
                  </button>
                  <button
                    onClick={() => router.push('/admin/targets')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-semibold text-gray-900">Set Targets</div>
                    <div className="text-sm text-gray-500 mt-1">Manage targets and goals</div>
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

