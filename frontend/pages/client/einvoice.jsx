import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Card from '../../components/ui/Card';
import { useTable } from '../../hooks/useTable';
import { eInvoiceAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';

export default function EInvoiceList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(eInvoiceAPI.list, {});

  const columns = [
    {
      key: 'irn',
      label: 'IRN',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'voucher_number',
      label: 'Voucher No.',
      sortable: true,
    },
    {
      key: 'invoice_date',
      label: 'Invoice Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          generated: 'success',
          cancelled: 'danger',
          pending: 'warning',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'generated_at',
      label: 'Generated At',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="E-Invoices - Client Portal">
        <PageLayout
          title="E-Invoices"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'E-Invoice' },
          ]}
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
              onRowClick={(row) => router.push(`/client/einvoice/${row.id}`)}
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
