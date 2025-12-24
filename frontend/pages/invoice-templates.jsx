import Head from 'next/head';
import Link from 'next/link';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import { 
  FiFileText, FiPrinter, FiDownload, FiCheck, FiArrowRight,
  FiSmartphone, FiMonitor, FiSettings
} from 'react-icons/fi';

export default function InvoiceTemplatesPage() {
  const templates = [
    { name: 'Modern', description: 'Clean and contemporary design perfect for tech companies', category: 'Business' },
    { name: 'Classic', description: 'Traditional format trusted by established businesses', category: 'Business' },
    { name: 'Service', description: 'Optimized for service-based businesses', category: 'Service' },
    { name: 'Compact', description: 'Space-efficient design for detailed invoices', category: 'Business' },
    { name: 'Vintage', description: 'Elegant design with classic styling', category: 'Premium' },
    { name: 'Evergreen', description: 'Timeless design that never goes out of style', category: 'Business' },
    { name: 'Legend', description: 'Premium template for high-end businesses', category: 'Premium' },
    { name: 'GenZ', description: 'Modern and vibrant design for young businesses', category: 'Modern' },
  ];

  const printSizes = [
    { name: 'A4', description: 'Standard paper size for professional invoices', icon: FiFileText },
    { name: 'A5', description: 'Compact size for quick invoices', icon: FiFileText },
    { name: '2 inches', description: 'Thermal printer format for POS systems', icon: FiPrinter },
    { name: '3 inches', description: 'Wide thermal format for detailed receipts', icon: FiPrinter },
  ];

  const customizationFeatures = [
    'Custom logo and branding',
    'Custom columns and headers',
    'Color scheme customization',
    'Font selection',
    'Footer customization',
    'Terms and conditions',
    'Payment instructions',
    'Multiple languages',
  ];

  return (
    <>
      <Head>
        <title>Invoice Templates - Finvera | Professional Invoice Designs</title>
        <meta name="description" content="Choose from professional invoice templates. Customize and download templates for your business." />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                Awesome Templates
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Tailor made, professional, and hand crafted templates for your business to stand out.
              </p>
            </div>
          </div>
        </section>

        {/* Templates Gallery */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className="group bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-primary-100 hover:border-primary-300 transform hover:-translate-y-2 cursor-pointer"
                >
                  <div className="aspect-[3/4] bg-white rounded-lg shadow-md mb-4 flex items-center justify-center border-2 border-gray-100 group-hover:border-primary-300 transition">
                    <FiFileText className="text-6xl text-primary-200 group-hover:text-primary-400 transition" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                    <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Print Size Options */}
        <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                Print Size Options
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose from multiple size options to match your printing needs
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {printSizes.map((size) => {
                const Icon = size.icon;
                return (
                  <div
                    key={size.name}
                    className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-primary-300 text-center"
                  >
                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="text-primary-600 text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{size.name}</h3>
                    <p className="text-gray-600 text-sm">{size.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Customization Features */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                  Customize Your Templates
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Make your invoices truly yours with extensive customization options
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {customizationFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl shadow-lg border border-primary-100"
                  >
                    <div className="flex items-start gap-3">
                      <FiCheck className="text-primary-600 text-xl mt-1 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-600">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Ready to Create Professional Invoices?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Start using our templates today and create invoices in 10 seconds
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-primary-50 transition font-semibold text-lg inline-flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <FiArrowRight />
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
        
        {/* Chatbot */}
        <Chatbot />
      </div>
    </>
  );
}

