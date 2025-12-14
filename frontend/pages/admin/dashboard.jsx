import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import { adminAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiBriefcase, FiUsers, FiTarget, FiDollarSign,
  FiCreditCard, FiTrendingUp, FiArrowRight
} from 'react-icons/fi';

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

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats.total_tenants || 0,
      subtitle: `${stats.active_tenants || 0} active`,
      icon: FiBriefcase,
      color: 'bg-blue-500',
      href: '/admin/tenants'
    },
    {
      title: 'Distributors',
      value: stats.total_distributors || 0,
      subtitle: 'Total registered',
      icon: FiUsers,
      color: 'bg-purple-500',
      href: '/admin/distributors'
    },
    {
      title: 'Salesmen',
      value: stats.total_salesmen || 0,
      subtitle: 'Total registered',
      icon: FiUsers,
      color: 'bg-green-500',
      href: '/admin/salesmen'
    },
    {
      title: 'Total Commissions',
      value: formatCurrency(stats.total_commissions || 0),
      subtitle: 'Lifetime total',
      icon: FiDollarSign,
      color: 'bg-yellow-500',
      href: '/admin/commissions'
    },
    {
      title: 'Total Payouts',
      value: formatCurrency(stats.total_payouts || 0),
      subtitle: 'Lifetime total',
      icon: FiCreditCard,
      color: 'bg-red-500',
      href: '/admin/payouts'
    },
    {
      title: 'Pending Balance',
      value: formatCurrency((stats.total_commissions || 0) - (stats.total_payouts || 0)),
      subtitle: 'To be paid out',
      icon: FiTrendingUp,
      color: 'bg-primary-600',
      href: '/admin/payouts'
    }
  ];

  const quickActions = [
    { label: 'Manage Tenants', icon: FiBriefcase, href: '/admin/tenants', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { label: 'Manage Distributors', icon: FiUsers, href: '/admin/distributors', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { label: 'Manage Salesmen', icon: FiUsers, href: '/admin/salesmen', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
    { label: 'Set Targets', icon: FiTarget, href: '/admin/targets', color: 'text-primary-600 bg-primary-50 hover:bg-primary-100' },
  ];

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Dashboard">
        <Toaster />
        <div className="space-y-6">
          {/* Stats Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
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
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
