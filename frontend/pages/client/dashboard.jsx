import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { accountingAPI, companyAPI, clientSupportAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiFileText, FiFolder, FiTrendingUp, FiDollarSign,
  FiBarChart2, FiArrowRight, FiFile, FiCreditCard, FiShoppingCart, FiTrendingDown, FiShield, FiAlertCircle, FiHeadphones, FiPlus, FiLayers
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
      cash_on_hand: 0,
      gst_payable: 0,
      current_month_sales: 0,
      current_month_purchase: 0,
      active_ledgers: 0,
    },
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Client');
  const [recentTickets, setRecentTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consents, setConsents] = useState({
    creditScore: false,
    bankStatement: false,
    dataSharing: false,
    termsConditions: false,
    privacyPolicy: false,
  });
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchCompanyName();
    fetchRecentTickets();
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
          cash_on_hand: 0,
          gst_payable: 0,
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

  const fetchRecentTickets = async () => {
    try {
      setTicketsLoading(true);
      const response = await clientSupportAPI.tickets.list({
        page: 1,
        limit: 5,
      });
      const data = response.data?.data || response.data || [];
      setRecentTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
      setRecentTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleGetLoanClick = () => {
    setShowConsentModal(true);
  };

  const handleConsentChange = (key) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConsentSubmit = () => {
    // Check if all required consents are given
    const allConsentsGiven = Object.values(consents).every(consent => consent === true);
    
    if (!allConsentsGiven) {
      toast.error('Please accept all consents to proceed');
      return;
    }

    // Store consent in localStorage
    localStorage.setItem('finbox_consent', JSON.stringify({
      ...consents,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      companyId: user?.company_id,
    }));

    // Close modal and redirect to loan page
    setShowConsentModal(false);
    router.push('/client/loan');
    toast.success('Consent recorded. Redirecting to loan page...');
  };

  const allConsentsGiven = Object.values(consents).every(consent => consent === true);

  const { stats } = dashboardData;

  const statCards = [
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
      title: 'Cash on Hand',
      value: formatCurrency(stats.cash_on_hand || 0),
      subtitle: 'Available cash',
      icon: FiDollarSign,
      color: 'bg-blue-500',
      href: '/client/ledgers'
    },
    {
      title: 'Duties & Taxes',
      value: formatCurrency(stats.gst_payable || 0),
      subtitle: 'GST Payable',
      icon: FiAlertCircle,
      color: 'bg-orange-500',
      href: '/client/gst/returns/gstr3b'
    }
  ];

  const quickActions = [
    { label: 'Create Voucher', icon: FiFileText, href: '/client/vouchers/vouchers', variant: 'primary' },
    { label: 'Manage Ledgers', icon: FiFolder, href: '/client/ledgers', variant: 'secondary' },
    { label: 'View Reports', icon: FiBarChart2, href: '/client/reports', variant: 'outline' },
    { label: 'GST Filing', icon: FiTrendingUp, href: '/client/gst/returns/gstr1', variant: 'outline' },
    { label: 'Support Tickets', icon: FiHeadphones, href: '/client/support', variant: 'outline' },
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

                {/* Get Loan - Highlighted Section */}
                <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 shadow-lg">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2">Get Business Loan</h3>
                      <p className="text-indigo-100 text-sm md:text-base">
                        Quick and hassle-free business loans up to ₹15 Crore. Check your eligibility in minutes.
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FiShield className="h-4 w-4" />
                          <span>100% Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiTrendingUp className="h-4 w-4" />
                          <span>Quick Approval</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="h-4 w-4" />
                          <span>Best Rates</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        onClick={handleGetLoanClick}
                        variant="primary"
                        size="lg"
                        className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all"
                      >
                        <FiLayers className="h-5 w-5 mr-2" />
                        Get Loan Now
                        <FiArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card title="Quick Actions">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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

                {/* Support Tickets Widget */}
                <Card 
                  title="Support Tickets"
                  actions={
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => router.push('/client/support')}
                      >
                        <FiPlus className="h-4 w-4 mr-1" />
                        New Ticket
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/client/support')}
                      >
                        View All
                      </Button>
                    </div>
                  }
                >
                  {ticketsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : recentTickets.length > 0 ? (
                    <div className="space-y-3">
                      {recentTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => router.push('/client/support')}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded bg-blue-100 text-blue-700">
                              <FiHeadphones className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{ticket.ticket_number}</p>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                  ticket.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                  ticket.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {ticket.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">{ticket.subject}</p>
                              <p className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiHeadphones className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-3">No support tickets yet</p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => router.push('/client/support')}
                      >
                        <FiPlus className="h-4 w-4 mr-1" />
                        Create Your First Ticket
                      </Button>
                    </div>
                  )}
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

            {/* Consent Modal */}
            <Modal
              isOpen={showConsentModal}
              onClose={() => setShowConsentModal(false)}
              title="Loan Application Consent"
              size="lg"
            >
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Important: Consent Required
                      </p>
                      <p className="text-sm text-blue-700">
                        To proceed with the loan application, please review and accept all the consents below. 
                        This is required for credit assessment and loan processing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="creditScore"
                      checked={consents.creditScore}
                      onChange={() => handleConsentChange('creditScore')}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="creditScore" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 mb-1">
                        Credit Score Check Consent
                      </div>
                      <div className="text-sm text-gray-600">
                        I consent to FinBox accessing my credit score from credit bureaus (CIBIL/Experian) 
                        for loan eligibility assessment. This is a soft inquiry and will not affect my credit score.
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="bankStatement"
                      checked={consents.bankStatement}
                      onChange={() => handleConsentChange('bankStatement')}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="bankStatement" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 mb-1">
                        Bank Statement Access Consent
                      </div>
                      <div className="text-sm text-gray-600">
                        I consent to share my bank statement data through Account Aggregator framework 
                        for income verification and cash flow analysis. This helps in better loan offers.
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="dataSharing"
                      checked={consents.dataSharing}
                      onChange={() => handleConsentChange('dataSharing')}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="dataSharing" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 mb-1">
                        Data Sharing with FinBox
                      </div>
                      <div className="text-sm text-gray-600">
                        I consent to share my financial data with FinBox and their lending partners 
                        for loan processing, credit assessment, and related services.
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="termsConditions"
                      checked={consents.termsConditions}
                      onChange={() => handleConsentChange('termsConditions')}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="termsConditions" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 mb-1">
                        Terms & Conditions
                      </div>
                      <div className="text-sm text-gray-600">
                        I have read and agree to the{' '}
                        <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">
                          Terms & Conditions
                        </a>{' '}
                        for loan application and processing.
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="privacyPolicy"
                      checked={consents.privacyPolicy}
                      onChange={() => handleConsentChange('privacyPolicy')}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="privacyPolicy" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 mb-1">
                        Privacy Policy
                      </div>
                      <div className="text-sm text-gray-600">
                        I have read and agree to the{' '}
                        <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">
                          Privacy Policy
                        </a>{' '}
                        and understand how my data will be used and protected.
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowConsentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConsentSubmit}
                    disabled={!allConsentsGiven}
                    className={!allConsentsGiven ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Accept & Continue
                    <FiArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
