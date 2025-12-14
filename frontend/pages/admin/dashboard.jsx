import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import { adminAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiBriefcase, FiUsers, FiTarget, FiDollarSign,
  FiCreditCard, FiTrendingUp, FiArrowRight, FiPieChart,
  FiBarChart2, FiCalendar, FiTrendingDown
} from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_tenants: 0,
    active_tenants: 0,
    total_distributors: 0,
    total_salesmen: 0,
    total_commissions: 0,
    total_payouts: 0,
    commissions: {
      total: 0,
      distributor: 0,
      salesman: 0,
    },
    revenue: {
      total: 0,
      monthly: 0,
      yearly: 0,
      last_month: 0,
      growth: 0,
      net: 0,
      by_plan: [],
    },
    tenant_categories: {
      breakdown: { distributor: 0, salesman: 0, referral: 0, organic: 0 },
      ratios: { distributor: 0, salesman: 0, referral: 0, organic: 0 },
    },
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
      title: 'Total Revenue',
      value: formatCurrency(stats.revenue?.total || 0),
      subtitle: `${formatCurrency(stats.revenue?.monthly || 0)} this month`,
      icon: FiBarChart2,
      color: 'bg-primary-600',
      href: '/admin/tenants'
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(stats.revenue?.net || 0),
      subtitle: 'After commissions',
      icon: FiTrendingUp,
      color: 'bg-green-600',
      href: '/admin/commissions'
    },
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
      color: 'bg-orange-500',
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
        <div className="space-y-5">
          {/* Stats Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {statCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => router.push(card.href)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 mb-1 truncate">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                          <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                        </div>
                        <div className={`${card.color} p-3 rounded-lg text-white flex-shrink-0 ml-3`}>
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

              {/* Revenue Overview */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiBarChart2 className="mr-2 h-5 w-5 text-primary-600" />
                    Revenue Overview
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-primary-600">{formatCurrency(stats.revenue?.total || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">Lifetime</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue?.monthly || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      {stats.revenue?.growth >= 0 ? (
                        <span className="text-green-600 flex items-center">
                          <FiTrendingUp className="h-3 w-3 mr-1" />
                          {Math.abs(stats.revenue?.growth || 0)}% vs last month
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <FiTrendingDown className="h-3 w-3 mr-1" />
                          {Math.abs(stats.revenue?.growth || 0)}% vs last month
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Yearly Revenue</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.revenue?.yearly || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">This year</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Net Revenue</div>
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenue?.net || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">After commissions</div>
                  </div>
                </div>
                
                {/* Revenue by Plan */}
                {stats.revenue?.by_plan && stats.revenue.by_plan.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue by Subscription Plan</h3>
                    <div className="space-y-2">
                      {stats.revenue.by_plan.map((plan, index) => {
                        const percentage = stats.revenue.total > 0 
                          ? ((plan.revenue / stats.revenue.total) * 100).toFixed(1)
                          : 0;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{plan.plan_name}</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(plan.revenue)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">{plan.count} tenants</span>
                                <span className="text-xs text-gray-500">{percentage}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Commission Breakdown */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiDollarSign className="mr-2 h-5 w-5 text-primary-600" />
                    Commission Breakdown
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Total Commissions</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.commissions?.total || 0)}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Distributor Commissions</div>
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.commissions?.distributor || 0)}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Salesman Commissions</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.commissions?.salesman || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Tenant Acquisition Categories */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiPieChart className="mr-2 h-5 w-5 text-primary-600" />
                    Tenant Acquisition Categories
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'distributor', label: 'Distributor', color: 'bg-purple-500', textColor: 'text-purple-600' },
                    { key: 'salesman', label: 'Salesman', color: 'bg-green-500', textColor: 'text-green-600' },
                    { key: 'referral', label: 'Referral', color: 'bg-blue-500', textColor: 'text-blue-600' },
                    { key: 'organic', label: 'Organic', color: 'bg-orange-500', textColor: 'text-orange-600' },
                  ].map((category) => {
                    const count = stats.tenant_categories?.breakdown?.[category.key] || 0;
                    const ratio = stats.tenant_categories?.ratios?.[category.key] || 0;
                    return (
                      <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">{category.label}</span>
                          <span className={`${category.color} w-3 h-3 rounded-full`}></span>
                        </div>
                        <div className="mb-2">
                          <div className="text-2xl font-bold text-gray-900">{count}</div>
                          <div className="text-xs text-gray-500">tenants</div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Percentage</span>
                            <span className={`text-sm font-semibold ${category.textColor}`}>{ratio}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${category.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${ratio}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(action.href)}
                        className={`${action.color} p-3 rounded-lg transition text-left group`}
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
