import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import Card from '../../../../components/ui/Card';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { FiPieChart } from 'react-icons/fi';

export default function RevenueByTypeReport() {
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
      const response = await adminAPI.reports.revenue.byType(params);
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
      <ReportLayout title="Revenue by Type Report">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Revenue by Type/Category Report"
      description="Revenue breakdown by acquisition channel, plan, and commission type"
    >
      {/* By Acquisition Category */}
      <Card>
        <div className="flex items-center mb-4">
          <FiPieChart className="mr-2 h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Revenue by Acquisition Category</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData?.by_acquisition_category && Object.entries(reportData.by_acquisition_category).map(([category, data]) => {
            const percentage = reportData.total_revenue > 0
              ? ((data.revenue / reportData.total_revenue) * 100).toFixed(1)
              : 0;
            return (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{category}</div>
                <div className="text-2xl font-bold text-primary-600">{formatCurrency(data.revenue)}</div>
                <div className="text-xs text-gray-500 mt-1">{data.tenant_count} tenants</div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* By Subscription Plan */}
      <Card title="Revenue by Subscription Plan">
        <div className="space-y-3">
          {reportData?.by_subscription_plan?.map((plan, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{plan.plan_name}</span>
                <span className="text-sm font-semibold text-gray-600">{plan.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${plan.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Revenue: {formatCurrency(plan.revenue)}</span>
                <span>{plan.tenant_count} tenants</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* By Commission Type */}
      <Card title="Commissions by Type">
        <div className="space-y-3">
          {reportData?.by_commission_type?.map((ct, index) => (
            <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <div className="font-medium text-gray-900 capitalize">{ct.commission_type || 'N/A'}</div>
                <div className="text-sm text-gray-600">{ct.count} commissions</div>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(ct.total_amount)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </ReportLayout>
  );
}
