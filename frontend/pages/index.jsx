import Layout from '../components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout title="Finvera - Modern Accounting SaaS Platform">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Modern Accounting Made Simple
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Complete accounting solution with GST compliance, invoicing, and financial reporting
            </p>
            <div className="space-x-4">
              <Link
                href="/client/login"
                className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="inline-block px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Double-Entry Bookkeeping</h3>
              <p className="text-gray-600">
                Complete accounting system with automatic ledger entries and balance calculations
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🧾</div>
              <h3 className="text-xl font-semibold mb-2">GST Compliance</h3>
              <p className="text-gray-600">
                Automatic GST calculation, GSTR returns, and e-invoice generation
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2">Financial Reports</h3>
              <p className="text-gray-600">
                Generate trial balance, balance sheet, P&L, and custom reports
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-gray-600">
                Complete data isolation and security for each organization
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with role-based access control
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Fast & Scalable</h3>
              <p className="text-gray-600">
                Built for performance with Redis caching and optimized queries
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of businesses using Finvera for their accounting needs
          </p>
          <Link
            href="/client/login"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </Layout>
  );
}

