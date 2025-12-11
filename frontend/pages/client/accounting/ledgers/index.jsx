import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import DataTable from '../../../../components/tables/DataTable';
import Button from '../../../../components/ui/Button';
import { useTable } from '../../../../hooks/useTable';
import { accountingAPI } from '../../../../lib/api';
import Badge from '../../../../components/ui/Badge';
import { formatCurrency } from '../../../../lib/formatters';

export default function LedgersList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(accountingAPI.ledgers.list, {});

  const columns = [
    { key: 'ledger_name', label: 'Ledger Name', sortable: true },
    { key: 'ledger_code', label: 'Code', sortable: true },
    {
      key: 'account_group_id',
      label: 'Account Group',
      sortable: true,
      render: (value, row) => row.account_group?.group_name || 'N/A',
    },
    {
      key: 'opening_balance',
      label: 'Opening Balance',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance_type',
      label: 'Balance Type',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'debit' ? 'danger' : 'success'}>
          {value || 'N/A'}
        </Badge>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Ledgers - Client Portal">
        <PageLayout
          title="Ledgers"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Accounting', href: '/client/accounting/ledgers' },
            { label: 'Ledgers' },
          ]}
          actions={
            <Button onClick={() => router.push('/client/accounting/ledgers/new')}>
              Add Ledger
            </Button>
          }
        >
          <DataTable
            columns={columns}
            data={tableData?.data || tableData || []}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            sortField={sort.field}
            sortOrder={sort.order}
            onRowClick={(row) => router.push(`/client/accounting/ledgers/${row.id}`)}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

