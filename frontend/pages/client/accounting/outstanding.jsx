import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { accountingAPI } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function OutstandingPage() {
  const router = useRouter();
  const { type } = router.query; // 'receivables' or 'payables'
  const [loading, setLoading] = useState(true);
  const [outstandingData, setOutstandingData] = useState([]);
  const [summary, setSummary] = useState({
    total_receivables: 0,
    total_payables: 0,
  });

  useEffect(() => {
    fetchOutstanding();
  }, [type]);

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      // This would call an API endpoint for outstanding amounts
      // For now, we'll use the dashboard data or create a new endpoint
      const response = await accountingAPI.dashboard();
      const data = response.data?.data || response.data || {};
      
      // Set summary
      setSummary({
        total_receivables: data.stats?.receivables || 0,
        total_payables: data.stats?.payables || 0,
      });

      // TODO: Fetch actual outstanding ledger list from API
      // For now, set empty array
      setOutstandingData([]);
    } catch (error) {
      console.error('Error fetching outstanding data:', error);
      toast.error('Failed to load outstanding data');
      setOutstandingData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Party Name',
      accessor: 'party_name',
    },
    {
      header: 'Outstanding Amount',
      accessor: 'outstanding_amount',
      cell: (value) => formatCurrency(value),
    },
    {
      header: 'Last Transaction Date',
      accessor: 'last_transaction_date',
      cell: (value) => formatDate(value),
    },
  ];

  const isReceivables = type === 'receivables' || !type;

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Outstanding">
        <Toaster />
        <PageLayout
          title={isReceivables ? 'Receivables' : 'Payables'}
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: isReceivables ? 'Receivables' : 'Payables' },
          ]}
        >
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Receivables</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                      {formatCurrency(summary.total_receivables)}
                    </p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
                    <FiTrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </Card>
              <Card className="border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Payables</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {formatCurrency(summary.total_payables)}
                    </p>
                  </div>
                  <div className="bg-red-100 text-red-600 p-3 rounded-lg">
                    <FiTrendingDown className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Outstanding List */}
            <Card className="border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isReceivables ? 'Receivables' : 'Payables'} Details
              </h2>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : outstandingData.length > 0 ? (
                <DataTable
                  data={outstandingData}
                  columns={columns}
                  searchable
                  pagination
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No outstanding {isReceivables ? 'receivables' : 'payables'} found</p>
                </div>
              )}
            </Card>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

