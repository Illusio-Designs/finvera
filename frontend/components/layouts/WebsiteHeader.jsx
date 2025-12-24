import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function WebsiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientUrl, setClientUrl] = useState('');
  
  useEffect(() => {
    // Set URL only on client side
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
      
      if (isLocalhost) {
        setClientUrl('http://client.localhost:3001/register');
      } else {
        // In production, always use https and detect domain from current hostname
        const mainDomain = hostname.replace(/^(www|admin|client)\./, '');
        setClientUrl(`https://client.${mainDomain}/register`);
      }
    }
  }, []);
  
  const getClientRegisterUrl = () => {
    return clientUrl || 'https://client.finvera.solutions/register';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="bg-white rounded-md px-3 py-2 flex items-center justify-center">
              <Image 
                src="/Finallogo.png" 
                alt="Finvera" 
                width={3464}
                height={889}
                className="h-10 w-auto object-contain max-w-[180px]"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Home
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Features
            </Link>
            <Link href="/invoice-templates" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Templates
            </Link>
            <Link href="/use-cases" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Use Cases
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Pricing
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-primary-600 transition font-medium flex items-center gap-1">
                Support
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link href="/help" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  Help Center
                </Link>
                <Link href="/docs" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  Documentation
                </Link>
                <Link href="/contact" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  Contact
                </Link>
              </div>
            </div>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition font-medium">
              About
            </Link>
            <Link href="/integrations" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Integrations
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={getClientRegisterUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link href="/" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Home
            </Link>
            <Link href="/features" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Features
            </Link>
            <Link href="/invoice-templates" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Templates
            </Link>
            <Link href="/use-cases" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Use Cases
            </Link>
            <Link href="/pricing" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Pricing
            </Link>
            <Link href="/integrations" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Integrations
            </Link>
            <Link href="/help" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Help Center
            </Link>
            <Link href="/docs" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Documentation
            </Link>
            <Link href="/about" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              About
            </Link>
            <Link href="/contact" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Contact
            </Link>
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <a
                href={getClientRegisterUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium text-center"
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
