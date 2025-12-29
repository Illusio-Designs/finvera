import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import { 
  FiLink, FiCheck, FiArrowRight, FiDatabase, FiShield,
  FiCreditCard, FiFileText, FiBarChart2, FiSettings
} from 'react-icons/fi';

export default function IntegrationsPage() {
  const integrations = [
    {
      category: 'Tax Compliance',
      icon: FiFileText,
      integrations: [
        {
          name: 'Sandbox API',
          description: 'Comprehensive tax compliance platform for E-Invoice, E-Way Bill, GST, TDS, and Income Tax',
          features: ['E-Invoice generation', 'E-Way Bill creation', 'GST filing', 'TDS management', 'Income Tax filing'],
          status: 'Active'
        },
        {
          name: 'GST Portal',
          description: 'Direct integration with GST portal for seamless return filing',
          features: ['GSTR-1 filing', 'GSTR-3B filing', 'GSTIN validation', 'Return status tracking'],
          status: 'Active'
        },
        {
          name: 'E-Invoice Portal',
          description: 'Generate IRN and QR codes for invoices',
          features: ['IRN generation', 'QR code creation', 'Invoice cancellation', 'Bulk processing'],
          status: 'Active'
        },
        {
          name: 'E-Way Bill Portal',
          description: 'Create and manage e-way bills for goods transportation',
          features: ['E-way bill generation', 'Bulk creation', 'Status tracking', 'Print/download'],
          status: 'Active'
        },
      ]
    },
    {
      category: 'Accounting Software',
      icon: FiDatabase,
      integrations: [
        {
          name: 'Tally',
          description: 'Import your existing Tally data seamlessly',
          features: ['Import ledgers', 'Import stock items', 'Import vouchers', 'Import groups', 'Bulk import'],
          status: 'Active'
        },
      ]
    },
    {
      category: 'Payment Gateways',
      icon: FiCreditCard,
      integrations: [
        {
          name: 'Razorpay',
          description: 'Accept payments online with Razorpay integration',
          features: ['Payment links', 'Invoice payments', 'Subscription billing', 'Refund management'],
          status: 'Coming Soon'
        },
        {
          name: 'PhonePe',
          description: 'Accept payments via PhonePe',
          features: ['QR code payments', 'Payment links', 'Invoice payments'],
          status: 'Coming Soon'
        },
        {
          name: 'Other Gateways',
          description: 'Support for multiple payment gateways',
          features: ['UPI payments', 'Card payments', 'Net banking', 'Wallet payments'],
          status: 'Coming Soon'
        },
      ]
    },
    {
      category: 'Financial Services',
      icon: FiBarChart2,
      integrations: [
        {
          name: 'FinBox',
          description: 'Loan services and credit score checks',
          features: ['Loan applications', 'Credit score checks', 'Bank statement analysis', 'Loan eligibility'],
          status: 'Active'
        },
      ]
    },
    {
      category: 'Banking',
      icon: FiShield,
      integrations: [
        {
          name: 'Account Aggregator',
          description: 'Secure bank statement access for financial analysis',
          features: ['Bank statement retrieval', 'Income verification', 'Cash flow analysis', 'Loan processing'],
          status: 'Active'
        },
      ]
    },
  ];

  return (
    <>
      <Head>
        <title>Integrations - Finvera | Connect with Your Favorite Tools</title>
        <meta name="description" content="Integrate Finvera with payment gateways, accounting software, tax portals, and more. Seamless connections for your business." />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white pt-40 pb-12">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Integrations
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect Finvera with your favorite tools and services. Seamless integrations for a complete business solution.
              </p>
            </div>
          </div>
        </section>

        {/* Integrations by Category */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto space-y-16">
              {integrations.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.category}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Icon className="text-white text-xl" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{category.category}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.integrations.map((integration) => (
                        <div
                          key={integration.name}
                          className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-primary-100 hover:border-primary-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{integration.name}</h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              integration.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {integration.status}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4 text-sm">{integration.description}</p>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
                            <ul className="space-y-1">
                              {integration.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                                  <FiCheck className="text-primary-600 text-sm mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* API Documentation */}
        <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                Developer API
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Build custom integrations with our comprehensive API. Connect Finvera with your existing systems.
              </p>
              <div className="bg-white p-10 rounded-2xl shadow-xl border border-primary-100">
                <FiSettings className="text-6xl text-primary-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">API Features</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  {[
                    'RESTful API',
                    'Webhook support',
                    'OAuth authentication',
                    'Rate limiting',
                    'Comprehensive documentation',
                    'SDK support',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <FiCheck className="text-primary-600 text-xl flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
                  >
                    View API Documentation
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Request */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-xl border border-primary-100">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
                  Need a Different Integration?
                </h2>
                <p className="text-gray-600 mb-8 text-center">
                  We&apos;re always adding new integrations. Let us know what you need and we&apos;ll consider it for our roadmap.
                </p>
                <form className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Integration Name"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Tell us about the integration you need..."
                      rows="4"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition font-semibold text-lg shadow-lg"
                  >
                    Request Integration
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                Ready to Integrate?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Start using Finvera with your favorite tools today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition font-semibold text-lg inline-flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <FiArrowRight />
                </a>
                <Link
                  href="/contact"
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold text-lg"
                >
                  Contact Sales
                </Link>
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

