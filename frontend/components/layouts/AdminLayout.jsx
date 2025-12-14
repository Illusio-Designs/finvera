import { useState } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiUsers, FiBriefcase, FiTarget, FiDollarSign,
  FiCreditCard, FiGift, FiTag
} from 'react-icons/fi';

const getAdminMenuItems = () => [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: FiHome,
  },
  {
    label: 'Tenants',
    href: '/admin/tenants',
    icon: FiBriefcase,
  },
  {
    label: 'Distributors',
    href: '/admin/distributors',
    icon: FiUsers,
  },
  {
    label: 'Salesmen',
    href: '/admin/salesmen',
    icon: FiUsers,
  },
  {
    label: 'Targets',
    href: '/admin/targets',
    icon: FiTarget,
  },
  {
    divider: true,
  },
  {
    label: 'Commissions',
    href: '/admin/commissions',
    icon: FiDollarSign,
  },
  {
    label: 'Payouts',
    href: '/admin/payouts',
    icon: FiCreditCard,
  },
  {
    label: 'Referrals',
    href: '/admin/referrals',
    icon: FiGift,
  },
  {
    divider: true,
  },
  {
    label: 'Pricing',
    href: '/admin/pricing',
    icon: FiTag,
  },
];

export default function AdminLayout({ children, title = 'Admin Panel - Finvera' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          items={getAdminMenuItems()}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
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
