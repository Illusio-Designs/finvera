import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI } from '../../lib/api';
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
  const { user, switchCompany } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [companyStatus, setCompanyStatus] = useState(null);
  const [switching, setSwitching] = useState(false);

  // Ensure a company exists before accessing most tenant features
  useEffect(() => {
    const path = router.pathname || '';
    if (!user) return;

    // Allow these pages even without a company
    if (path.includes('/client/login') || path.includes('/client/register') || path.includes('/client/company/new')) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await companyAPI.status();
        const hasCompany = !!res?.data?.data?.has_company;
        if (!hasCompany && !cancelled) {
          router.replace('/client/company/new');
        }
      } catch (e) {
        // If unauthenticated, ProtectedRoute will handle redirect
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, router.pathname, user]);

  useEffect(() => {
    if (!user) return;
    if (!router.pathname.startsWith('/client')) return;
    let cancelled = false;
    (async () => {
      try {
        const [listRes, statusRes] = await Promise.all([companyAPI.list(), companyAPI.status()]);
        if (cancelled) return;
        setCompanies(listRes?.data?.data || []);
        setCompanyStatus(statusRes?.data?.data || null);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.pathname, user]);

  const companyActions = useMemo(() => {
    if (!user || !router.pathname.startsWith('/client')) return null;
    if (!['tenant_admin', 'user', 'accountant'].includes(user.role)) return null;
    if (!companies.length) return null;

    const canCreate =
      companyStatus && typeof companyStatus.company_count === 'number' && typeof companyStatus.max_companies === 'number'
        ? companyStatus.company_count < companyStatus.max_companies
        : true;

    return (
      <div className="flex items-center gap-2">
        <select
          value={user.company_id || ''}
          onChange={async (e) => {
            const nextCompanyId = e.target.value;
            if (!nextCompanyId || nextCompanyId === user.company_id) return;
            try {
              setSwitching(true);
              await switchCompany(nextCompanyId);
              // Refresh current page data under new company context
              router.replace(router.asPath);
            } finally {
              setSwitching(false);
            }
          }}
          disabled={switching}
          className="hidden sm:block text-sm border border-gray-300 rounded-lg bg-gray-50 px-3 py-2"
          title="Select company"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </select>

        {canCreate && (
          <button
            onClick={() => router.push('/client/company/new')}
            className="hidden sm:inline-flex items-center text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            type="button"
          >
            Create company
          </button>
        )}
      </div>
    );
  }, [companies, companyStatus, router, switchCompany, switching, user]);

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
            actions={companyActions}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
