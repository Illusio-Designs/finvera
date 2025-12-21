import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Finvera</title>
        <meta name="description" content="Finvera Privacy Policy - How we collect, use, and protect your data" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        <section className="bg-gradient-to-br from-primary-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
              <p className="text-lg text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="bg-white p-10 rounded-2xl shadow-xl space-y-8">
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Finvera (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains 
                    how we collect, use, disclose, and safeguard your information when you use our accounting software 
                    and services.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Account information (name, email, phone number)</li>
                    <li>Company and business information</li>
                    <li>Financial and accounting data</li>
                    <li>Payment information</li>
                    <li>Usage data and analytics</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices and support messages</li>
                    <li>Respond to your comments and questions</li>
                    <li>Monitor and analyze usage patterns</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We implement appropriate technical and organizational security measures to protect your personal 
                    information against unauthorized access, alteration, disclosure, or destruction. This includes 
                    encryption, secure servers, and regular security audits.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We retain your personal information for as long as necessary to provide our services and comply 
                    with legal obligations. You can request deletion of your data at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to processing of your data</li>
                    <li>Data portability</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
                  <p className="text-gray-600 leading-relaxed">
                    If you have questions about this Privacy Policy, please contact us at privacy@finvera.com
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
