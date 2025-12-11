import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import Layout from '../../components/Layout';
import { clientAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function ClientDashboard() {
  const [stats, setStats] = useState({
    totalVouchers: 0,
    totalLedgers: 0,
    totalInvoices: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data from API
      // For now, using placeholder data
      setStats({
        totalVouchers: 0,
        totalLedgers: 0,
        totalInvoices: 0,
        pendingPayments: 0,
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Dashboard - Finvera">
        <Toaster />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Total Vouchers</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVouchers}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Ledgers</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLedgers}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Invoices</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-gray-500 text-sm font-medium">Pending Payments</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingPayments}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push('/client/vouchers')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-900">Create Voucher</div>
                    <div className="text-sm text-gray-500 mt-1">Create a new accounting voucher</div>
                  </button>
                  <button
                    onClick={() => router.push('/client/ledgers')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-900">Manage Ledgers</div>
                    <div className="text-sm text-gray-500 mt-1">View and manage ledgers</div>
                  </button>
                  <button
                    onClick={() => router.push('/client/reports')}
                    className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-900">View Reports</div>
                    <div className="text-sm text-gray-500 mt-1">Generate financial reports</div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="text-gray-500 text-center py-8">
                  No recent activity
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

