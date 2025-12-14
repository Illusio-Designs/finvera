import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import DataTable from '../../../../components/tables/DataTable';

export default function SalesmanCategorizationReport() {
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
      const response = await adminAPI.reports.categorization.salesman(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ReportLayout title="Salesman Categorization Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Salesman Categorization Report"
      description="Salesmen grouped by performance tiers and revenue ranges"
    >
      {/* By Performance Tier */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Performance Tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {reportData?.by_performance_tier && Object.entries(reportData.by_performance_tier).map(([tier, data]) => (
            <div key={tier} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{tier.replace('_', ' ')}</div>
              <div className="text-2xl font-bold text-primary-600">{data.count}</div>
              <div className="text-xs text-gray-500 mt-1">{data.percentage}% of total</div>
              <div className="text-sm text-gray-600 mt-2">Revenue: {formatCurrency(data.total_revenue)}</div>
            </div>
          ))}
        </div>
        {reportData?.by_performance_tier?.top_performers?.salesmen && (
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-3">Top Performers List</h3>
            <DataTable
              data={reportData.by_performance_tier.top_performers.salesmen}
              columns={[
                { header: 'Code', accessor: 'salesman_code' },
                { header: 'Name', accessor: 'full_name' },
                { header: 'Revenue', accessor: 'revenue', cell: (row) => formatCurrency(row.revenue) },
                { header: 'Tenants', accessor: 'tenant_count' },
                { header: 'Commissions', accessor: 'commissions', cell: (row) => formatCurrency(row.commissions) },
              ]}
            />
          </div>
        )}
      </div>

      {/* By Revenue Range */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Revenue Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportData?.by_revenue_range && Object.entries(reportData.by_revenue_range).map(([range, data]) => (
            <div key={range} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">{data.label}</div>
              <div className="text-2xl font-bold text-primary-600">{data.count}</div>
              <div className="text-sm text-gray-600 mt-2">Revenue: {formatCurrency(data.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Distributor */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Distributor</h2>
        {reportData?.by_distributor && reportData.by_distributor.length > 0 ? (
          <DataTable
            data={reportData.by_distributor}
            columns={[
              { header: 'Distributor Code', accessor: 'distributor_code' },
              { header: 'Distributor Name', accessor: 'distributor_name' },
              { header: 'Salesmen Count', accessor: 'salesman_count' },
              { header: 'Total Revenue', accessor: 'total_revenue', cell: (row) => formatCurrency(row.total_revenue) },
            ]}
          />
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>
    </ReportLayout>
  );
}
