import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { 
  FiBarChart2, FiFileText, FiDollarSign, FiTrendingUp, 
  FiBriefcase, FiTarget, FiShield, FiZap, FiSmartphone, 
  FiAward, FiCheck, FiUsers, FiDatabase, FiSettings,
  FiCloud, FiRefreshCw, FiDownload, FiPackage, FiShare2,
  FiUpload, FiLayers, FiPrinter, FiMail, FiArrowRight
} from 'react-icons/fi';

export default function FeaturesPage() {
  const [clientUrl, setClientUrl] = useState('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
      
      if (isLocalhost) {
        setClientUrl('http://client.localhost:3001');
      } else {
        // In production, always use https and detect domain from current hostname
        const mainDomain = hostname.replace(/^(www|admin|client)\./, '');
        setClientUrl(`https://client.${mainDomain}`);
      }
    }
  }, []);
  
  const getClientUrl = () => {
    return clientUrl || 'https://client.finvera.solutions';
  };
  const mainFeatures = [
    {
      icon: FiBarChart2,
      title: 'GST Filing & Reports',
      description: 'Complete GST solution with automated filing, JSON export, and comprehensive reporting. Stay compliant with ease.',
      details: [
        'Automated GSTR-1, GSTR-3B filing with validation',
        'GSTR JSON export (GSTR-1, 3B, 2A, 9)',
        'GSTR-2A import and reconciliation',
        'Tax liability and input tax credit reports',
        'Portal-ready format with auto-population'
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
      icon: FiPackage,
      title: 'Inventory Management',
      description: 'Inventory so simple, it feels like magic. Add items, track stock, and manage everything in seconds.',
      details: [
        'Stock In and Stock Out tracking',
        'Live inventory status',
        'Bulk import from Excel',
        'Multi-warehouse management',
        'Batch and expiry tracking',
        'Low stock alerts'
      ]
    },
    {
      icon: FiDollarSign,
      title: 'Payment Tracking',
      description: 'Record payments effortlessly. Track every payment, every time — without lifting a finger.',
      details: [
        'Automatic payment tracking',
        'Payment reminders',
        'Outstanding reports',
        'Payment history',
        'Multiple payment methods',
        'Bank reconciliation'
      ]
    },
    {
      icon: FiShare2,
      title: 'WhatsApp/Email Sharing',
      description: 'Share anywhere. Get paid faster. Send invoices instantly via WhatsApp, email, or SMS.',
      details: [
        'WhatsApp sharing',
        'Email delivery',
        'SMS notifications',
        'Auto-reminders',
        'Payment tracking',
        'Customer communication'
      ]
    },
    {
      icon: FiFileText,
      title: 'E-way Bills',
      description: 'Create in seconds, anywhere. Generate e-way bills instantly from your phone — AI-filled and portal-ready.',
      details: [
        'Instant e-way bill generation',
        'AI-filled transport details',
        'Portal-ready format',
        'Bulk creation',
        'Status tracking',
        'Print and download'
      ]
    },
    {
      icon: FiUpload,
      title: 'Bulk Operations',
      description: 'Bulk uploads and bulk processing with Excel import. Save time with batch operations.',
      details: [
        'Bulk invoice upload',
        'Excel import/export',
        'Bulk item import',
        'Bulk ledger import',
        'CSV support',
        'Data validation'
      ]
    },
    {
      icon: FiDatabase,
      title: 'Tally Sync',
      description: 'Import from Tally with seamless integration. Migrate your existing data effortlessly.',
      details: [
        'Import ledgers from Tally',
        'Import stock items',
        'Import vouchers',
        'Import groups',
        'Bulk import support',
        'Data mapping tools'
      ]
    },
    {
      icon: FiSettings,
      title: 'Custom Columns & Headers',
      description: 'Invoice customization options. Make your invoices truly yours with extensive customization.',
      details: [
        'Custom invoice columns',
        'Custom headers and footers',
        'Logo and branding',
        'Color scheme customization',
        'Font selection',
        'Template builder'
      ]
    },
    {
      icon: FiPrinter,
      title: 'Export Invoices',
      description: 'Multiple format support. Export invoices in various formats for your needs.',
      details: [
        'PDF export',
        'Excel export',
        'CSV export',
        'Print options (A4, A5, thermal)',
        'Email as PDF',
        'Bulk export'
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
        <section className="bg-gradient-to-br from-primary-50 to-white pt-40 pb-12">
          <div className="container mx-auto px-8 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
                Powerful Features
              </h1>
              <p className="text-[1.2rem] text-gray-600 max-w-3xl mx-auto">
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
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                Core Features
              </h2>
              <p className="text-[1.2rem] text-gray-600 max-w-3xl mx-auto">
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
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                Additional Benefits
              </h2>
              <p className="text-[1.2rem] text-gray-600 max-w-3xl mx-auto">
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

        {/* Mind-blowing Convenience Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                Mind-blowing convenience
              </h2>
              <p className="text-[1.2rem] text-gray-600 max-w-3xl mx-auto">
                Finvera is built to make your life easier. We&apos;re always doing things for you to experience ultimate convenience.
              </p>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-7xl mx-auto">
              {[
                { name: 'E-way Bills', icon: FiFileText },
                { name: 'E-invoices', icon: FiFileText },
                { name: 'Custom Columns & Headers', icon: FiSettings },
                { name: 'GST Filing & Reports', icon: FiBarChart2 },
                { name: 'Bulk Uploads', icon: FiUpload },
                { name: 'Export Invoices', icon: FiDownload },
                { name: 'Tally Sync', icon: FiDatabase },
                { name: 'Manage Batches & Expiry', icon: FiPackage },
                { name: 'Print Options', icon: FiPrinter },
                { name: 'WhatsApp Sharing', icon: FiShare2 },
                { name: 'Auto Reminders', icon: FiRefreshCw },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.name} className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-primary-100 hover:border-primary-300 text-center">
                    <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Icon className="text-white text-xl" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{feature.name}</h4>
                  </div>
                );
              })}
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
                    Ready to Get Started?
                  </h2>
                  <p className="text-[1.2rem] text-gray-600 mb-8">
                    Join thousands of businesses using Finvera to streamline their accounting
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href={getClientUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition font-normal text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center gap-2"
                    >
                      Start Free Trial
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
      </div>
    </>
  );
}
