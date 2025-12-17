import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import ClientLayout from '../../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../../components/layouts/PageLayout';
import Button from '../../../../../components/ui/Button';

export default function EditAccountGroup() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/client/accounting/groups');
  }, [router]);

  return (
    <ProtectedRoute>
      <ClientLayout title="Edit Account Group - Client Portal">
        <PageLayout
          title="Account Groups"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Account Groups', href: '/client/accounting/groups' },
            { label: 'Edit' },
          ]}
        >
          <div className="max-w-2xl">
            <p className="text-sm text-gray-600">
              Account groups are system-managed and cannot be edited from the client portal.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.replace('/client/accounting/groups')}>
                Back to Account Groups
              </Button>
            </div>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

