import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service - Finvera</title>
        <meta name="description" content="Finvera Terms of Service - Legal terms and conditions" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
              <p className="text-lg text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="bg-white p-10 rounded-2xl shadow-xl space-y-8">
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-600 leading-relaxed">
                    By accessing and using Finvera&apos;s services, you accept and agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Finvera provides cloud-based accounting software and related services including GST filing, 
                    e-invoicing, financial reporting, and compliance management.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    To use our services, you must:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account</li>
                    <li>Be responsible for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">4. Subscription and Payment</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Subscription fees are billed in advance on a monthly or annual basis. You are responsible for 
                    all charges incurred under your account. We reserve the right to change our pricing with 30 days notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">5. User Responsibilities</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    You agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Use the service only for lawful purposes</li>
                    <li>Not interfere with or disrupt the service</li>
                    <li>Not attempt to gain unauthorized access</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
                  <p className="text-gray-600 leading-relaxed">
                    All content, features, and functionality of Finvera are owned by us and protected by copyright, 
                    trademark, and other intellectual property laws. You may not copy, modify, or distribute our 
                    software without permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Finvera shall not be liable for any indirect, incidental, special, or consequential damages 
                    arising from your use of the service. Our total liability shall not exceed the amount you 
                    paid us in the 12 months preceding the claim.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Termination</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We may terminate or suspend your account immediately, without prior notice, for conduct that 
                    we believe violates these Terms. You may cancel your subscription at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
                  <p className="text-gray-600 leading-relaxed">
                    For questions about these Terms, please contact us at legal@finvera.com
                  </p>
                </section>
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
