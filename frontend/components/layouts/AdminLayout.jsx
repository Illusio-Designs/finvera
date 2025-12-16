import { useState } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiUsers, FiBriefcase, FiTarget, FiDollarSign,
  FiCreditCard, FiGift, FiTag, FiUser, FiHeadphones, FiBarChart2,
  FiFileText, FiSearch
} from 'react-icons/fi';

const getAdminMenuItems = (userRole) => {
  // For distributor and salesman, show limited menu
  if (userRole === 'distributor' || userRole === 'salesman') {
    return [
      {
        label: 'Dashboard',
        href: userRole === 'distributor' ? '/admin/distributors/dashboard' : '/admin/salesmen/dashboard',
        icon: FiHome,
      },
      {
        label: 'Tenants',
        href: '/admin/tenants',
        icon: FiBriefcase,
      },
      {
        divider: true,
      },
      {
        label: 'Profile',
        href: '/admin/profile',
        icon: FiUser,
      },
    ];
  }

  // For finance manager, show commission and payout management
  if (userRole === 'finance_manager') {
    return [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: FiHome,
      },
      {
        divider: true,
      },
      {
        label: 'Commissions & Payouts',
        href: '/admin/commissions-payouts',
        icon: FiDollarSign,
      },
      {
        divider: true,
      },
      {
        label: 'Profile',
        href: '/admin/profile',
        icon: FiUser,
      },
    ];
  }

  // Full menu for admin and super_admin
  return [
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
      label: 'Commissions & Payouts',
      href: '/admin/commissions-payouts',
      icon: FiDollarSign,
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
      label: 'Reports',
      href: '/admin/reports',
      icon: FiBarChart2,
    },
    {
      divider: true,
    },
    {
      label: 'Pricing',
      href: '/admin/pricing',
      icon: FiTag,
    },
    {
      divider: true,
    },
    {
      label: 'Support Tickets',
      href: '/admin/support',
      icon: FiHeadphones,
    },
    {
      divider: true,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: FiUsers,
    },
    {
      divider: true,
    },
    {
      label: 'Blog',
      href: '/admin/blog',
      icon: FiFileText,
    },
    {
      label: 'SEO',
      href: '/admin/seo',
      icon: FiSearch,
    },
    {
      divider: true,
    },
    {
      label: 'Profile',
      href: '/admin/profile',
      icon: FiUser,
    },
  ];
};

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
          items={getAdminMenuItems(user?.role)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col transition-all duration-300">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            title={title}
          />
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-5 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
