import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LandingPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Finvera - Multi-tenant Accounting SaaS</title>
        <meta name="description" content="Complete accounting solution for businesses" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-indigo-600">
                Finvera
              </div>
              <div className="space-x-4">
                <a
                  href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'admin.localhost:3001' : `admin.${process.env.MAIN_DOMAIN}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-indigo-600 transition"
                >
                  Admin Login
                </a>
                <a
                  href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'client.localhost:3001' : `client.${process.env.MAIN_DOMAIN}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Client Login
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Complete Accounting Solution
              <span className="block text-indigo-600 mt-2">For Your Business</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12">
              Multi-tenant accounting SaaS with GST filing, e-invoicing, and comprehensive financial management
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a
                href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'client.localhost:3001' : `client.${process.env.MAIN_DOMAIN}`}/register`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
              >
                Get Started Free
              </a>
              <a
                href="#features"
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-indigo-600"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-indigo-600 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3">GST Filing</h3>
              <p className="text-gray-600">
                Automated GST return filing with GSTR-1 and GSTR-3B support
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-indigo-600 text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-3">E-Invoicing</h3>
              <p className="text-gray-600">
                Generate and manage e-invoices with IRN and QR code generation
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-indigo-600 text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3">Accounting</h3>
              <p className="text-gray-600">
                Complete accounting with ledgers, vouchers, and financial reports
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-indigo-600 text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-3">Reports</h3>
              <p className="text-gray-600">
                Balance sheet, P&L, trial balance, and custom reports
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-indigo-600 text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-3">Multi-tenant</h3>
              <p className="text-gray-600">
                Separate data for each client with secure isolation
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-indigo-600 text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Referral System</h3>
              <p className="text-gray-600">
                Earn commissions through our distributor and salesman network
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white mt-20 py-8">
          <div className="container mx-auto px-6 text-center text-gray-600">
            <p>&copy; 2025 Finvera. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
