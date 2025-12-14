import { useState } from 'react';
import Link from 'next/link';

export default function WebsiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Finvera" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Home
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Contact
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'admin.localhost:3001' : `admin.${process.env.MAIN_DOMAIN}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary-600 transition font-medium"
            >
              Admin Login
            </a>
            <a
              href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'client.localhost:3001' : `client.${process.env.MAIN_DOMAIN}`}`}
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
            <Link href="/pricing" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Pricing
            </Link>
            <Link href="/about" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              About
            </Link>
            <Link href="/contact" className="block text-gray-700 hover:text-primary-600 transition font-medium">
              Contact
            </Link>
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <a
                href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'admin.localhost:3001' : `admin.${process.env.MAIN_DOMAIN}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-600 hover:text-primary-600 transition font-medium"
              >
                Admin Login
              </a>
              <a
                href={`${typeof window !== 'undefined' && window.location.protocol}//${process.env.MAIN_DOMAIN?.includes('localhost') ? 'client.localhost:3001' : `client.${process.env.MAIN_DOMAIN}`}`}
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
