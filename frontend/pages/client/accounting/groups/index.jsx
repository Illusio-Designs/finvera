import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import DataTable from '../../../../components/tables/DataTable';
import Button from '../../../../components/ui/Button';
import { useTable } from '../../../../hooks/useTable';
import { accountingAPI } from '../../../../lib/api';
import Badge from '../../../../components/ui/Badge';

export default function AccountGroupsList() {
  const router = useRouter();

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(accountingAPI.accountGroups.list, {});

  const columns = [
    { key: 'group_name', label: 'Group Name', sortable: true },
    { key: 'group_code', label: 'Code', sortable: true },
    {
      key: 'parent_group_id',
      label: 'Parent Group',
      sortable: true,
      render: (value) => value || 'Root',
    },
    {
      key: 'group_type',
      label: 'Type',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Account Groups - Client Portal">
        <PageLayout
          title="Account Groups"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Accounting', href: '/client/accounting/groups' },
            { label: 'Account Groups' },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/client/accounting/groups/tree')}
              >
                Tree View
              </Button>
              <Button onClick={() => router.push('/client/accounting/groups/new')}>
                Add Group
              </Button>
            </>
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
            onRowClick={(row) => router.push(`/client/accounting/groups/${row.id}`)}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

