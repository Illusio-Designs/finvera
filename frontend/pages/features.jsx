import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { 
  FiBarChart2, FiFileText, FiDollarSign, FiTrendingUp, 
  FiBriefcase, FiTarget, FiShield, FiZap, FiSmartphone, 
  FiAward, FiCheck, FiUsers, FiDatabase, FiSettings,
  FiCloud, FiRefreshCw, FiDownload
} from 'react-icons/fi';

export default function FeaturesPage() {
  const [protocol, setProtocol] = useState('http:');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProtocol(window.location.protocol);
    }
  }, []);
  
  const getClientUrl = () => {
    const domain = process.env.MAIN_DOMAIN?.includes('localhost') 
      ? 'client.localhost:3001' 
      : `client.${process.env.MAIN_DOMAIN}`;
    return `${protocol}//${domain}`;
  };
  const mainFeatures = [
    {
      icon: FiBarChart2,
      title: 'GST Filing',
      description: 'Automated GST return filing with GSTR-1 and GSTR-3B support. Stay compliant with ease and save time.',
      details: [
        'Automated GSTR-1 and GSTR-3B filing',
        'Real-time validation and error checking',
        'Auto-population from invoices',
        'E-way bill integration',
        'Compliance tracking and reminders'
      ]
    },
    {
      icon: FiFileText,
      title: 'E-Invoicing',
      description: 'Generate and manage e-invoices with IRN and QR code generation. Fully compliant with government regulations.',
      details: [
        'IRN and QR code generation',
        'Bulk invoice processing',
        'Real-time invoice validation',
        'E-invoice cancellation',
        'Integration with GST portal'
      ]
    },
    {
      icon: FiDollarSign,
      title: 'Complete Accounting',
      description: 'Full accounting with ledgers, vouchers, and financial reports. Manage all your transactions efficiently.',
      details: [
        'Chart of accounts management',
        'Multiple voucher types',
        'Bank reconciliation',
        'Journal entries',
        'Transaction history tracking'
      ]
    },
    {
      icon: FiTrendingUp,
      title: 'Financial Reports',
      description: 'Balance sheet, P&L, trial balance, and custom reports. Get insights into your business performance.',
      details: [
        'Balance Sheet & P&L Statement',
        'Trial Balance',
        'Cash Flow Statement',
        'Custom report builder',
        'Export to Excel/PDF'
      ]
    },
    {
      icon: FiUsers,
      title: 'User Management',
      description: 'Manage multiple users with role-based access control. Secure and organized user management for your team.',
      details: [
        'Role-based access control',
        'User permission management',
        'Team collaboration tools',
        'Activity tracking and audit logs',
        'Secure user authentication'
      ]
    },
    {
      icon: FiTarget,
      title: 'Referral System',
      description: 'Earn commissions through our distributor and salesman network. Grow your business with referrals.',
      details: [
        'Commission tracking',
        'Performance analytics',
        'Automated payouts',
        'Referral link generation',
        'Multi-level commission structure'
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: FiShield,
      title: 'Bank-Level Security',
      description: 'Your data is encrypted and secure with industry-standard security practices.'
    },
    {
      icon: FiCloud,
      title: 'Cloud-Based',
      description: 'Access your data from anywhere, anytime. No installation required.'
    },
    {
      icon: FiZap,
      title: 'Fast & Efficient',
      description: 'Lightning-fast performance with optimized workflows to save you time.'
    },
    {
      icon: FiSmartphone,
      title: 'Mobile Responsive',
      description: 'Fully responsive design that works seamlessly on all devices.'
    },
    {
      icon: FiRefreshCw,
      title: 'Auto Backup',
      description: 'Automatic daily backups ensure your data is always safe and recoverable.'
    },
    {
      icon: FiDownload,
      title: 'Data Export',
      description: 'Export your data in multiple formats including Excel, PDF, and CSV.'
    },
    {
      icon: FiDatabase,
      title: 'Unlimited Storage',
      description: 'Store unlimited invoices, transactions, and documents without worry.'
    },
    {
      icon: FiSettings,
      title: 'Customizable',
      description: 'Customize workflows, reports, and settings to match your business needs.'
    }
  ];

  return (
    <>
      <Head>
        <title>Features - Finvera | Complete Accounting Solution</title>
        <meta name="description" content="Discover all the powerful features of Finvera - GST filing, e-invoicing, accounting, and more" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                Powerful Features
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Everything you need to manage your accounting and compliance in one place. 
                Built for businesses of all sizes.
              </p>
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Core Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive tools designed to streamline your accounting and compliance processes
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {mainFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start text-gray-700">
                          <FiCheck className="text-primary-600 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="py-24 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Additional Benefits
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                More reasons why thousands of businesses trust Finvera
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {additionalFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-primary-300">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="text-primary-600 text-xl" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary-600">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Join thousands of businesses using Finvera to streamline their accounting
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={getClientUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition font-semibold text-lg"
                >
                  Start Free Trial
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
      </div>
    </>
  );
}
