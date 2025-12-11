import { useState } from 'react';
import Head from 'next/head';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const clientMenuItems = [
  {
    label: 'Dashboard',
    href: '/client/dashboard',
    icon: '📊',
  },
  {
    divider: true,
  },
  {
    label: 'Accounting',
    children: [
      { label: 'Account Groups', href: '/client/accounting/groups', icon: '📁' },
      { label: 'Ledgers', href: '/client/accounting/ledgers', icon: '📋' },
      { label: 'Vouchers', href: '/client/accounting/vouchers', icon: '🧾' },
      { label: 'Sales Invoice', href: '/client/accounting/invoices/sales/new', icon: '📄' },
      { label: 'Purchase Invoice', href: '/client/accounting/invoices/purchase/new', icon: '📥' },
      { label: 'Payments', href: '/client/accounting/payments/new', icon: '💸' },
      { label: 'Receipts', href: '/client/accounting/receipts/new', icon: '💰' },
      { label: 'Journal', href: '/client/accounting/journals/new', icon: '📝' },
      { label: 'Contra', href: '/client/accounting/contra/new', icon: '🔄' },
      { label: 'Outstanding Bills', href: '/client/accounting/bills/outstanding', icon: '📊' },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Reports',
    children: [
      { label: 'Trial Balance', href: '/client/reports/trial-balance', icon: '⚖️' },
      { label: 'Balance Sheet', href: '/client/reports/balance-sheet', icon: '📈' },
      { label: 'Profit & Loss', href: '/client/reports/profit-loss', icon: '📉' },
      { label: 'Ledger Statement', href: '/client/reports/ledger-statement', icon: '📋' },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Compliance',
    children: [
      { label: 'GSTINs', href: '/client/gst/gstins', icon: '🏛️' },
      { label: 'GST Rates', href: '/client/gst/rates', icon: '📊' },
      { label: 'GSTR-1', href: '/client/gst/returns/gstr1', icon: '📄' },
      { label: 'GSTR-3B', href: '/client/gst/returns/gstr3b', icon: '📄' },
      { label: 'TDS', href: '/client/tds', icon: '💼' },
      { label: 'E-Invoice', href: '/client/einvoice', icon: '📧' },
    ],
  },
  {
    divider: true,
  },
  {
    label: 'Profile',
    href: '/client/profile',
    icon: '👤',
  },
  {
    label: 'Settings',
    href: '/client/settings',
    icon: '⚙️',
  },
];

export default function ClientLayout({ children, title = 'Client Portal - Finvera' }) {
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
          items={clientMenuItems}
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

