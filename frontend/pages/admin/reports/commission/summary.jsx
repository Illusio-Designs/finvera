import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import Card from '../../../../components/ui/Card';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

export default function CommissionSummaryReport() {
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
      const response = await adminAPI.reports.commission.summary(params);
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
      <ReportLayout title="Commission Summary Report">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Commission Summary Report"
      description="Total commissions by status, type, and monthly breakdown"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Commissions</div>
          <div className="text-2xl font-bold text-primary-600">
            {formatCurrency(reportData?.summary?.total_commissions || 0)}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(reportData?.summary?.pending_commissions || 0)}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(reportData?.summary?.approved_commissions || 0)}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-600 mb-1">Commission Ratio</div>
          <div className="text-2xl font-bold text-blue-600">
            {reportData?.summary?.commission_to_revenue_ratio || 0}%
          </div>
        </Card>
      </div>

      {/* By Type */}
      <Card title="Commissions by Type">
        <div className="space-y-3">
          {reportData?.by_type?.map((ct, index) => (
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

      {/* Monthly Breakdown */}
      <Card title="Monthly Commission Breakdown">
        <div className="space-y-3">
          {reportData?.monthly_breakdown?.map((month, index) => (
            <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="font-medium text-gray-900">{month.month}</div>
              <div className="text-lg font-semibold text-primary-600">
                {formatCurrency(month.amount)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </ReportLayout>
  );
}
