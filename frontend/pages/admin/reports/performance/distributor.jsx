import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import DataTable from '../../../../components/tables/DataTable';
import Card from '../../../../components/ui/Card';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { FiTrophy, FiTrendingUp } from 'react-icons/fi';

export default function DistributorPerformanceReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [router.query]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        from_date: router.query.from_date,
        to_date: router.query.to_date,
      };
      const response = await adminAPI.reports.performance.distributor(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Rank', accessor: 'rank', cell: (row, index) => `#${index + 1}` },
    { header: 'Distributor Code', accessor: 'distributor_code' },
    { header: 'Company Name', accessor: 'company_name' },
    { header: 'Tenants', accessor: 'tenants_acquired' },
    { header: 'Revenue', accessor: 'revenue_generated', cell: (row) => formatCurrency(row.revenue_generated) },
    { header: 'Commissions', accessor: 'commissions_earned', cell: (row) => formatCurrency(row.commissions_earned) },
    { header: 'Achievement %', accessor: 'achievement_percentage', cell: (row) => `${row.achievement_percentage}%` },
  ];

  if (loading) {
    return (
      <ReportLayout title="Distributor Performance Report">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Distributor Performance Report"
      description="Performance metrics for all distributors with rankings"
    >
      {/* Summary */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
          <div className="text-sm text-gray-600">
            Total Distributors: {reportData?.total_distributors || 0}
          </div>
        </div>
      </Card>

      {/* Top Performers */}
      {reportData?.top_performers && reportData.top_performers.length > 0 && (
        <Card>
          <div className="flex items-center mb-4">
            <FiTrophy className="mr-2 h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Top 10 Performers</h2>
          </div>
          <div className="space-y-3">
            {reportData.top_performers.slice(0, 10).map((dist, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-primary-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{dist.company_name || dist.distributor_code}</div>
                      <div className="text-sm text-gray-600">{dist.tenants_acquired} tenants</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary-600">
                      {formatCurrency(dist.revenue_generated)}
                    </div>
                    <div className="text-sm text-gray-600">{dist.achievement_percentage}% achieved</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Distributors */}
      <Card title="All Distributors">
        {reportData?.performance && reportData.performance.length > 0 ? (
          <DataTable
            data={reportData.performance}
            columns={columns}
          />
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </Card>
    </ReportLayout>
  );
}
