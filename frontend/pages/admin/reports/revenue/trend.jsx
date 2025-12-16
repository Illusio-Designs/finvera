import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function RevenueTrendReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchReport();
  }, [router.query, period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        period,
        from_date: router.query.from_date,
        to_date: router.query.to_date,
      };
      const response = await adminAPI.reports.revenue.trend(params);
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
      <ReportLayout title="Revenue Trend Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Revenue Trend Report"
      description="Revenue trends over time (monthly, quarterly, yearly)"
      dateRange={false}
    >
      {/* Period Selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-5">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trend ({period.charAt(0).toUpperCase() + period.slice(1)})
        </h2>
        {reportData?.trends && reportData.trends.length > 0 ? (
          <div className="space-y-4">
            {reportData.trends.map((trend, index) => {
              const maxRevenue = Math.max(...reportData.trends.map(t => t.revenue));
              const barWidth = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{trend.period}</div>
                      <div className="text-sm text-gray-600">{trend.tenant_count} tenants</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary-600">
                        {formatCurrency(trend.revenue)}
                      </div>
                      {trend.growth !== undefined && trend.growth !== 0 && (
                        <div className={`text-xs flex items-center mt-1 ${
                          trend.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trend.growth >= 0 ? (
                            <FiTrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <FiTrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(trend.growth)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>
    </ReportLayout>
  );
}
