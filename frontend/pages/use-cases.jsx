import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import { 
  FiPackage, FiLayers, FiZap, FiBriefcase, FiSettings,
  FiCheck, FiArrowRight, FiTrendingUp, FiUsers, FiBarChart2
} from 'react-icons/fi';

export default function UseCasesPage() {
  const useCases = [
    {
      name: 'Retailers',
      icon: FiPackage,
      description: 'Perfect for retail businesses with point-of-sale needs',
      painPoints: [
        'Complex POS systems are expensive',
        'Inventory tracking is time-consuming',
        'GST compliance is confusing',
        'Customer management is scattered'
      ],
      features: [
        'Quick billing at point of sale',
        'Real-time inventory tracking',
        'GST-compliant invoices',
        'Customer database management',
        'Sales reports and analytics',
        'Barcode scanning support'
      ],
      benefits: [
        'Faster checkout process',
        'Reduced inventory errors',
        'Automatic GST calculations',
        'Better customer insights'
      ],
      pricing: 'Starter or Professional plan recommended'
    },
    {
      name: 'Distributors',
      icon: FiLayers,
      description: 'Built for wholesale and distribution businesses',
      painPoints: [
        'Managing multiple price lists is difficult',
        'Stock across warehouses is hard to track',
        'Bulk order processing is slow',
        'Credit management is complex'
      ],
      features: [
        'Multiple price lists (wholesale, retail, distributor)',
        'Multi-warehouse inventory management',
        'Bulk order processing',
        'Credit limit management',
        'Stock transfer between warehouses',
        'Advanced reporting'
      ],
      benefits: [
        'Efficient order processing',
        'Better stock visibility',
        'Improved credit control',
        'Accurate profit margins'
      ],
      pricing: 'Professional or Enterprise plan recommended'
    },
    {
      name: 'Startups',
      icon: FiZap,
      description: 'Simple accounting for growing businesses',
      painPoints: [
        'Accounting software is too complex',
        'Can\'t afford expensive solutions',
        'Need quick setup',
        'Want to focus on business, not accounting'
      ],
      features: [
        'Easy-to-use interface',
        'Affordable pricing',
        'Quick setup in minutes',
        'Essential accounting features',
        'GST filing support',
        'Basic reporting'
      ],
      benefits: [
        'Get started quickly',
        'Low cost of ownership',
        'No training required',
        'Focus on growth'
      ],
      pricing: 'Starter plan perfect for startups'
    },
    {
      name: 'Freelancers',
      icon: FiBriefcase,
      description: 'Professional invoicing made easy',
      painPoints: [
        'Creating invoices manually is tedious',
        'Tracking payments is difficult',
        'Tax calculations are confusing',
        'Client management is scattered'
      ],
      features: [
        'Professional invoice templates',
        'Payment tracking and reminders',
        'Tax calculation and filing',
        'Client database',
        'Expense tracking',
        'Time tracking (coming soon)'
      ],
      benefits: [
        'Professional image',
        'Faster payment collection',
        'Easy tax compliance',
        'Better client relationships'
      ],
      pricing: 'Starter plan is ideal'
    },
    {
      name: 'Service Providers',
      icon: FiSettings,
      description: 'Service billing and client management',
      painPoints: [
        'Service billing is different from product billing',
        'Recurring invoices are manual',
        'Project tracking is difficult',
        'Client communication is scattered'
      ],
      features: [
        'Service-specific templates',
        'Recurring invoice automation',
        'Project-based billing',
        'Client portal access',
        'WhatsApp and email sharing',
        'Service reports'
      ],
      benefits: [
        'Automated recurring billing',
        'Better project visibility',
        'Improved client communication',
        'Streamlined operations'
      ],
      pricing: 'Professional plan recommended'
    },
  ];

  return (
    <>
      <Head>
        <title>Use Cases - Finvera | Solutions for Every Business</title>
        <meta name="description" content="Discover how Finvera helps retailers, distributors, startups, freelancers, and service providers manage their accounting." />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white pt-40 pb-12">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Perfect for Your Business
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Quick invoicing for retailers, distributors, startups, freelancers, and service providers using Finvera invoicing app.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto space-y-24">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div
                    key={useCase.name}
                    className={`grid md:grid-cols-2 gap-12 items-center ${
                      isEven ? '' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className={isEven ? '' : 'md:order-2'}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
                          <Icon className="text-white text-2xl" />
                        </div>
                        <div>
                          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{useCase.name}</h2>
                          <p className="text-lg text-gray-600">{useCase.description}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Pain Points We Solve</h3>
                        <ul className="space-y-2">
                          {useCase.painPoints.map((point) => (
                            <li key={point} className="flex items-start gap-3 text-gray-700">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
                        <ul className="space-y-2">
                          {useCase.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-gray-700">
                              <FiCheck className="text-primary-600 text-xl mt-1 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-primary-50 p-6 rounded-xl mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Benefits</h3>
                        <ul className="space-y-2">
                          {useCase.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-3 text-gray-700">
                              <FiTrendingUp className="text-green-600 text-xl mt-1 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong className="text-gray-900">Recommended Plan:</strong> {useCase.pricing}
                        </p>
                      </div>
                    </div>

                    <div className={isEven ? '' : 'md:order-1'}>
                      <div className="bg-gradient-to-br from-primary-50 to-white p-12 rounded-2xl shadow-xl border border-primary-100">
                        <Icon className="text-8xl text-primary-300 mx-auto mb-6" />
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Started Today</h3>
                          <p className="text-gray-600 mb-6">
                            Start managing your {useCase.name.toLowerCase()} business with Finvera
                          </p>
                          <a
                            href="/register"
                            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
                          >
                            Start Free Trial
                            <FiArrowRight />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                Not Sure Which Plan Fits You?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Our team can help you choose the perfect solution for your business
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition font-semibold text-lg inline-flex items-center justify-center gap-2"
                >
                  Contact Sales
                  <FiArrowRight />
                </Link>
                <Link
                  href="/pricing"
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold text-lg"
                >
                  View Pricing
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

