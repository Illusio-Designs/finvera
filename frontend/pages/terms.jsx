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
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
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
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Finvera provides cloud-based accounting software and related services including GST filing, 
                    e-invoicing, financial reporting, compliance management, and loan facilitation services.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Our services include integration with third-party providers for tax compliance (Sandbox API) 
                    and loan services (FinBox), as detailed in our Privacy Policy.
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
                    <li>Provide accurate and truthful information when applying for loans or using compliance services</li>
                    <li>Obtain necessary consents before sharing third-party data (such as bank statements or credit information)</li>
                    <li>Maintain the confidentiality of your API keys and account credentials</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">5.1. Third-Party Service Providers</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Our platform integrates with third-party service providers to deliver certain features. By using 
                    our services, you acknowledge and agree to the following:
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">FinBox Integration (Loan Services)</h3>
                    <p className="text-gray-600 leading-relaxed mb-3">
                      When you use our loan application features, you agree to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-3">
                      <li>Provide consent for FinBox to access your credit score from credit bureaus (CIBIL/Experian) 
                          for loan eligibility assessment. This is a soft inquiry and will not affect your credit score.</li>
                      <li>Consent to share your bank statement data through the Account Aggregator framework for income 
                          verification and cash flow analysis, which helps in providing better loan offers.</li>
                      <li>Agree to share your financial data with FinBox and their lending partners for loan processing, 
                          credit assessment, and related services.</li>
                      <li>Understand that loan approval and terms are determined by FinBox and their lending partners, 
                          not by Finvera.</li>
                    </ul>
                    <p className="text-gray-600 leading-relaxed">
                      <strong>Provider Terms:</strong> Your use of FinBox services is also subject to FinBox&apos;s terms 
                      of service and privacy policy. Finvera acts as a facilitator and is not responsible for loan 
                      decisions, interest rates, or loan terms offered by FinBox or their lending partners.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Sandbox API Integration (Tax Compliance)</h3>
                    <p className="text-gray-600 leading-relaxed mb-3">
                      When you use our tax compliance features (E-Invoice, E-Way Bill, GST, TDS, Income Tax), you agree to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-3">
                      <li>Provide accurate invoice, GST, and tax-related information for compliance processing</li>
                      <li>Understand that compliance documents are generated using Sandbox API services</li>
                      <li>Verify the accuracy of all generated documents before filing or submission</li>
                      <li>Maintain responsibility for the correctness of all compliance filings</li>
                    </ul>
                    <p className="text-gray-600 leading-relaxed">
                      <strong>Provider Terms:</strong> Your use of Sandbox API services is subject to Sandbox&apos;s 
                      terms of service. Finvera facilitates the integration but is not responsible for errors in third-party 
                      API responses or compliance document generation.
                    </p>
                  </div>
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
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Finvera shall not be liable for any indirect, incidental, special, or consequential damages 
                    arising from your use of the service. Our total liability shall not exceed the amount you 
                    paid us in the 12 months preceding the claim.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    <strong>Third-Party Services:</strong> Finvera is not liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
                    <li>Loan decisions, interest rates, or terms offered by FinBox or their lending partners</li>
                    <li>Errors or delays in third-party API services (Sandbox, FinBox)</li>
                    <li>Compliance issues arising from incorrect data provided by you</li>
                    <li>Service interruptions or failures of third-party providers</li>
                    <li>Data breaches or security incidents at third-party service providers</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    You acknowledge that Finvera acts as a facilitator for third-party services and is not responsible 
                    for the quality, accuracy, or availability of services provided by third-party providers.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Loan Application Terms</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    When applying for loans through our platform, you agree to the following terms:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
                    <li><strong>Consent Requirements:</strong> You must provide all required consents (credit score check, 
                        bank statement access, data sharing) before your loan application can be processed.</li>
                    <li><strong>Accuracy of Information:</strong> You are responsible for providing accurate and complete 
                        information. False or misleading information may result in loan rejection or legal consequences.</li>
                    <li><strong>Loan Decisions:</strong> Loan approval, interest rates, and terms are determined solely by 
                        FinBox and their lending partners. Finvera does not guarantee loan approval or specific terms.</li>
                    <li><strong>Account Aggregator:</strong> Bank statement access through Account Aggregator is subject to 
                        RBI regulations and the terms of your bank and the Account Aggregator service provider.</li>
                    <li><strong>Credit Inquiries:</strong> You understand that credit score checks are soft inquiries that 
                        will not affect your credit score, as stated in your consent.</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    By proceeding with a loan application, you acknowledge that you have read, understood, and agree to 
                    all consent requirements as outlined in our Privacy Policy and these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Termination</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We may terminate or suspend your account immediately, without prior notice, for conduct that 
                    we believe violates these Terms. You may cancel your subscription at any time.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Upon termination, your access to third-party integrated services (FinBox, Sandbox API) will also 
                    be terminated. However, any ongoing loan applications or compliance filings may continue to be 
                    processed by the respective third-party providers according to their terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
                  <p className="text-gray-600 leading-relaxed">
                    For questions about these Terms, loan applications, or third-party service integrations, 
                    please contact us at legal@finvera.com
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
