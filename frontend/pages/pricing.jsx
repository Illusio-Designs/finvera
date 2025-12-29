import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import { pricingAPI } from '../lib/api';
import { FiCheck, FiX, FiZap, FiBriefcase, FiAward, FiArrowRight } from 'react-icons/fi';

export default function PricingPage() {
  const [clientRegisterUrl, setClientRegisterUrl] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
      
      if (isLocalhost) {
        setClientRegisterUrl('http://client.localhost:3001/register');
      } else {
        // In production, always use https and detect domain from current hostname
        const mainDomain = hostname.replace(/^(www|admin|client)\./, '');
        setClientRegisterUrl(`https://client.${mainDomain}/register`);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch pricing plans from API
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
        // Keep empty array on error, will show fallback
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getClientRegisterUrl = () => {
    return clientRegisterUrl || 'https://client.finvera.solutions/register';
  };

  const formatPrice = (price, currency = 'INR') => {
    if (!price && price !== 0) return 'Custom';
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(price);
  };

  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('starter') || name.includes('basic')) return FiZap;
    if (name.includes('professional') || name.includes('pro') || name.includes('business')) return FiBriefcase;
    if (name.includes('enterprise') || name.includes('premium')) return FiAward;
    return FiBriefcase;
  };

  return (
    <>
      <Head>
        <title>Pricing - Finvera | Affordable Accounting Solutions</title>
        <meta name="description" content="Choose the perfect plan for your business. Transparent pricing with no hidden fees." />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white pt-40 pb-12">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-6">
                <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  ✓ Free Trial Available • No Credit Card Required
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-[1.2rem] text-gray-600 leading-relaxed mb-4">
                Choose the perfect plan for your business. All plans include a free trial. 
                <span className="block mt-2 font-semibold text-primary-700">Cancel anytime. No hidden fees.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Billing Cycle Toggle */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    billingCycle === 'yearly' ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'yearly' ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Yearly
                </span>
                {billingCycle === 'yearly' && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    Save up to 20%
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Loading pricing plans...</p>
              </div>
            ) : plans.length > 0 ? (
              <div className={`grid ${plans.length === 1 ? 'md:grid-cols-1' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8 max-w-7xl mx-auto`}>
                {plans.map((plan, index) => {
                  const Icon = getPlanIcon(plan.plan_name);
                  const isPopular = plan.is_featured;
                  
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
                    <div
                      key={plan.id || index}
                      className={`relative bg-gradient-to-br from-white to-primary-50 p-8 rounded-2xl shadow-xl border-2 transition-all transform hover:-translate-y-2 hover:shadow-2xl ${
                        isPopular
                          ? 'border-primary-600 scale-105 bg-gradient-to-br from-primary-600 to-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <span className="bg-primary-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                            Most Popular
                          </span>
                        </div>
                      )}
                      
                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <div className={`w-16 h-16 ${isPopular ? 'bg-white' : 'bg-primary-600'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                          <Icon className={`${isPopular ? 'text-primary-600' : 'text-white'} text-2xl`} />
                        </div>
                        <h3 className={`text-3xl font-extrabold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                          {plan.plan_name}
                        </h3>
                        {plan.description && (
                          <p className={`text-sm mb-4 ${isPopular ? 'text-primary-100' : 'text-gray-600'}`}>
                            {plan.description}
                          </p>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="mb-6 text-center">
                        {hasDiscount && (
                          <div className="mb-2">
                            <span className={`text-lg line-through ${isPopular ? 'text-primary-200' : 'text-gray-400'}`}>
                              {formatPrice(originalYearlyPrice, plan.currency)}
                            </span>
                            <span className={`ml-2 text-xs font-semibold ${isPopular ? 'text-white' : 'text-green-600'} bg-green-100 px-2 py-1 rounded`}>
                              Save {formatPrice(yearlySavings, plan.currency)} ({yearlySavingsPercent}%)
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`text-5xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(currentPrice, plan.currency)}
                          </span>
                          {billingPeriod && (
                            <span className={`text-xl ml-2 ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>
                              {billingPeriod}
                            </span>
                          )}
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className={`text-xs mt-1 ${isPopular ? 'text-primary-200' : 'text-gray-500'}`}>
                            {formatPrice(monthlyPrice, plan.currency)}/month billed annually
                          </p>
                        )}
                        {plan.trial_days > 0 && (
                          <p className={`text-sm mt-2 ${isPopular ? 'text-primary-100' : 'text-gray-500'}`}>
                            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                              {plan.trial_days} days free trial
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Plan Limits */}
                      <div className={`mb-6 p-4 rounded-lg ${isPopular ? 'bg-primary-800' : 'bg-gray-50'}`}>
                        <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isPopular ? 'text-primary-200' : 'text-gray-500'}`}>
                          Plan Limits
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className={`font-semibold ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>Users:</span>
                            <span className={`ml-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                              {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                            </span>
                          </div>
                          <div>
                            <span className={`font-semibold ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>Invoices:</span>
                            <span className={`ml-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                              {plan.max_invoices_per_month === -1 ? 'Unlimited' : plan.max_invoices_per_month}/mo
                            </span>
                          </div>
                          {plan.max_companies && (
                            <div>
                              <span className={`font-semibold ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>Companies:</span>
                              <span className={`ml-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                                {plan.max_companies === -1 ? 'Unlimited' : plan.max_companies}
                              </span>
                            </div>
                          )}
                          {plan.storage_limit_gb && (
                            <div>
                              <span className={`font-semibold ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>Storage:</span>
                              <span className={`ml-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                                {plan.storage_limit_gb === -1 ? 'Unlimited' : `${plan.storage_limit_gb} GB`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <div className="mb-6">
                          <h4 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isPopular ? 'text-primary-200' : 'text-gray-900'}`}>
                            Features Included
                          </h4>
                          <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {features.map((feature, featureIndex) => (
                              <li key={featureIndex} className={`flex items-start text-sm ${isPopular ? 'text-white' : 'text-gray-700'}`}>
                                <FiCheck className={`mr-2 mt-0.5 flex-shrink-0 ${isPopular ? 'text-primary-200' : 'text-green-600'}`} />
                                <span>{typeof feature === 'string' ? feature : feature.name || feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* CTA Button */}
                      <a
                        href={!hasCustomPrice ? `${getClientRegisterUrl()}?plan_id=${plan.id}&billing_cycle=${billingCycle}` : '/contact'}
                        target={!hasCustomPrice ? '_blank' : undefined}
                        rel={!hasCustomPrice ? 'noopener noreferrer' : undefined}
                        className={`block w-full text-center py-4 rounded-lg font-normal text-lg transition ${
                          isPopular
                            ? 'bg-white text-primary-600 hover:bg-gray-100'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        } shadow-lg`}
                      >
                        {!hasCustomPrice ? 'Get Started' : 'Contact Sales'}
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No pricing plans available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        </section>

        {/* Free Trial Emphasis */}
        <section className="py-12 bg-green-50 border-y border-green-200">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Free Trial Today</h3>
              <p className="text-gray-600">
                No credit card required • Full access to all features • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Can I change my plan later?
                  </h3>
                  <p className="text-gray-600">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                    and we&apos;ll prorate any charges.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Is there a setup fee?
                  </h3>
                  <p className="text-gray-600">
                    No setup fees. All plans include a 14-day free trial, so you can try everything risk-free.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-gray-600">
                    We accept all major credit cards, debit cards, UPI, and bank transfers. 
                    Enterprise customers can also pay via invoice.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Can I cancel anytime?
                  </h3>
                  <p className="text-gray-600">
                    Yes, you can cancel your subscription at any time. You&apos;ll continue to have access 
                    until the end of your billing period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-primary-50">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="relative bg-white rounded-3xl p-10 md:p-16 text-center border-2 border-primary-200 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -ml-32 -mb-32"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                    Still have questions?
                  </h2>
                  <p className="text-[1.2rem] text-gray-600 mb-8">
                    Our team is here to help you choose the right plan for your business
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition font-normal text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    Contact Sales Team
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <WebsiteFooter />
        
        {/* Chatbot */}
        <Chatbot />
      </div>
    </>
  );
}
