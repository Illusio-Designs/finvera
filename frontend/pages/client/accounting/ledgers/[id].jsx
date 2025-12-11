import { useEffect } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import ClientLayout from "../../../../components/layouts/ClientLayout";
import PageLayout from "../../../../components/layouts/PageLayout";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useApi } from "../../../../hooks/useApi";
import { accountingAPI } from "../../../../lib/api";
import { formatCurrency } from "../../../../lib/formatters";

export default function LedgerDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error, execute } = useApi(
    () => accountingAPI.ledgers.get(id),
    !!id
  );
  const { data: balanceData } = useApi(
    () => accountingAPI.ledgers.getBalance(id, {}),
    !!id
  );

  useEffect(() => {
    if (id) {
      execute();
    }
  }, [id, execute]);

  if (loading) {
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

  if (error || !data) {
    return (
      <ProtectedRoute>
        <ClientLayout>
          <div className="text-center py-12">
            <p className="text-red-600">{error || "Ledger not found"}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/client/accounting/ledgers")}
              className="mt-4"
            >
              Back to Ledgers
            </Button>
          </div>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  const ledger = data.data || data;
  const balance = balanceData?.data || balanceData || {};

  return (
    <ProtectedRoute>
      <ClientLayout title={`${ledger.ledger_name} - Client Portal`}>
        <PageLayout
          title={ledger.ledger_name}
          breadcrumbs={[
            { label: "Client", href: "/client/dashboard" },
            { label: "Ledgers", href: "/client/accounting/ledgers" },
            { label: ledger.ledger_name },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/client/accounting/ledgers/${id}/statement`)
                }
              >
                Statement
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/client/accounting/ledgers/edit/${id}`)
                }
              >
                Edit
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <div className="text-gray-500 text-sm font-medium">
                Current Balance
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(balance.current_balance || 0)}
              </div>
              <div className="mt-2">
                <Badge
                  variant={
                    balance.balance_type === "debit" ? "danger" : "success"
                  }
                >
                  {balance.balance_type || "N/A"}
                </Badge>
              </div>
            </Card>
            <Card>
              <div className="text-gray-500 text-sm font-medium">
                Opening Balance
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(ledger.opening_balance || 0)}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Ledger Information">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Ledger Code
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {ledger.ledger_code}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Account Group
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {ledger.account_group?.group_name || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Balance Type
                  </dt>
                  <dd className="mt-1">
                    <Badge
                      variant={
                        ledger.balance_type === "debit" ? "danger" : "success"
                      }
                    >
                      {ledger.balance_type || "N/A"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </Card>

            {(ledger.gstin || ledger.pan || ledger.address) && (
              <Card title="Contact Information">
                <dl className="space-y-4">
                  {ledger.gstin && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        GSTIN
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ledger.gstin}
                      </dd>
                    </div>
                  )}
                  {ledger.pan && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">PAN</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ledger.pan}
                      </dd>
                    </div>
                  )}
                  {ledger.address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Address
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ledger.address}
                        {ledger.city && `, ${ledger.city}`}
                        {ledger.state && `, ${ledger.state}`}
                        {ledger.pincode && ` - ${ledger.pincode}`}
                      </dd>
                    </div>
                  )}
                  {ledger.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Phone
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ledger.phone}
                      </dd>
                    </div>
                  )}
                  {ledger.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Email
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ledger.email}
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
