import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { useTable } from '../../../hooks/useTable';
import { accountingAPI } from '../../../lib/api';
import Badge from '../../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiFileText, FiArrowLeft, FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiRefreshCw } from 'react-icons/fi';

const VOUCHER_TYPES = [
  { value: 'sales_invoice', label: 'Sales Invoice', icon: FiTrendingUp, href: '/client/vouchers/sales-invoice' },
  { value: 'purchase_invoice', label: 'Purchase Invoice', icon: FiTrendingDown, href: '/client/vouchers/purchase-invoice' },
  { value: 'payment', label: 'Payment', icon: FiDollarSign, href: '/client/vouchers/payment' },
  { value: 'receipt', label: 'Receipt', icon: FiCreditCard, href: '/client/vouchers/receipt' },
  { value: 'journal', label: 'Journal', icon: FiFileText, href: '/client/vouchers/journal' },
  { value: 'contra', label: 'Contra', icon: FiRefreshCw, href: '/client/vouchers/contra' },
];

export default function VouchersList() {
  const router = useRouter();
  const { type } = router.query; // Support ?type=sales_invoice etc.

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(accountingAPI.vouchers.list, {});

  const columns = [
    { key: 'voucher_number', label: 'Voucher No.', sortable: true },
    {
      key: 'voucher_type',
      label: 'Type',
      sortable: true,
      render: (value) => {
        const typeColors = {
          sales_invoice: 'success',
          purchase_invoice: 'warning',
          payment: 'primary',
          receipt: 'success',
          journal: 'default',
          contra: 'primary',
        };
        return (
          <Badge variant={typeColors[value] || 'default'}>
            {value ? value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
          </Badge>
        );
      },
    },
    {
      key: 'voucher_date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'DD-MM-YYYY'),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          draft: 'default',
          posted: 'success',
          cancelled: 'danger',
        };
        return (
          <Badge variant={statusColors[value] || 'default'}>
            {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/client/vouchers/${row.id}`);
            }}
            className="text-primary-600 hover:text-primary-700"
            title="View Details"
          >
            <FiEye className="h-5 w-5" />
          </button>
          {row.status === 'draft' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/client/vouchers/${row.id}/edit`);
                }}
                className="text-primary-600 hover:text-primary-700"
                title="Edit"
              >
                <FiEdit className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePost(row.id);
                }}
                className="text-green-600 hover:text-green-700"
                title="Post"
              >
                <FiSave className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handlePost = async (id) => {
    if (!confirm('Are you sure you want to post this voucher? This action cannot be undone.')) return;
    try {
      await accountingAPI.vouchers.post(id);
      toast.success('Voucher posted successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post voucher');
    }
  };

  const handleCreateVoucher = (voucherType) => {
    const typeConfig = VOUCHER_TYPES.find(t => t.value === voucherType);
    if (typeConfig) {
      router.push(typeConfig.href);
    }
  };

  return (
    <ProtectedRoute>
      <ClientLayout title="Vouchers - Client Portal">
        <PageLayout
          title="Vouchers"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Show voucher type selection modal or navigate to default
                  router.push('/client/vouchers/sales-invoice');
                }}
              >
                <FiPlus className="h-4 w-4 mr-2" />
                New Voucher
              </Button>
            </div>
          }
        >
          {/* Voucher Type Quick Actions */}
          <Card title="Create Voucher" className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {VOUCHER_TYPES.map((voucherType) => {
                const Icon = voucherType.icon;
                return (
                  <Button
                    key={voucherType.value}
                    variant="outline"
                    onClick={() => handleCreateVoucher(voucherType.value)}
                    className="flex flex-col items-center justify-center gap-2 h-auto py-4"
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs">{voucherType.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Main List Table */}
          <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={tableData?.data || tableData || []}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
              onRowClick={(row) => router.push(`/client/vouchers/${row.id}`)}
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
