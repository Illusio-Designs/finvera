import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import { FiAward, FiTrendingUp } from 'react-icons/fi';

export default function ExecutiveSummaryReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        from_date: router.query.from_date,
        to_date: router.query.to_date,
      };
      const response = await adminAPI.reports.summary.executive(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [router.query]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <ReportLayout title="Executive Summary Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Executive Summary Report"
      description="High-level overview with key metrics and top performers"
    >
      {/* Key Metrics */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData?.key_metrics && Object.entries(reportData.key_metrics).map(([key, value]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-xl font-bold text-primary-600">
                {typeof value === 'number' ? formatCurrency(value) : value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 Distributors */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiAward className="mr-2 h-5 w-5 text-yellow-500" />
            Top 10 Distributors
          </h2>
          <div className="space-y-3">
            {reportData?.top_performers?.top_10_distributors?.map((dist, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-primary-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{dist.company_name || dist.distributor_code}</div>
                    <div className="text-xs text-gray-600">{dist.tenants} tenants</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary-600">{formatCurrency(dist.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Salesmen */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiAward className="mr-2 h-5 w-5 text-yellow-500" />
            Top 10 Salesmen
          </h2>
          <div className="space-y-3">
            {reportData?.top_performers?.top_10_salesmen?.map((sales, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-primary-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{sales.full_name || sales.salesman_code}</div>
                    <div className="text-xs text-gray-600">{sales.tenants} tenants</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary-600">{formatCurrency(sales.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Acquisition Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData?.revenue_by_category && Object.entries(reportData.revenue_by_category).map(([category, revenue]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{category}</div>
              <div className="text-2xl font-bold text-primary-600">{formatCurrency(revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </ReportLayout>
  );
}
