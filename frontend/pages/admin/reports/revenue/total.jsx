import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import DataTable from '../../../../components/tables/DataTable';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

export default function TotalRevenueReport() {
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
      const response = await adminAPI.reports.revenue.total(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Plan Name', accessor: 'plan_name' },
    { header: 'Tenant Count', accessor: 'tenant_count' },
    { header: 'Revenue', accessor: 'revenue', cell: (row) => formatCurrency(row.revenue) },
    { header: 'Percentage', accessor: 'percentage', cell: (row) => `${row.percentage}%` },
  ];

  if (loading) {
    return (
      <ReportLayout title="Total Revenue Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Total Revenue Report"
      description="Complete revenue breakdown with monthly trends and plan-wise analysis"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-primary-600">
            {formatCurrency(reportData?.summary?.total_revenue || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Commissions</div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(reportData?.summary?.total_commissions || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Net Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(reportData?.summary?.net_revenue || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg Revenue/Tenant</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(reportData?.summary?.average_revenue_per_tenant || 0)}
          </div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Subscription Plan</h2>
        {reportData?.by_plan && reportData.by_plan.length > 0 ? (
          <>
            <DataTable data={reportData.by_plan} columns={columns} />
            <div className="mt-4 space-y-2">
              {reportData.by_plan.map((plan, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{plan.plan_name}</span>
                    <span className="text-sm font-semibold text-gray-600">{plan.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${plan.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Breakdown</h2>
        {reportData?.monthly_breakdown && reportData.monthly_breakdown.length > 0 ? (
          <div className="space-y-3">
            {reportData.monthly_breakdown.map((month, index) => {
              const prevMonth = reportData.monthly_breakdown[index - 1];
              const growth = prevMonth && prevMonth.revenue > 0
                ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
                : 0;
              return (
                <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{month.month}</div>
                    <div className="text-sm text-gray-600">{month.tenant_count} tenants</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(month.revenue)}</div>
                      {index > 0 && (
                        <div className={`text-xs flex items-center ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth >= 0 ? <FiTrendingUp className="h-3 w-3 mr-1" /> : <FiTrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(growth)}%
                        </div>
                      )}
                    </div>
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
