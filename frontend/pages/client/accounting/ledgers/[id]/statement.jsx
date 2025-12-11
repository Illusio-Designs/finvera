import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import ClientLayout from '../../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../../components/layouts/PageLayout';
import Card from '../../../../../components/ui/Card';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import FormDatePicker from '../../../../../components/forms/FormDatePicker';
import Button from '../../../../../components/ui/Button';
import { useApi } from '../../../../../hooks/useApi';
import { accountingAPI } from '../../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../../../lib/dateUtils';
import DataTable from '../../../../../components/tables/DataTable';

export default function LedgerStatement() {
  const router = useRouter();
  const { id } = router.query;
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const { data: ledgerData, loading: ledgerLoading } = useApi(() => accountingAPI.ledgers.get(id), !!id);
  const { data: statementData, loading: statementLoading, execute: fetchStatement } = useApi(
    () => accountingAPI.ledgers.getBalance(id, dateRange),
    false
  );

  useEffect(() => {
    if (id && dateRange.from_date && dateRange.to_date) {
      fetchStatement();
    }
  }, [id, dateRange, fetchStatement]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  if (ledgerLoading) {
    return (
      <ProtectedRoute>
        <ClientLayout>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  const ledger = ledgerData?.data || ledgerData;
  const statement = statementData?.data || statementData || {};

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value, 'DD-MM-YYYY'),
    },
    {
      key: 'voucher_number',
      label: 'Voucher No.',
    },
    {
      key: 'particulars',
      label: 'Particulars',
    },
    {
      key: 'debit',
      label: 'Debit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatCurrency(value || 0),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title={`${ledger?.ledger_name} Statement - Client Portal`}>
        <PageLayout
          title={`${ledger?.ledger_name} - Statement`}
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Ledgers', href: '/client/accounting/ledgers' },
            { label: ledger?.ledger_name, href: `/client/accounting/ledgers/${id}` },
            { label: 'Statement' },
          ]}
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker
                name="from_date"
                label="From Date"
                value={dateRange.from_date}
                onChange={(name, value) => handleDateChange('from_date', value)}
              />
              <FormDatePicker
                name="to_date"
                label="To Date"
                value={dateRange.to_date}
                onChange={(name, value) => handleDateChange('to_date', value)}
              />
            </div>
            <div className="mt-4">
              <Button onClick={fetchStatement} loading={statementLoading}>
                Generate Statement
              </Button>
            </div>
          </Card>

          {statement.transactions && (
            <DataTable
              columns={columns}
              data={statement.transactions || []}
              loading={statementLoading}
            />
          )}

          {statement.summary && (
            <Card title="Summary" className="mt-6">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Opening Balance</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(statement.summary.opening_balance || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Debit</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(statement.summary.total_debit || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Credit</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(statement.summary.total_credit || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Closing Balance</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(statement.summary.closing_balance || 0)}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

