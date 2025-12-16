import { useState } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiFolder, FiFileText, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiCreditCard, FiRefreshCw, FiFile, FiBarChart2,
  FiShield, FiPercent, FiFileMinus, FiMail, FiSettings, FiUser, FiGift
} from 'react-icons/fi';

const getClientMenuItems = () => [
  {
    label: 'Dashboard',
    href: '/client/dashboard',
    icon: FiHome,
  },
  {
    divider: true,
  },
  {
    label: 'Accounting',
    icon: FiFolder,
    children: [
      { label: 'Account Groups', href: '/client/accounting/groups', icon: FiFolder },
      { label: 'Ledgers', href: '/client/accounting/ledgers', icon: FiFileText },
      { label: 'Outstanding Bills', href: '/client/accounting/bills/outstanding', icon: FiBarChart2 },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Vouchers',
    icon: FiFile,
    children: [
      { label: 'All Vouchers', href: '/client/accounting/vouchers', icon: FiFile },
      { label: 'Sales Invoice', href: '/client/accounting/invoices/sales/new', icon: FiTrendingUp },
      { label: 'Purchase Invoice', href: '/client/accounting/invoices/purchase/new', icon: FiTrendingDown },
      { label: 'Payment', href: '/client/accounting/payments/new', icon: FiDollarSign },
      { label: 'Receipt', href: '/client/accounting/receipts/new', icon: FiCreditCard },
      { label: 'Journal', href: '/client/accounting/journals/new', icon: FiFileText },
      { label: 'Contra', href: '/client/accounting/contra/new', icon: FiRefreshCw },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Reports',
    icon: FiBarChart2,
    children: [
      { label: 'Trial Balance', href: '/client/reports/trial-balance', icon: FiBarChart2 },
      { label: 'Balance Sheet', href: '/client/reports/balance-sheet', icon: FiTrendingUp },
      { label: 'Profit & Loss', href: '/client/reports/profit-loss', icon: FiTrendingDown },
      { label: 'Ledger Statement', href: '/client/reports/ledger-statement', icon: FiFileText },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Compliance',
    icon: FiShield,
    children: [
      { label: 'GSTINs', href: '/client/gst/gstins', icon: FiShield },
      { label: 'GST Rates', href: '/client/gst/rates', icon: FiPercent },
      { label: 'GSTR-1', href: '/client/gst/returns/gstr1', icon: FiFileMinus },
      { label: 'GSTR-3B', href: '/client/gst/returns/gstr3b', icon: FiFileMinus },
      { label: 'TDS', href: '/client/tds', icon: FiDollarSign },
      { label: 'E-Invoice', href: '/client/einvoice', icon: FiMail },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Referral',
    href: '/client/referral',
    icon: FiGift,
  },
  {
    divider: true,
  },
  {
    label: 'Profile',
    href: '/client/profile',
    icon: FiUser,
  },
  {
    label: 'Settings',
    href: '/client/settings',
    icon: FiSettings,
  },
];

export default function ClientLayout({ children, title = 'Client Portal - Finvera' }) {
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
          items={getClientMenuItems()}
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
