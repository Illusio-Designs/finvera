import { useEffect, useState } from 'react';
import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { pricingAPI, reviewAPI } from '../lib/api';
import { 
  FiBarChart2, FiFileText, FiDollarSign, FiTrendingUp, 
  FiBriefcase, FiTarget, FiCheck, FiZap, FiSmartphone, 
  FiAward, FiMail, FiPhone, FiMapPin, FiArrowRight,
  FiShield, FiUsers, FiStar
} from 'react-icons/fi';

export default function LandingPage() {
  const [protocol, setProtocol] = useState('http:');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Set protocol only on client side
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
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewAPI.getPublic({ limit: 6, featured_only: 'false' });
      if (response.data && response.data.data) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Keep empty array on error, will show fallback
    } finally {
      setReviewsLoading(false);
    }
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
        <title>Finvera - Your Trustable Accounting Partner | Complete Accounting Software</title>
        <meta name="description" content="Complete accounting software for businesses with GST filing, e-invoicing, and comprehensive financial management" />
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
                Complete accounting software with GST filing, e-invoicing, and comprehensive financial management. 
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
                  <FiUsers className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">User Management</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Manage multiple users with role-based access control. Secure and organized user management for your team.
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
            {reviewsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className={`bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl border border-primary-100 shadow-lg ${
                      review.is_featured ? 'ring-2 ring-primary-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.is_featured && (
                        <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-primary-600 text-5xl mb-6 font-serif">&quot;</div>
                    {review.title && (
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                      {review.comment || 'Thank you for using Finvera!'}
                    </p>
                    <div className="font-bold text-gray-900 text-lg">
                      {review.reviewer_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {review.reviewer_designation && `${review.reviewer_designation}, `}
                      {review.reviewer_company || review.tenant?.company_name || ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Fallback testimonials if no reviews available */}
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
            )}
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
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Loading pricing plans...</p>
              </div>
            ) : plans.length > 0 ? (
              <div className={`grid ${plans.length === 1 ? 'md:grid-cols-1' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8 max-w-6xl mx-auto`}>
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
                      className={`relative ${
                        isPopular
                          ? 'bg-primary-600 p-8 rounded-2xl shadow-2xl border-2 border-primary-700 transform scale-105'
                          : 'bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-200 hover:border-primary-300'
                      } transition hover:shadow-2xl`}
                    >
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <span className="bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                      
                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <div className={`w-16 h-16 ${isPopular ? 'bg-white' : 'bg-primary-600'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                          <Icon className={`${isPopular ? 'text-primary-600' : 'text-white'} text-2xl`} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
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
                            <span className={`ml-2 text-sm font-semibold ${isPopular ? 'text-white' : 'text-green-600'} bg-green-100 px-2 py-1 rounded`}>
                              Save {formatPrice(originalPrice - discountedPrice, plan.currency)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(price, plan.currency)}
                          </span>
                          {billingPeriod && (
                            <span className={`text-base ml-2 ${isPopular ? 'text-primary-200' : 'text-gray-600'}`}>
                              {billingPeriod}
                            </span>
                          )}
                        </div>
                        {plan.trial_days > 0 && (
                          <p className={`text-sm mt-2 ${isPopular ? 'text-primary-100' : 'text-gray-500'}`}>
                            {plan.trial_days} days free trial
                          </p>
                        )}
                      </div>

                      {/* Plan Limits */}
                      <div className={`mb-6 p-4 rounded-lg ${isPopular ? 'bg-primary-700' : 'bg-gray-50'}`}>
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
                          <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isPopular ? 'text-primary-200' : 'text-gray-500'}`}>
                            Features Included
                          </h4>
                          <ul className="space-y-2 max-h-64 overflow-y-auto">
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
                        href={!hasCustomPrice ? getClientRegisterUrl() : '#contact'}
                        target={!hasCustomPrice ? '_blank' : undefined}
                        rel={!hasCustomPrice ? 'noopener noreferrer' : undefined}
                        className={`block w-full text-center py-3 rounded-xl hover:opacity-90 transition font-semibold text-base shadow-lg ${
                          isPopular
                            ? 'bg-white text-primary-600 hover:bg-gray-100'
                            : !hasCustomPrice
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
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
