import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function FinancialSummaryReport() {
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
      const response = await adminAPI.reports.summary.financial(params);
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
      <ReportLayout title="Financial Summary Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Financial Summary Report"
      description="Complete financial overview with revenue, commissions, and profit"
    >
      {/* Revenue Section */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(reportData?.revenue?.total || 0)}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {reportData?.revenue?.by_plan?.map((plan, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{plan.plan_name}</div>
                  <div className="text-sm text-gray-600">{plan.tenant_count} tenants</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(plan.revenue)}</div>
                  <div className="text-xs text-gray-500">{plan.percentage}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportData?.expenses && Object.entries(reportData.expenses).map(([key, value]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Health */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData?.financial_health && Object.entries(reportData.financial_health).map(([key, value]) => {
            const isPositive = typeof value === 'number' && value >= 0;
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className={`text-2xl font-bold flex items-center ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <FiTrendingUp className="h-5 w-5 mr-2" /> : <FiTrendingDown className="h-5 w-5 mr-2" />}
                  {typeof value === 'number' ? formatCurrency(value) : `${value}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ReportLayout>
  );
}
