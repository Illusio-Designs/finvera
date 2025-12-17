import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import DataTable from '../../../../components/tables/DataTable';
import { useTable } from '../../../../hooks/useTable';
import { accountingAPI } from '../../../../lib/api';
import Badge from '../../../../components/ui/Badge';
import { useEffect } from 'react';

export default function AccountGroupsList() {
  const router = useRouter();

  // Account groups are system-managed; redirect users to Ledgers.
  useEffect(() => {
    router.replace('/client/accounting/ledgers');
  }, [router]);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(accountingAPI.accountGroups.list, {});

  const columns = [
    { key: 'name', label: 'Group Name', sortable: true },
    { key: 'group_code', label: 'Code', sortable: true },
    {
      key: 'parent_id',
      label: 'Parent Group',
      sortable: false,
      render: (value, row) => {
        if (row.parent && row.parent.name) {
          return `${row.parent.name} (${row.parent.group_code})`;
        }
        return 'Root';
      },
    },
    {
      key: 'nature',
      label: 'Type',
      sortable: true,
      render: (value) => {
        const natureColors = {
          asset: 'primary',
          liability: 'warning',
          income: 'success',
          expense: 'danger',
        };
        return <Badge variant={natureColors[value] || 'primary'}>{value || 'N/A'}</Badge>;
      },
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
        >
          <DataTable columns={columns} data={[]} loading={true} />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

