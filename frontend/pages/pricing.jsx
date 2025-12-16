import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { FiCheck, FiX, FiZap, FiBriefcase, FiAward } from 'react-icons/fi';

export default function PricingPage() {
  const [protocol, setProtocol] = useState('http:');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProtocol(window.location.protocol);
    }
  }, []);
  
  const getUrl = (link) => {
    if (link.startsWith('/')) return link;
    const domain = process.env.MAIN_DOMAIN?.includes('localhost') 
      ? link 
      : link.replace('localhost:3001', process.env.MAIN_DOMAIN);
    return `${protocol}//${domain}`;
  };
  const plans = [
    {
      name: 'Starter',
      icon: FiZap,
      price: '₹999',
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 100 invoices/month',
        'GST filing (GSTR-1 & GSTR-3B)',
        'Basic accounting',
        'Financial reports',
        'Email support',
        '1 user account'
      ],
      notIncluded: [
        'E-invoicing',
        'Multi-tenant',
        'API access',
        'Priority support'
      ],
      popular: false,
      cta: 'Get Started',
      ctaLink: 'client.localhost:3001'
    },
    {
      name: 'Professional',
      icon: FiBriefcase,
      price: '₹2,999',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited invoices',
        'GST filing (GSTR-1 & GSTR-3B)',
        'E-invoicing with IRN',
        'Complete accounting',
        'Advanced financial reports',
        'Multi-tenant support',
        'Up to 5 user accounts',
        'Email & phone support',
        'Data export'
      ],
      notIncluded: [
        'API access',
        'White-label',
        'Priority support'
      ],
      popular: true,
      cta: 'Start Free Trial',
      ctaLink: 'client.localhost:3001'
    },
    {
      name: 'Enterprise',
      icon: FiAward,
      price: 'Custom',
      period: '',
      description: 'For large organizations and accounting firms',
      features: [
        'Everything in Professional',
        'Unlimited users',
        'API access',
        'White-label options',
        'Custom integrations',
        'Dedicated account manager',
        'Priority support',
        'Custom training',
        'SLA guarantee',
        'On-premise deployment option'
      ],
      notIncluded: [],
      popular: false,
      cta: 'Contact Sales',
      ctaLink: '/contact'
    }
  ];

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
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={index}
                    className={`relative bg-gradient-to-br from-white to-primary-50 p-10 rounded-2xl shadow-xl border-2 transition-all transform hover:-translate-y-2 ${
                      plan.popular
                        ? 'border-primary-600 scale-105'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="text-white text-2xl" />
                      </div>
                      <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      <div className="mb-6">
                        <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                        {plan.period && (
                          <span className="text-xl text-gray-600 ml-2">{plan.period}</span>
                        )}
                      </div>
                    </div>
                    <a
                      href={getUrl(plan.ctaLink)}
                      target={plan.ctaLink.startsWith('/') ? undefined : '_blank'}
                      rel={plan.ctaLink.startsWith('/') ? undefined : 'noopener noreferrer'}
                      className={`block w-full text-center py-4 rounded-lg font-semibold text-lg transition mb-8 ${
                        plan.popular
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }`}
                    >
                      {plan.cta}
                    </a>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                          Included
                        </h4>
                        <ul className="space-y-3">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start">
                              <FiCheck className="text-green-600 mr-3 mt-1 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {plan.notIncluded.length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                            Not Included
                          </h4>
                          <ul className="space-y-3">
                            {plan.notIncluded.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start">
                                <FiX className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-gray-500 line-through">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
