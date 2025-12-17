import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Button from '../../../../components/ui/Button';
import { useEffect } from 'react';

export default function NewAccountGroup() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/client/accounting/ledgers/new');
  }, [router]);

  return (
    <ProtectedRoute>
      <ClientLayout title="Create Account Group - Client Portal">
        <PageLayout
          title="Account Groups"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Account Groups', href: '/client/accounting/groups' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl space-y-4">
            <p className="text-sm text-gray-600">
              Account groups are system-managed and cannot be created from the client portal. Please select an
              account group while creating a ledger.
            </p>
            <Button onClick={() => router.replace('/client/accounting/ledgers/new')}>Create Ledger</Button>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

