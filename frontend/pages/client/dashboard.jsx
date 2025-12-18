import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { accountingAPI, companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiFileText, FiFolder, FiTrendingUp, FiDollarSign,
  FiBarChart2, FiArrowRight, FiFile, FiCreditCard, FiShoppingCart, FiTrendingDown, FiShield
} from 'react-icons/fi';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_vouchers: 0,
      total_ledgers: 0,
      total_invoices: 0,
      total_sales_invoices: 0,
      total_purchase_invoices: 0,
      total_payments: 0,
      total_receipts: 0,
      pending_bills: 0,
      total_outstanding: 0,
      receivables: 0,
      payables: 0,
      gst_credit: 0,
      current_month_sales: 0,
      current_month_purchase: 0,
      active_ledgers: 0,
    },
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Client');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchCompanyName();
  }, [user?.company_id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await accountingAPI.dashboard();
      const data = response.data?.data || response.data || {};
      setDashboardData({
        stats: data.stats || {},
        recent_activity: data.recent_activity || [],
      });
    } catch (error) {
      // Handle network errors and other errors
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
      const is404 = error.response?.status === 404;
      
      if (isNetworkError) {
        console.error('Network error - unable to reach server:', error);
        toast.error('Unable to connect to server. Please check your connection.');
      } else if (is404) {
        console.warn('Dashboard endpoint not found, using default data');
      } else {
        console.error('Dashboard error:', error);
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      }
      
      // Use default empty data for any error
      setDashboardData({
        stats: {
          total_vouchers: 0,
          total_ledgers: 0,
          total_invoices: 0,
          total_sales_invoices: 0,
          total_purchase_invoices: 0,
          total_payments: 0,
          total_receipts: 0,
          pending_bills: 0,
          total_outstanding: 0,
          receivables: 0,
          payables: 0,
          gst_credit: 0,
          current_month_sales: 0,
          current_month_purchase: 0,
          active_ledgers: 0,
        },
        recent_activity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyName = async () => {
    try {
      if (!user?.company_id) {
        setCompanyName('Client');
        return;
      }
      const response = await companyAPI.list();
      const companies = response.data?.data || response.data || [];
      const currentCompany = companies.find(c => c.id === user.company_id);
      if (currentCompany?.company_name) {
        setCompanyName(currentCompany.company_name);
      } else {
        setCompanyName('Client');
      }
    } catch (error) {
      console.error('Failed to fetch company name:', error);
      setCompanyName('Client');
    }
  };

  const { stats } = dashboardData;

  const statCards = [
    {
      title: 'Total Vouchers',
      value: stats.total_vouchers || 0,
      subtitle: `${stats.total_sales_invoices || 0} Sales, ${stats.total_purchase_invoices || 0} Purchase`,
      icon: FiFileText,
      color: 'bg-blue-500',
      href: '/client/vouchers/vouchers'
    },
    {
      title: 'Ledgers',
      value: stats.total_ledgers || 0,
      subtitle: `${stats.active_ledgers || 0} active`,
      icon: FiFolder,
      color: 'bg-purple-500',
      href: '/client/ledgers'
    },
    {
      title: 'Outstanding',
      value: formatCurrency(stats.total_outstanding || 0),
      subtitle: `${stats.pending_bills || 0} pending bills`,
      icon: FiDollarSign,
      color: 'bg-yellow-500',
      href: '/client/accounting/outstanding'
    },
    {
      title: 'Receivables',
      value: formatCurrency(stats.receivables || 0),
      subtitle: 'Amount to receive',
      icon: FiTrendingUp,
      color: 'bg-emerald-500',
      href: '/client/accounting/outstanding'
    },
    {
      title: 'Payables',
      value: formatCurrency(stats.payables || 0),
      subtitle: 'Amount to pay',
      icon: FiTrendingDown,
      color: 'bg-red-500',
      href: '/client/accounting/outstanding'
    },
    {
      title: 'GST Credit',
      value: formatCurrency(stats.gst_credit || 0),
      subtitle: 'Available ITC',
      icon: FiShield,
      color: 'bg-green-500',
      href: '/client/gst/returns/gstr3b'
    },
    {
      title: 'Payments',
      value: stats.total_payments || 0,
      subtitle: 'Total payment vouchers',
      icon: FiCreditCard,
      color: 'bg-indigo-500',
      href: '/client/accounting/payments'
    },
    {
      title: 'Receipts',
      value: stats.total_receipts || 0,
      subtitle: 'Total receipt vouchers',
      icon: FiShoppingCart,
      color: 'bg-teal-500',
      href: '/client/accounting/receipts'
    }
  ];

  const quickActions = [
    { label: 'Create Voucher', icon: FiFileText, href: '/client/vouchers/vouchers', variant: 'primary' },
    { label: 'Manage Ledgers', icon: FiFolder, href: '/client/ledgers', variant: 'secondary' },
    { label: 'View Reports', icon: FiBarChart2, href: '/client/reports', variant: 'outline' },
    { label: 'GST Filing', icon: FiTrendingUp, href: '/client/gst/returns/gstr1', variant: 'outline' },
  ];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Dashboard">
        <Toaster />
        <PageLayout
          title="Dashboard"
          breadcrumbs={[
            { label: companyName, href: '/client/dashboard' },
          ]}
        >
          <div className="space-y-6 w-full max-w-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <Card
                        key={index}
                        className="cursor-pointer group hover:shadow-lg transition-all duration-200"
                        onClick={() => router.push(card.href)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            {card.subtitle && (
                              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                            )}
                          </div>
                          <div className={`${card.color} p-3 rounded-lg text-white shadow-sm`}>
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

                {/* Quick Actions */}
                <Card title="Quick Actions">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          onClick={() => router.push(action.href)}
                          variant={action.variant || 'outline'}
                          className="flex items-center justify-start"
                        >
                          <Icon className="h-5 w-5 flex-shrink-0 mr-3" />
                          <span>{action.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card title="Recent Activity">
                  {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recent_activity.map((activity, index) => (
                        <div
                          key={activity.id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/client/vouchers/${activity.id}`)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded ${
                              activity.type === 'Sales' ? 'bg-green-100 text-green-700' :
                              activity.type === 'Purchase' ? 'bg-blue-100 text-blue-700' :
                              activity.type === 'Payment' ? 'bg-red-100 text-red-700' :
                              activity.type === 'Receipt' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {activity.type === 'Sales' && <FiTrendingUp className="h-4 w-4" />}
                              {activity.type === 'Purchase' && <FiTrendingDown className="h-4 w-4" />}
                              {activity.type === 'Payment' && <FiDollarSign className="h-4 w-4" />}
                              {activity.type === 'Receipt' && <FiCreditCard className="h-4 w-4" />}
                              {!['Sales', 'Purchase', 'Payment', 'Receipt'].includes(activity.type) && <FiFileText className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{activity.number}</p>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  activity.status === 'posted' ? 'bg-green-100 text-green-700' :
                                  activity.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {activity.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {activity.party || activity.narration || activity.type}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(activity.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8 text-sm">
                      No recent activity
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
