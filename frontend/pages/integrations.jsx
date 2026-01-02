import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import ScrollFloat from '../components/ui/ScrollFloat';
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
        <section className="pt-40 pb-12 bg-white">
          <div className="container mx-auto px-8 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
                Integrations
              </h1>
              <p className="text-[1.2rem] text-gray-600 max-w-3xl mx-auto">
                Connect Finvera with your favorite tools and services. Seamless integrations for a complete business solution.
              </p>
            </div>
          </div>
        </section>

        {/* Integrations by Category */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-8 md:px-12 lg:px-20">
            <div className="max-w-7xl mx-auto space-y-12">
              {integrations.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.category}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                        <Icon className="text-white text-lg" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{category.category}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {category.integrations.map((integration) => (
                        <div
                          key={integration.name}
                          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-300 transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-900">{integration.name}</h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              integration.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {integration.status}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4 text-sm">{integration.description}</p>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Features</h4>
                            <ul className="space-y-1.5">
                              {integration.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                                  <FiCheck className="text-primary-600 text-xs mt-0.5 flex-shrink-0" />
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
              <ScrollFloat
                animationDuration={1}
                ease='back.inOut(2)'
                scrollStart='center bottom+=50%'
                scrollEnd='bottom bottom-=40%'
                stagger={0.03}
                containerClassName="mb-6"
                textClassName="text-3xl md:text-4xl font-extrabold text-gray-900"
              >
                Developer API
              </ScrollFloat>
              <p className="text-[1.2rem] text-gray-600 mb-8 leading-relaxed">
                Build custom integrations with our comprehensive API. Connect Finvera with your existing systems.
              </p>
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <FiSettings className="text-white text-lg" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">API Features</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  {[
                    'RESTful API',
                    'Webhook support',
                    'OAuth authentication',
                    'Rate limiting',
                    'Comprehensive documentation',
                    'SDK support',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <FiCheck className="text-primary-600 text-sm flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-normal text-sm"
                  >
                    View API Documentation
                    <FiArrowRight className="text-sm" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Request */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-8 md:px-12 lg:px-20">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="text-center mb-6">
                  <ScrollFloat
                    animationDuration={1}
                    ease='back.inOut(2)'
                    scrollStart='center bottom+=50%'
                    scrollEnd='bottom bottom-=40%'
                    stagger={0.03}
                    containerClassName="mb-4"
                    textClassName="text-3xl md:text-4xl font-extrabold text-gray-900"
                  >
                    Need a Different Integration?
                  </ScrollFloat>
                  <p className="text-gray-600 text-sm">
                    We&apos;re always adding new integrations. Let us know what you need and we&apos;ll consider it for our roadmap.
                  </p>
                </div>
                <form className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Integration Name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Tell us about the integration you need..."
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-normal text-sm"
                  >
                    Request Integration
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-primary-50">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="relative bg-white rounded-3xl p-10 md:p-16 text-center border-2 border-primary-200 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -ml-32 -mb-32"></div>
                <div className="relative z-10">
                  <ScrollFloat
                    animationDuration={1}
                    ease='back.inOut(2)'
                    scrollStart='center bottom+=50%'
                    scrollEnd='bottom bottom-=40%'
                    stagger={0.03}
                    containerClassName="mb-6"
                    textClassName="text-3xl md:text-4xl font-extrabold text-gray-900"
                  >
                    Ready to Integrate?
                  </ScrollFloat>
                  <p className="text-base text-gray-600 mb-8">
                    Start using Finvera with your favorite tools today
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/register"
                      className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition font-normal text-lg inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      Get Started Free
                      <FiArrowRight />
                    </a>
                    <Link
                      href="/contact"
                      className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition font-normal text-lg border-2 border-primary-600 shadow-lg hover:shadow-xl"
                    >
                      Contact Sales
                    </Link>
                  </div>
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

