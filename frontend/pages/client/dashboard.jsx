import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import { clientAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiFileText, FiFolder, FiTrendingUp, FiDollarSign,
  FiBarChart2, FiArrowRight, FiFile, FiCreditCard
} from 'react-icons/fi';

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

  const statCards = [
    {
      title: 'Total Vouchers',
      value: stats.totalVouchers,
      icon: FiFileText,
      color: 'bg-blue-500',
      href: '/client/accounting/vouchers'
    },
    {
      title: 'Ledgers',
      value: stats.totalLedgers,
      icon: FiFolder,
      color: 'bg-purple-500',
      href: '/client/accounting/ledgers'
    },
    {
      title: 'Invoices',
      value: stats.totalInvoices,
      icon: FiFile,
      color: 'bg-green-500',
      href: '/client/accounting/invoices'
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: FiDollarSign,
      color: 'bg-yellow-500',
      href: '/client/accounting/payments'
    }
  ];

  const quickActions = [
    { label: 'Create Voucher', icon: FiFileText, href: '/client/accounting/vouchers', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { label: 'Manage Ledgers', icon: FiFolder, href: '/client/accounting/ledgers', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { label: 'View Reports', icon: FiBarChart2, href: '/client/reports', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
    { label: 'GST Filing', icon: FiTrendingUp, href: '/client/gst/returns/gstr1', color: 'text-primary-600 bg-primary-50 hover:bg-primary-100' },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Dashboard">
        <Toaster />
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => router.push(card.href)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                        <div className={`${card.color} p-3 rounded-lg text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View details <FiArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(action.href)}
                        className={`${action.color} p-4 rounded-lg transition text-left group`}
                      >
                        <Icon className="h-5 w-5 mb-2" />
                        <div className="font-semibold text-sm">{action.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="text-gray-500 text-center py-8 text-sm">
                  No recent activity
                </div>
              </div>
            </>
          )}
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}
