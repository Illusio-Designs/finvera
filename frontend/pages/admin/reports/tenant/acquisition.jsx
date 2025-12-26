import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { FiPieChart } from 'react-icons/fi';

export default function TenantAcquisitionReport() {
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
      const response = await adminAPI.reports.tenant.acquisition(params);
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
      <ReportLayout title="Tenant Acquisition Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Tenant Acquisition Report"
      description="Tenant acquisition breakdown by category, plan, and status"
    >
      {/* Summary */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-primary-600">{reportData?.total_tenants || 0}</div>
          <div className="text-sm text-gray-600">Total Tenants</div>
        </div>
      </div>

      {/* By Acquisition Category */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiPieChart className="mr-2 h-5 w-5 text-primary-600" />
          By Acquisition Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData?.by_acquisition_category?.map((cat, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{cat.category}</div>
              <div className="text-2xl font-bold text-primary-600">{cat.count}</div>
              <div className="text-xs text-gray-500 mt-1">{cat.percentage}%</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Subscription Plan */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Subscription Plan</h2>
        <div className="space-y-3">
          {reportData?.by_subscription_plan?.map((plan, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{plan.plan || 'N/A'}</span>
                <span className="text-sm font-semibold text-gray-600">{plan.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${plan.percentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">{plan.count} tenants</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Status */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportData?.by_status?.map((status, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{status.status}</div>
              <div className="text-2xl font-bold text-primary-600">{status.count}</div>
              <div className="text-xs text-gray-500 mt-1">{status.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Acquisition Trend</h2>
        <div className="space-y-3">
          {reportData?.monthly_breakdown?.map((month, index) => (
            <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="font-medium text-gray-900">{month.month}</div>
              <div className="text-lg font-semibold text-primary-600">{month.count} tenants</div>
            </div>
          ))}
        </div>
      </div>
    </ReportLayout>
  );
}
