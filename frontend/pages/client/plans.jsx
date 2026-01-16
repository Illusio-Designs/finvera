import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { pricingAPI } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { FiCheck, FiZap, FiBriefcase, FiAward } from 'react-icons/fi';

export default function ClientPlansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await pricingAPI.list({ 
        is_active: 'true', 
        is_visible: 'true',
        limit: 10 
      });
      if (response.data && response.data.data) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'INR') => {
    if (!price && price !== 0) return 'Custom';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('starter') || name.includes('basic')) return FiZap;
    if (name.includes('professional') || name.includes('pro') || name.includes('business')) return FiBriefcase;
    if (name.includes('enterprise') || name.includes('premium')) return FiAward;
    return FiBriefcase;
  };

  const handleSelectPlan = (planId) => {
    router.push(`/client/subscribe?plan_id=${planId}&billing_cycle=${billingCycle}`);
  };

  const renderPlanCard = (plan, isPopular = false) => {
    const Icon = getPlanIcon(plan.plan_name);
    
    // Calculate prices based on billing cycle
    let monthlyPrice = parseFloat(plan.base_price || 0);
    let yearlyPrice = plan.discounted_price ? parseFloat(plan.discounted_price * 12) : parseFloat(plan.base_price * 12);
    
    const currentPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
    const originalYearlyPrice = monthlyPrice * 12;
    const yearlySavings = originalYearlyPrice - yearlyPrice;
    const yearlySavingsPercent = plan.discounted_price ? Math.round(((originalYearlyPrice - yearlyPrice) / originalYearlyPrice) * 100) : 0;
    
    const features = plan.features && typeof plan.features === 'object' 
      ? (Array.isArray(plan.features) ? plan.features : Object.values(plan.features))
      : [];
    const billingPeriod = billingCycle === 'yearly' ? '/year' : '/month';
    const hasCustomPrice = !currentPrice && currentPrice !== 0;
    const hasDiscount = billingCycle === 'yearly' && plan.discounted_price && yearlySavings > 0;
    
    return (
      <Card
        key={plan.id}
        className={`relative p-6 ${
          isPopular
            ? 'border-2 border-primary-600 shadow-lg'
            : 'border border-gray-200'
        }`}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              MOST POPULAR
            </span>
          </div>
        )}
        
        {/* Plan Header */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 ${isPopular ? 'bg-primary-600' : 'bg-primary-50'} rounded-lg flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`${isPopular ? 'text-white' : 'text-primary-600'} text-2xl`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {plan.plan_name}
          </h3>
          {plan.description && (
            <p className="text-sm text-gray-600 mb-4">
              {plan.description}
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-6 text-center">
          {hasDiscount && (
            <div className="mb-2">
              <span className="text-base line-through text-gray-400">
                {formatPrice(originalYearlyPrice, plan.currency)}
              </span>
              <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Save {formatPrice(yearlySavings, plan.currency)} ({yearlySavingsPercent}%)
              </span>
            </div>
          )}
          <div>
            <span className="text-4xl font-bold text-gray-900">
              {formatPrice(currentPrice, plan.currency)}
            </span>
            {billingPeriod && (
              <span className="text-sm ml-2 text-gray-600">
                {billingPeriod}
              </span>
            )}
          </div>
          {billingCycle === 'yearly' && plan.discounted_price && (
            <p className="text-xs mt-1 text-gray-500">
              {formatPrice(plan.discounted_price, plan.currency)}/month billed annually
            </p>
          )}
          {plan.trial_days > 0 && (
            <p className="text-xs mt-2 text-gray-500">
              {plan.trial_days} days free trial
            </p>
          )}
        </div>

        {/* Plan Limits */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Users:</span>
              <span className="font-medium text-gray-900">
                {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoices/month:</span>
              <span className="font-medium text-gray-900">
                {plan.max_invoices_per_month === -1 ? 'Unlimited' : plan.max_invoices_per_month}
              </span>
            </div>
            {plan.max_companies > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Companies:</span>
                <span className="font-medium text-gray-900">
                  {plan.max_companies === -1 ? 'Unlimited' : plan.max_companies}
                </span>
              </div>
            )}
            {plan.max_branches > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Branches:</span>
                <span className="font-medium text-gray-900">
                  {plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}
                </span>
              </div>
            )}
            {plan.storage_limit_gb && (
              <div className="flex justify-between">
                <span className="text-gray-600">Storage:</span>
                <span className="font-medium text-gray-900">
                  {plan.storage_limit_gb === -1 ? 'Unlimited' : `${plan.storage_limit_gb} GB`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Features Included
            </h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <FiCheck className="mr-2 mt-0.5 flex-shrink-0 text-primary-600" />
                  <span>{typeof feature === 'string' ? feature : feature.name || feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={() => handleSelectPlan(plan.id)}
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
        >
          {hasCustomPrice ? 'Contact Sales' : 'Select Plan'}
        </Button>
      </Card>
    );
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Subscription Plans">
        <Toaster />
        <PageLayout
          title="Choose Your Subscription Plan"
          breadcrumbs={[
            { label: 'Dashboard', href: '/client/dashboard' },
            { label: 'Subscription Plans', href: '/client/plans' },
          ]}
        >
          <div className="space-y-6">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
              <Card className="inline-flex p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    billingCycle === 'monthly'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    billingCycle === 'yearly'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Save up to 20%
                  </span>
                </button>
              </Card>
            </div>

            {/* Plans Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => renderPlanCard(plan, plan.is_featured))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-600">No subscription plans available at the moment.</p>
                <p className="text-sm text-gray-500 mt-2">Please contact support for assistance.</p>
              </Card>
            )}

            {/* Info Section */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiCheck className="text-blue-600 text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Need Help Choosing?
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    All plans include a free trial period. You can upgrade or downgrade at any time.
                    No credit card required for trial.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/client/support')}
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
