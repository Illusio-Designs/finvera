import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useTable } from '../../hooks/useTable';
import { tdsAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/formatters';

export default function TDSList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(tdsAPI.list, {});

  const columns = [
    {
      key: 'voucher_number',
      label: 'Voucher No.',
      sortable: true,
    },
    {
      key: 'tds_section',
      label: 'TDS Section',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
    {
      key: 'tds_rate',
      label: 'Rate',
      sortable: true,
      render: (value) => (value ? `${value}%` : 'N/A'),
    },
    {
      key: 'tds_amount',
      label: 'TDS Amount',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'payment_date',
      label: 'Payment Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="TDS Management - Client Portal">
        <PageLayout
          title="TDS Entries"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'TDS' },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/client/tds/calculate')}
              >
                Calculate TDS
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/client/tds/returns')}
              >
                Generate Return
              </Button>
            </>
          }
        >
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
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
