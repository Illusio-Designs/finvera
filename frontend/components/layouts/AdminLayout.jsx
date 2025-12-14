import { useState } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const adminMenuItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: '📊',
  },
  {
    label: 'Tenants',
    href: '/admin/tenants',
    icon: '🏢',
  },
  {
    label: 'Distributors',
    href: '/admin/distributors',
    icon: '👥',
  },
  {
    label: 'Salesmen',
    href: '/admin/salesmen',
    icon: '👤',
  },
  {
    label: 'Targets',
    href: '/admin/targets',
    icon: '🎯',
  },
  {
    divider: true,
  },
  {
    label: 'Commissions',
    href: '/admin/commissions',
    icon: '💰',
  },
  {
    label: 'Payouts',
    href: '/admin/payouts',
    icon: '💳',
  },
  {
    label: 'Referrals',
    href: '/admin/referrals',
    icon: '🎁',
  },
  {
    divider: true,
  },
  {
    label: 'Pricing',
    href: '/admin/pricing',
    icon: '💵',
  },
];

export default function AdminLayout({ children, title = 'Admin Panel - Finvera' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          items={adminMenuItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col lg:pl-64">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            title={title}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

