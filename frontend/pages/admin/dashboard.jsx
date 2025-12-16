import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DataTable from '../../components/tables/DataTable';
import { adminAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiBriefcase, FiUsers, FiTarget, FiDollarSign,
  FiCreditCard, FiTrendingUp, FiArrowRight, FiPieChart,
  FiBarChart2, FiCalendar, FiTrendingDown, FiCheckCircle
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
  const { user } = useAuth();
  const userRole = user?.role;

  // Role-specific dashboard data
  const [roleDashboardData, setRoleDashboardData] = useState({
    targets: {
      total: 0,
      achieved: 0,
      left: 0,
      percentage: 0,
      list: [],
    },
    commissions: {
      total: 0,
      pending: 0,
      approved: 0,
      list: [],
    },
    tenants: {
      total: 0,
    },
    // Performance metrics for salesmen
    performance: {
      leads: 0,
      customers: 0,
      conversionRate: 0,
    },
  });

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      // Fetch role-specific dashboard data
      if (userRole === 'distributor') {
        const response = await adminAPI.distributors.dashboard();
        const data = response.data.data || response.data;
        setRoleDashboardData(data);
      } else if (userRole === 'salesman') {
        // Fetch dashboard data
        const dashboardResponse = await adminAPI.salesmen.dashboard();
        const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
        
        // Fetch performance data for leads/customers metrics
        // The dashboard endpoint uses req.user_id, so we can try using user.id
        // If it fails, the backend will handle it or we'll just show dashboard data
        try {
          // Try to get salesman ID - the getPerformance endpoint needs salesman.id
          // We'll try with user.id first (which should work if backend handles user_id -> salesman lookup)
          const userId = user?.id || user?.user_id;
          if (userId) {
            try {
              const performanceResponse = await adminAPI.salesmen.getPerformance(userId, {});
              const performanceData = performanceResponse.data?.performance || performanceResponse.data?.data?.performance || {};
              
              // Merge performance data into dashboard data
              setRoleDashboardData({
                ...dashboardData,
                performance: {
                  leads: performanceData.leads || 0,
                  customers: performanceData.customers || 0,
                  conversionRate: performanceData.conversionRate || 0,
                },
              });
            } catch (perfError) {
              // If performance endpoint fails (maybe needs salesman.id not user.id), just use dashboard data
              console.warn('Performance data unavailable, showing dashboard data only');
              setRoleDashboardData(dashboardData);
            }
          } else {
            setRoleDashboardData(dashboardData);
          }
        } catch (error) {
          setRoleDashboardData(dashboardData);
        }
      } else {
        // Admin/super_admin/finance_manager - fetch admin dashboard
      const response = await adminAPI.dashboard();
      const data = response.data.data || response.data;
      setStats(data);
      }
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

  // Commission columns for role-based dashboards
  const commissionColumns = [
    {
      key: 'tenant_id',
      label: 'Tenant',
      render: (value, row) => (value ? value.substring(0, 8) : 'N/A'),
    },
    {
      key: 'subscription_plan',
      label: 'Plan',
      render: (value) => value || 'N/A',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'commission_rate',
      label: 'Rate',
      render: (value) => `${value || 0}%`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const status = value || 'pending';
        const colors = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  // Render role-based dashboard (distributor/salesman)
  if (userRole === 'distributor' || userRole === 'salesman') {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout>
          <Toaster />
          <PageLayout
            title="Dashboard"
            breadcrumbs={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Dashboard' },
            ]}
          >
            <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${userRole === 'salesman' ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'} gap-4`}>
                  <Card className="shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Target</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(roleDashboardData.targets.total)}</p>
                      </div>
                      <div className="bg-blue-500 p-3 rounded-lg text-white">
                        <FiTarget className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Achieved</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(roleDashboardData.targets.achieved)}</p>
                        <p className="text-xs text-gray-500 mt-1">{roleDashboardData.targets.percentage}%</p>
                      </div>
                      <div className="bg-green-500 p-3 rounded-lg text-white">
                        <FiCheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Left to Achieve</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(roleDashboardData.targets.left)}</p>
                      </div>
                      <div className="bg-orange-500 p-3 rounded-lg text-white">
                        <FiTrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Commissions</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(roleDashboardData.commissions.total)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(roleDashboardData.commissions.pending)} pending
                        </p>
                      </div>
                      <div className="bg-purple-500 p-3 rounded-lg text-white">
                        <FiDollarSign className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  {/* Additional performance metrics for salesmen */}
                  {userRole === 'salesman' && (
                    <>
                      <Card className="shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
                            <p className="text-2xl font-bold text-gray-900">{roleDashboardData.performance?.leads || 0}</p>
                          </div>
                          <div className="bg-indigo-500 p-3 rounded-lg text-white">
                            <FiUsers className="h-5 w-5" />
                          </div>
                        </div>
                      </Card>

                      <Card className="shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Converted Leads</p>
                            <p className="text-2xl font-bold text-green-600">{roleDashboardData.performance?.customers || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {roleDashboardData.performance?.conversionRate?.toFixed(1) || 0}% conversion
                            </p>
                          </div>
                          <div className="bg-teal-500 p-3 rounded-lg text-white">
                            <FiBriefcase className="h-5 w-5" />
                          </div>
                        </div>
                      </Card>
                    </>
                  )}
                </div>

                {/* Target Progress */}
                <Card className="shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Progress</h2>
                  <div className="space-y-4">
                    {roleDashboardData.targets.list.length > 0 ? (
                      roleDashboardData.targets.list.map((target) => {
                        const percentage = target.target_value > 0 
                          ? (target.achieved_value / target.target_value) * 100 
                          : 0;
                        return (
                          <div key={target.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {target.target_type === 'revenue' ? 'Revenue' : 'Subscription'} Target
                                </p>
                                <p className="text-sm text-gray-600">
                                  {target.start_date && target.end_date 
                                    ? `${new Date(target.start_date).toLocaleDateString()} - ${new Date(target.end_date).toLocaleDateString()}`
                                    : 'No date range'}
                                </p>
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Achieved: {formatCurrency(target.achieved_value)}</span>
                              <span>Target: {formatCurrency(target.target_value)}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No active targets</p>
                    )}
                  </div>
                </Card>

                {/* Commissions List */}
                <Card className="shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Commissions</h2>
                    <button
                      onClick={() => router.push('/admin/commissions-payouts')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                    >
                      View All <FiArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                  {roleDashboardData.commissions.list.length > 0 ? (
                    <DataTable
                      columns={commissionColumns}
                      data={roleDashboardData.commissions.list}
                      loading={false}
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-4">No commissions yet</p>
                  )}
                </Card>

                {/* Tenants Summary */}
                <Card className="shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Total Tenants</h2>
                      <p className="text-3xl font-bold text-primary-600">{roleDashboardData.tenants.total}</p>
                    </div>
                    <button
                      onClick={() => router.push('/admin/tenants')}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center"
                    >
                      <FiBriefcase className="mr-2 h-4 w-4" />
                      View Tenants
                    </button>
                  </div>
                </Card>
              </>
            )}
            </div>
          </PageLayout>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  // Render admin dashboard (admin/super_admin/finance_manager)
  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <Toaster />
        <PageLayout
          title="Dashboard"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Dashboard' },
          ]}
        >
        <div className="space-y-5">
          {/* Stats Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {statCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={index}
                      onClick={() => router.push(card.href)}
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-200 hover:border-primary-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 mb-1 truncate">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                          <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                        </div>
                        <div className={`${card.color} p-3 rounded-lg text-white flex-shrink-0 ml-3 shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View details <FiArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Revenue Overview */}
              <Card className="shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiBarChart2 className="mr-2 h-5 w-5 text-primary-600" />
                    Revenue Overview
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-primary-50 to-white hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-primary-600">{formatCurrency(stats.revenue?.total || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">Lifetime</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow">
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
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-600 mb-1">Yearly Revenue</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.revenue?.yearly || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">This year</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow">
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
              </Card>

              {/* Commission Breakdown */}
              <Card className="shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiDollarSign className="mr-2 h-5 w-5 text-primary-600" />
                    Commission Breakdown
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-600 mb-1">Total Commissions</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.commissions?.total || 0)}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-600 mb-1">Distributor Commissions</div>
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.commissions?.distributor || 0)}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-gray-600 mb-1">Salesman Commissions</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.commissions?.salesman || 0)}</div>
                  </div>
                </div>
              </Card>

              {/* Tenant Acquisition Categories */}
              <Card className="shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
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
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(action.href)}
                        className={`${action.color} p-4 rounded-lg transition-all duration-200 text-left group hover:shadow-md`}
                      >
                        <Icon className="h-5 w-5 mb-2" />
                        <div className="font-semibold text-sm">{action.label}</div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
