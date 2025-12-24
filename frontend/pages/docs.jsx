import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import { FiBook, FiFileText, FiCode, FiDatabase, FiSettings, FiShield, FiSearch, FiVideo, FiCheck } from 'react-icons/fi';

export default function DocsPage() {
  const docSections = [
    {
      icon: FiFileText,
      title: 'Getting Started',
      description: 'Learn the basics of using Finvera',
      topics: ['Account Setup', 'First Steps', 'Dashboard Overview']
    },
    {
      icon: FiDatabase,
      title: 'Accounting',
      description: 'Manage your accounting and ledgers',
      topics: ['Ledgers', 'Vouchers', 'Reports']
    },
    {
      icon: FiShield,
      title: 'GST & Compliance',
      description: 'GST filing and tax compliance',
      topics: ['GSTR-1', 'GSTR-3B', 'E-Invoicing']
    },
    {
      icon: FiSettings,
      title: 'Configuration',
      description: 'Configure your account settings',
      topics: ['Company Setup', 'User Management', 'Preferences']
    },
    {
      icon: FiCode,
      title: 'API Documentation',
      description: 'Integrate Finvera with your systems',
      topics: ['Authentication', 'Endpoints', 'Webhooks']
    },
    {
      icon: FiBook,
      title: 'Best Practices',
      description: 'Tips and best practices',
      topics: ['Data Management', 'Security', 'Backup']
    }
  ];

  return (
    <>
      <Head>
        <title>Documentation - Finvera | User Guides & API Docs</title>
        <meta name="description" content="Complete documentation for Finvera accounting platform" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                Documentation
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Complete guides, tutorials, and API documentation to help you get the most out of Finvera.
              </p>
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {docSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={index} className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition border border-primary-100">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                      <Icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h3>
                    <p className="text-gray-600 mb-6">{section.description}</p>
                    <ul className="space-y-2">
                      {section.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="flex items-center text-gray-700">
                          <span className="w-2 h-2 bg-primary-600 rounded-full mr-3"></span>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-12 bg-white border-y border-gray-200">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-14 pr-5 py-4 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Video Tutorials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Video Tutorials
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Learn Finvera with step-by-step video guides
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                { title: 'Getting Started', desc: 'Learn the basics of Finvera', duration: '5 min' },
                { title: 'Creating Your First Invoice', desc: 'Step-by-step invoice creation', duration: '8 min' },
                { title: 'GST Filing Guide', desc: 'How to file GST returns', duration: '12 min' },
                { title: 'E-Invoice Generation', desc: 'Generate e-invoices with IRN', duration: '10 min' },
                { title: 'Inventory Management', desc: 'Manage your inventory efficiently', duration: '15 min' },
                { title: 'Financial Reports', desc: 'Generate and understand reports', duration: '10 min' },
              ].map((tutorial, index) => (
                <div key={index} className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition border border-primary-100 cursor-pointer">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <FiVideo className="text-4xl text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{tutorial.title}</h3>
                    <span className="text-sm text-gray-500">{tutorial.duration}</span>
                  </div>
                  <p className="text-gray-600">{tutorial.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Quick Start Guide</h2>
              <div className="bg-white p-10 rounded-2xl shadow-xl">
                <ol className="space-y-6">
                  <li className="flex items-start">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">1</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Create Your Account</h4>
                      <p className="text-gray-600">Sign up for a free account and verify your email address.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">2</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Setup Your Company</h4>
                      <p className="text-gray-600">Add your company details, GSTIN, and configure your preferences.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">3</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Add Your Data</h4>
                      <p className="text-gray-600">Start adding ledgers, creating vouchers, and managing your transactions.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">4</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Generate Reports</h4>
                      <p className="text-gray-600">Create financial reports, file GST returns, and generate e-invoices.</p>
                    </div>
                  </li>
                </ol>
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
