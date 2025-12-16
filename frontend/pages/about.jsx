import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import { FiTarget, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us - Finvera | Your Trustable Accounting Partner</title>
        <meta name="description" content="Learn about Finvera - your trusted accounting partner providing comprehensive accounting solutions" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                About Finvera
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your Trustable Accounting Partner. We&apos;re dedicated to providing comprehensive accounting solutions 
                that help businesses manage their finances efficiently and stay compliant.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                    Our Mission
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed mb-4">
                    At Finvera, our mission is to simplify accounting and financial management for businesses of all sizes. 
                    We believe that every business deserves access to professional-grade accounting tools that are both 
                    powerful and easy to use.
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    We&apos;re committed to helping businesses stay compliant with tax regulations, manage their finances 
                    efficiently, and make informed decisions based on accurate financial data.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-xl">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiTarget className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h3>
                        <p className="text-gray-600">To become the most trusted accounting platform in India</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiUsers className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Our Values</h3>
                        <p className="text-gray-600">Trust, reliability, and customer-first approach</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why We Started Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Why We Started
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                We recognized that many businesses struggle with complex accounting processes, GST compliance, 
                and financial reporting. Finvera was created to solve these challenges by providing an 
                all-in-one platform that simplifies accounting while ensuring compliance with Indian tax regulations.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="text-white text-2xl" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">10K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiTrendingUp className="text-white text-2xl" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">50K+</div>
                <div className="text-gray-600">Invoices Generated</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiAward className="text-white text-2xl" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiTarget className="text-white text-2xl" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </section>

        <WebsiteFooter />
      </div>
    </>
  );
}
