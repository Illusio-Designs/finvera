import { useState } from 'react';
import Head from 'next/head';
import WebsiteHeader from '../components/layouts/WebsiteHeader';
import WebsiteFooter from '../components/layouts/WebsiteFooter';
import Chatbot from '../components/chatbot/Chatbot';
import FormPhoneInput from '../components/forms/FormPhoneInput';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCalendar, FiVideo, FiMessageCircle } from 'react-icons/fi';

export default function ContactPage() {
  const [phone, setPhone] = useState('');
  
  return (
    <>
      <Head>
        <title>Contact Us - Finvera | Get in Touch</title>
        <meta name="description" content="Contact Finvera for support, sales inquiries, or general questions" />
      </Head>

      <div className="min-h-screen bg-white">
        <WebsiteHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white pt-40 pb-12">
          <div className="container mx-auto px-8 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
                Contact Us
              </h1>
              <p className="text-[1.2rem] text-gray-600 max-w-3xl mx-auto">
                Have questions? We&apos;d love to hear from you. Get in touch with our team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <a
                  href="#request-demo"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-normal"
                >
                  <FiVideo className="text-xl" />
                  Request a Demo
                </a>
                <a
                  href="#schedule-call"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-normal border-2 border-primary-600"
                >
                  <FiCalendar className="text-xl" />
                  Schedule a Call
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8">Get in Touch</h2>
                  <p className="text-[1.2rem] text-gray-600 mb-8 leading-relaxed">
                    Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiMail className="text-primary-600 text-2xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Email</div>
                        <div className="text-gray-600 text-lg">support@finvera.com</div>
                        <div className="text-gray-600 text-lg">sales@finvera.com</div>
                        <div className="text-sm text-gray-500 mt-1">Response within 24 hours</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiPhone className="text-primary-600 text-2xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Phone</div>
                        <div className="text-gray-600 text-lg">+91 84900 9684</div>
                        <div className="text-gray-600 text-lg">Mon-Fri 9AM-6PM IST</div>
                        <div className="text-sm text-gray-500 mt-1">Available for immediate support</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiMessageCircle className="text-primary-600 text-2xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">WhatsApp</div>
                        <div className="text-gray-600 text-lg">+91 84900 9684</div>
                        <div className="text-sm text-gray-500 mt-1">Quick support via WhatsApp</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiMapPin className="text-primary-600 text-2xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Address</div>
                        <div className="text-gray-600 text-lg">212, 2nd floor, Runway Heights</div>
                        <div className="text-gray-600 text-lg">Ayodhya Chowk, Rajkot - 360001</div>
                        <div className="text-gray-600 text-lg">India</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Request Demo Form */}
                  <div id="request-demo" className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-xl border border-primary-100">
                    <div className="flex items-center gap-3 mb-6">
                      <FiVideo className="text-primary-600 text-2xl" />
                      <h3 className="text-3xl font-bold text-gray-900">Request a Demo</h3>
                    </div>
                    <form className="space-y-5">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Your Email"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Company Name"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                        />
                      </div>
                      <div>
                        <FormPhoneInput
                          name="phone"
                          value={phone}
                          onChange={(name, value) => setPhone(value)}
                          defaultCountry="IN"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition font-normal text-lg shadow-lg"
                      >
                        Request Demo
                      </button>
                    </form>
                  </div>

                  {/* Schedule Call Form */}
                  <div id="schedule-call" className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-xl border border-primary-100">
                    <div className="flex items-center gap-3 mb-6">
                      <FiCalendar className="text-primary-600 text-2xl" />
                      <h3 className="text-3xl font-bold text-gray-900">Schedule a Call</h3>
                    </div>
                    <form className="space-y-5">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Your Email"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="datetime-local"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                          required
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="What would you like to discuss?"
                          rows="3"
                          className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition font-normal text-lg shadow-lg"
                      >
                        Schedule Call
                      </button>
                    </form>
                  </div>

                  {/* Send Message Form */}
                <div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-2xl shadow-xl border border-primary-100">
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                  <form className="space-y-5">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Your Email"
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Subject"
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Your Message"
                        rows="6"
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 text-lg"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition font-normal text-lg shadow-lg flex items-center justify-center gap-2"
                    >
                      <FiSend className="text-xl" />
                      Send Message
                    </button>
                  </form>
                  </div>
                </div>
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
