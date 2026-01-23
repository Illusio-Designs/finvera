import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { pricingAPI, subscriptionAPI } from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import { FiCheck, FiArrowLeft } from 'react-icons/fi';

export default function SubscribePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [planType, setPlanType] = useState('multi-company');
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Check if we're in local mode (development without Razorpay)
    setIsLocalMode(process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  }, []);

  const fetchPlan = useCallback(async (planId) => {
    try {
      setPlanLoading(true);
      const response = await pricingAPI.get(planId);
      if (response.data) {
        setPlan(response.data);
      } else {
        toast.error('Plan not found');
        router.push('/plans');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load plan details');
      router.push('/plans');
    } finally {
      setPlanLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const { plan_id, billing_cycle } = router.query;
    if (plan_id) {
      setBillingCycle(billing_cycle || 'monthly');
      fetchPlan(plan_id);
    } else {
      toast.error('No plan selected');
      router.push('/plans');
    }
  }, [router.query, router, fetchPlan]);

  const formatPrice = (price, currency = 'INR') => {
    if (!price && price !== 0) return 'Custom';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculatePrice = () => {
    if (!plan) return 0;
    if (billingCycle === 'yearly' && plan.discounted_price) {
      return plan.discounted_price * 12;
    } else if (billingCycle === 'yearly') {
      return plan.base_price * 12;
    }
    return plan.base_price;
  };

  const calculateSavings = () => {
    if (!plan || billingCycle !== 'yearly' || !plan.discounted_price) return null;
    const yearlyRegular = plan.base_price * 12;
    const yearlyDiscounted = plan.discounted_price * 12;
    return {
      amount: yearlyRegular - yearlyDiscounted,
      percent: Math.round(((yearlyRegular - yearlyDiscounted) / yearlyRegular) * 100),
    };
  };

  const handleSubscribe = async () => {
    if (!plan) return;

    try {
      setLoading(true);
      const response = await subscriptionAPI.create({
        plan_id: plan.id,
        billing_cycle: billingCycle,
        plan_type: planType,
        referral_code: referralCode || undefined,
      });

      if (response.data.success) {
        // Check if it's local mode (no payment required)
        if (response.data.mode === 'local') {
          toast.success(response.data.message || 'Subscription activated successfully!');
          // Redirect to company creation or dashboard
          setTimeout(() => {
            router.push('/client/companies');
          }, 1500);
          return;
        }

        // Razorpay mode
        if (response.data.subscription?.auth_link) {
          // Redirect to Razorpay payment page
          window.location.href = response.data.subscription.auth_link;
        } else if (response.data.order) {
          // Handle one-time payment with Razorpay Checkout
          const { order, key } = response.data.order;
          const options = {
            key: key,
            amount: order.amount * 100, // Convert to paise
            currency: order.currency,
            name: plan.plan_name,
            description: plan.description || `Subscription to ${plan.plan_name}`,
            order_id: order.id,
            handler: function (response) {
              toast.success('Payment successful!');
              router.push('/client/dashboard');
            },
            prefill: {
              name: user?.full_name || '',
              email: user?.email || '',
            },
            theme: {
              color: '#4F46E5',
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          toast.success('Subscription created successfully!');
          router.push('/client/dashboard');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  if (planLoading) {
    return (
      <ProtectedRoute portalType="client">
        <ClientLayout title="Subscribe">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading plan details...</p>
            </div>
          </div>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  if (!plan) {
    return null;
  }

  const price = calculatePrice();
  const savings = calculateSavings();
  const features = plan.features && typeof plan.features === 'object'
    ? (Array.isArray(plan.features) ? plan.features : (plan.features.features_list || Object.values(plan.features)))
    : [];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Subscribe">
        <Toaster />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6">
            <Link
              href="/plans"
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <FiArrowLeft className="mr-2" />
              Back to Plans
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{plan.plan_name}</h2>
              {plan.description && (
                <p className="text-gray-600 mb-6">{plan.description}</p>
              )}

              {/* Billing Cycle Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Billing Cycle
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      billingCycle === 'monthly'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      billingCycle === 'yearly'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yearly
                    {plan.discounted_price && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Save {savings?.percent || 0}%
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Plan Type Selector - Only show if plan allows branches */}
              {plan.max_branches > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Plan Type
                  </label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setPlanType('multi-company')}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition text-left ${
                        planType === 'multi-company'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">Multi-Company</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Create up to {plan.max_companies} {plan.max_companies === 1 ? 'company' : 'companies'}
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPlanType('multi-branch')}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition text-left ${
                        planType === 'multi-branch'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">Multi-Branch</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Single company with up to {plan.max_branches} {plan.max_branches === 1 ? 'branch' : 'branches'}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Price Display */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  {savings && (
                    <div className="mb-2">
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(plan.base_price * 12, plan.currency)}
                      </span>
                      <span className="ml-2 text-sm text-green-600 font-semibold">
                        Save {formatPrice(savings.amount, plan.currency)} ({savings.percent}%)
                      </span>
                    </div>
                  )}
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(price, plan.currency)}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {billingCycle === 'yearly' ? 'per year' : 'per month'}
                  </div>
                  {billingCycle === 'yearly' && plan.discounted_price && (
                    <div className="text-sm text-gray-500 mt-1">
                      {formatPrice(plan.discounted_price, plan.currency)}/month billed annually
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Limits */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan Limits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium">
                      {plan.max_users == null ? 'Unlimited' : plan.max_users}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoices/month:</span>
                    <span className="font-medium">
                      {plan.max_invoices_per_month == null ? 'Unlimited' : plan.max_invoices_per_month}
                    </span>
                  </div>
                  {planType === 'multi-company' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Companies:</span>
                      <span className="font-medium">
                        {plan.max_companies == null ? 'Unlimited' : plan.max_companies}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Branches:</span>
                      <span className="font-medium">
                        {plan.max_branches == null ? 'Unlimited' : plan.max_branches}
                      </span>
                    </div>
                  )}
                  {plan.storage_limit_gb && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">
                        {plan.storage_limit_gb == null ? 'Unlimited' : `${plan.storage_limit_gb} GB`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <FiCheck className="mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        <span>{typeof feature === 'string' ? feature : feature.name || feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Payment Summary */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Summary</h2>

              {/* Local Mode Banner */}
              {isLocalMode && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                        Development Mode
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Payment gateway is disabled. Subscription will be activated immediately without payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Enter referral code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Order Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{plan.plan_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billing Cycle:</span>
                    <span className="font-medium capitalize">{billingCycle}</span>
                  </div>
                  {savings && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">
                        -{formatPrice(savings.amount, plan.currency)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(price, plan.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscribe Button */}
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                loading={loading}
                className="w-full py-3 text-lg"
              >
                {loading 
                  ? 'Processing...' 
                  : isLocalMode 
                    ? 'Activate Subscription (Free - Dev Mode)' 
                    : `Subscribe to ${plan.plan_name}`
                }
              </Button>

              {!isLocalMode && plan.trial_days > 0 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  {plan.trial_days} days free trial • Cancel anytime
                </p>
              )}

              {isLocalMode && (
                <p className="text-center text-sm text-yellow-600 mt-4">
                  No payment required in development mode
                </p>
              )}

              <div className="mt-6 text-xs text-gray-500 text-center">
                By subscribing, you agree to our Terms of Service and Privacy Policy
              </div>
            </Card>
          </div>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}

