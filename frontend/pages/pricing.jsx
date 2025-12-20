import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { pricingAPI } from '../lib/api';
import { FiCheck, FiX, FiZap, FiBriefcase, FiAward } from 'react-icons/fi';

export default function PricingPage() {
  const [protocol, setProtocol] = useState('http:');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProtocol(window.location.protocol);
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
  
  const getUrl = (link) => {
    if (link.startsWith('/')) return link;
    const domain = process.env.MAIN_DOMAIN?.includes('localhost') 
      ? link 
      : link.replace('localhost:3001', process.env.MAIN_DOMAIN);
    return `${protocol}//${domain}`;
  };

  const getClientRegisterUrl = () => {
    const domain = process.env.MAIN_DOMAIN?.includes('localhost') 
      ? 'client.localhost:3001' 
      : `client.${process.env.MAIN_DOMAIN}`;
    return `${protocol}//${domain}/register`;
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
        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Choose the perfect plan for your business. All plans include a 14-day free trial. 
                No credit card required.
              </p>
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
                  const originalPrice = plan.base_price;
                  const discountedPrice = plan.discounted_price;
                  const price = discountedPrice || originalPrice;
                  const features = plan.features && typeof plan.features === 'object' 
                    ? (Array.isArray(plan.features) ? plan.features : Object.values(plan.features))
                    : [];
                  const billingPeriod = plan.billing_cycle === 'yearly' ? '/year' : plan.billing_cycle === 'monthly' ? '/month' : '';
                  const hasCustomPrice = !price && price !== 0;
                  const hasDiscount = discountedPrice && discountedPrice < originalPrice;
                  
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
                              {formatPrice(originalPrice, plan.currency)}
                            </span>
                            <span className={`ml-2 text-xs font-semibold ${isPopular ? 'text-white' : 'text-green-600'} bg-green-100 px-2 py-1 rounded`}>
                              Save {formatPrice(originalPrice - discountedPrice, plan.currency)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`text-5xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(price, plan.currency)}
                          </span>
                          {billingPeriod && (
                            <span className={`text-xl ml-2 ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>
                              {billingPeriod}
                            </span>
                          )}
                        </div>
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
                        href={!hasCustomPrice ? getClientRegisterUrl() : '/contact'}
                        target={!hasCustomPrice ? '_blank' : undefined}
                        rel={!hasCustomPrice ? 'noopener noreferrer' : undefined}
                        className={`block w-full text-center py-4 rounded-lg font-semibold text-lg transition ${
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

        {/* FAQ Section */}
        <section className="py-24 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-12 text-center">
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
        <section className="py-24 bg-primary-600">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Still have questions?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Our team is here to help you choose the right plan for your business
              </p>
              <Link
                href="/contact"
                className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition font-semibold text-lg"
              >
                Contact Sales Team
              </Link>
            </div>
          </div>
        </section>

        <WebsiteFooter />
      </div>
    </>
  );
}
