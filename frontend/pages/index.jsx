import { useEffect, useState } from 'react';
import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { 
  FiBarChart2, FiFileText, FiDollarSign, FiTrendingUp, 
  FiBriefcase, FiTarget, FiCheck, FiZap, FiSmartphone, 
  FiAward, FiMail, FiPhone, FiMapPin, FiArrowRight,
  FiShield, FiUsers
} from 'react-icons/fi';

export default function LandingPage() {
  const [protocol, setProtocol] = useState('http:');
  
  useEffect(() => {
    // Set protocol only on client side
    if (typeof window !== 'undefined') {
      setProtocol(window.location.protocol);
    }
  }, []);
  
  const getClientRegisterUrl = () => {
    const domain = process.env.MAIN_DOMAIN?.includes('localhost') 
      ? 'client.localhost:3001' 
      : `client.${process.env.MAIN_DOMAIN}`;
    return `${protocol}//${domain}/register`;
  };

  useEffect(() => {
    // Smooth scroll for anchor links
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href') || e.target.closest('a')?.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <>
      <Head>
        <title>Finvera - Your Trustable Accounting Partner | Complete Accounting SaaS Solution</title>
        <meta name="description" content="Complete accounting solution for businesses with GST filing, e-invoicing, and comprehensive financial management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 py-24 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-800 rounded-full blur-3xl"></div>
              </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                Complete Accounting Solution
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800 mt-2">
                  For Your Business
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Multi-tenant accounting SaaS with GST filing, e-invoicing, and comprehensive financial management. 
                <span className="block mt-2 font-medium text-primary-700">Your Trustable Accounting Partner.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href={getClientRegisterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-primary-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2"
                >
                  Get Started Free
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#features"
                  className="bg-white text-primary-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all shadow-xl border-2 border-primary-600 hover:border-primary-700"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                Powerful Features
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to manage your accounting and compliance in one place
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <div className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FiBarChart2 className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">GST Filing</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Automated GST return filing with GSTR-1 and GSTR-3B support. Stay compliant with ease and save time.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FiFileText className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">E-Invoicing</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Generate and manage e-invoices with IRN and QR code generation. Fully compliant with government regulations.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FiDollarSign className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Complete Accounting</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Full accounting with ledgers, vouchers, and financial reports. Manage all your transactions efficiently.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FiTrendingUp className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Financial Reports</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Balance sheet, P&L, trial balance, and custom reports. Get insights into your business performance.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FiBriefcase className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Multi-Tenant</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Separate data for each client with secure isolation. Perfect for accounting firms and service providers.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FiTarget className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Referral System</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Earn commissions through our distributor and salesman network. Grow your business with referrals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                Our Services
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive accounting solutions tailored for your business needs
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-primary-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FiFileText className="text-primary-600 text-xl" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Bookkeeping</h4>
                <p className="text-gray-600">Maintain accurate financial records</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-primary-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FiShield className="text-primary-600 text-xl" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Tax Compliance</h4>
                <p className="text-gray-600">Stay compliant with tax regulations</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-primary-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FiTrendingUp className="text-primary-600 text-xl" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Financial Analysis</h4>
                <p className="text-gray-600">Get insights into your business</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-primary-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FiCheck className="text-primary-600 text-xl" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Audit Support</h4>
                <p className="text-gray-600">Prepare for audits with confidence</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                  Why Choose Finvera?
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                  Trusted by businesses for reliable accounting solutions
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="flex items-start space-x-6 p-6 rounded-xl hover:bg-primary-50 transition">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiShield className="text-white text-2xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure & Reliable</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Your data is encrypted and secure. We follow industry best practices for data protection and compliance.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6 p-6 rounded-xl hover:bg-primary-50 transition">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiZap className="text-white text-2xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Fast & Efficient</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Automate repetitive tasks and save time. Focus on growing your business instead of managing paperwork.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6 p-6 rounded-xl hover:bg-primary-50 transition">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiSmartphone className="text-white text-2xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy to Use</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Intuitive interface designed for users of all technical levels. No training required.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6 p-6 rounded-xl hover:bg-primary-50 transition">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiAward className="text-white text-2xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Comprehensive</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">All-in-one solution for accounting, GST, invoicing, and reporting. Everything you need in one platform.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                How It Works
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                Get started in minutes with our simple process
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-10">
                <div className="text-center group">
                  <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <span className="text-white text-4xl font-bold">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Create your account in seconds. No credit card required for free trial.</p>
                </div>
                <div className="text-center group">
                  <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <span className="text-white text-4xl font-bold">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Setup Your Business</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Add your company details and configure your preferences in minutes.</p>
                </div>
                <div className="text-center group">
                  <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <span className="text-white text-4xl font-bold">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Managing</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Begin managing your accounts, invoices, and compliance right away.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                What Our Clients Say
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                Trusted by businesses across industries
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl border border-primary-100 shadow-lg">
                <div className="text-primary-600 text-5xl mb-6 font-serif">&quot;</div>
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                  Finvera has transformed how we manage our accounting. The GST filing feature alone saves us hours every month.
                </p>
                <div className="font-bold text-gray-900 text-lg">Rajesh Kumar</div>
                <div className="text-sm text-gray-600">CEO, Tech Solutions Pvt Ltd</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl border border-primary-100 shadow-lg">
                <div className="text-primary-600 text-5xl mb-6 font-serif">&quot;</div>
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                  The e-invoicing feature is a game-changer. We can generate compliant invoices in seconds.
                </p>
                <div className="font-bold text-gray-900 text-lg">Priya Sharma</div>
                <div className="text-sm text-gray-600">Finance Manager, Retail Corp</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl border border-primary-100 shadow-lg">
                <div className="text-primary-600 text-5xl mb-6 font-serif">&quot;</div>
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                  Excellent support and easy to use. Our accounting firm uses Finvera for all our clients.
                </p>
                <div className="font-bold text-gray-900 text-lg">Amit Patel</div>
                <div className="text-sm text-gray-600">Partner, ABC Accounting Services</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                Choose the plan that fits your business needs
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white p-10 rounded-2xl shadow-xl border-2 border-gray-200 hover:border-primary-300 transition">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Starter</h3>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">₹999</span>
                  <span className="text-gray-600 text-lg">/month</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    Basic Accounting
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    GST Filing (GSTR-1, GSTR-3B)
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    E-Invoicing
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    Basic Reports
                  </li>
                </ul>
                <a
                  href={getClientRegisterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-primary-600 text-white text-center py-4 rounded-xl hover:bg-primary-700 transition font-semibold text-lg shadow-lg"
                >
                  Get Started
                </a>
              </div>

              <div className="bg-primary-600 p-10 rounded-2xl shadow-2xl border-2 border-primary-700 transform scale-105 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-700 text-white text-sm font-bold px-4 py-2 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Professional</h3>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-white">₹2,499</span>
                  <span className="text-primary-200 text-lg">/month</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center text-white text-lg">
                    <FiCheck className="text-primary-200 mr-3 text-xl" />
                    Everything in Starter
                  </li>
                  <li className="flex items-center text-white text-lg">
                    <FiCheck className="text-primary-200 mr-3 text-xl" />
                    Advanced Reports
                  </li>
                  <li className="flex items-center text-white text-lg">
                    <FiCheck className="text-primary-200 mr-3 text-xl" />
                    Multi-user Access
                  </li>
                  <li className="flex items-center text-white text-lg">
                    <FiCheck className="text-primary-200 mr-3 text-xl" />
                    Priority Support
                  </li>
                </ul>
                <a
                  href={getClientRegisterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-primary-600 text-center py-4 rounded-xl hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
                >
                  Get Started
                </a>
              </div>

              <div className="bg-white p-10 rounded-2xl shadow-xl border-2 border-gray-200 hover:border-primary-300 transition">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Enterprise</h3>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">Custom</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    Everything in Professional
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    Custom Integrations
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    Dedicated Support
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <FiCheck className="text-primary-600 mr-3 text-xl" />
                    White-label Options
                  </li>
                </ul>
                <a
                  href="#contact"
                  className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl hover:bg-gray-800 transition font-semibold text-lg shadow-lg"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-primary-600 to-primary-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl md:text-2xl text-primary-100 mb-12">
                Join thousands of businesses using Finvera for their accounting needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={getClientRegisterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-primary-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition shadow-xl"
                >
                  Start Free Trial
                </a>
                <a
                  href="#contact"
                  className="bg-transparent text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition border-2 border-white"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                  Get in Touch
                </h2>
                <p className="text-xl md:text-2xl text-gray-600">
                  Have questions? We&apos;d love to hear from you
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiMail className="text-primary-600 text-xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Email</div>
                        <div className="text-gray-600 text-lg">support@finvera.com</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiPhone className="text-primary-600 text-xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Phone</div>
                        <div className="text-gray-600 text-lg">+91 123 456 7890</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiMapPin className="text-primary-600 text-xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Address</div>
                        <div className="text-gray-600 text-lg">123 Business Street, City, State 123456</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-xl border border-primary-100">
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                  <form className="space-y-5">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                    />
                    <textarea
                      placeholder="Your Message"
                      rows="5"
                      className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition font-semibold text-lg shadow-lg"
                    >
                      Send Message
                    </button>
                  </form>
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
