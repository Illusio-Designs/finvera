import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import Card from '../../../../components/ui/Card';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { FiTrendingUp, FiTrendingDown, FiArrowRight } from 'react-icons/fi';

export default function RevenueComparisonReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [period1From, setPeriod1From] = useState('');
  const [period1To, setPeriod1To] = useState('');
  const [period2From, setPeriod2From] = useState('');
  const [period2To, setPeriod2To] = useState('');

  useEffect(() => {
    if (router.query.period1_from && router.query.period1_to && router.query.period2_from && router.query.period2_to) {
      fetchReport();
    }
  }, [router.query]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        period1_from: router.query.period1_from || period1From,
        period1_to: router.query.period1_to || period1To,
        period2_from: router.query.period2_from || period2From,
        period2_to: router.query.period2_to || period2To,
      };
      const response = await adminAPI.reports.revenue.comparison(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <ReportLayout title="Revenue Comparison Report">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Revenue Comparison Report"
      description="Compare revenue between two periods with growth analysis"
      dateRange={false}
    >
      {!reportData ? (
        <Card className="text-center">
          <p className="text-gray-600 mb-4">Please select date ranges for both periods to compare</p>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Period 1 - From"
                type="date"
                value={period1From}
                onChange={(e) => setPeriod1From(e.target.value)}
              />
              <Input
                label="Period 1 - To"
                type="date"
                value={period1To}
                onChange={(e) => setPeriod1To(e.target.value)}
              />
              <Input
                label="Period 2 - From"
                type="date"
                value={period2From}
                onChange={(e) => setPeriod2From(e.target.value)}
              />
              <Input
                label="Period 2 - To"
                type="date"
                value={period2To}
                onChange={(e) => setPeriod2To(e.target.value)}
              />
            </div>
            <Button onClick={fetchReport}>
              Generate Comparison
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-sm font-medium text-gray-600 mb-1">Period 1 Revenue</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData?.period1?.revenue || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {reportData?.period1?.from} to {reportData?.period1?.to}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {reportData?.period1?.tenant_count} tenants
              </div>
            </Card>

            <Card>
              <div className="text-sm font-medium text-gray-600 mb-1">Period 2 Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData?.period2?.revenue || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {reportData?.period2?.from} to {reportData?.period2?.to}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {reportData?.period2?.tenant_count} tenants
              </div>
            </Card>

            <Card>
              <div className="text-sm font-medium text-gray-600 mb-1">Difference</div>
              <div className={`text-2xl font-bold flex items-center ${
                reportData?.comparison?.is_growth ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData?.comparison?.is_growth ? (
                  <FiTrendingUp className="h-6 w-6 mr-2" />
                ) : (
                  <FiTrendingDown className="h-6 w-6 mr-2" />
                )}
                {formatCurrency(Math.abs(reportData?.comparison?.difference || 0))}
              </div>
              <div className={`text-sm font-semibold mt-1 ${
                reportData?.comparison?.is_growth ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData?.comparison?.growth_percentage > 0 ? '+' : ''}
                {reportData?.comparison?.growth_percentage || 0}% growth
              </div>
            </div>
          </div>

          {/* Plan-wise Comparison */}
            <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan - Comparison</h2>
            <div className="space-y-4">
              {reportData?.period1?.by_plan?.map((plan1, index) => {
                const plan2 = reportData?.period2?.by_plan?.find(p => p.plan_name === plan1.plan_name);
                const diff = plan2 ? plan2.revenue - plan1.revenue : 0;
                const growth = plan1.revenue > 0 ? ((diff / plan1.revenue) * 100).toFixed(1) : 0;
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-3">{plan1.plan_name}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Period 1</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(plan1.revenue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Period 2</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(plan2?.revenue || 0)}
                        </div>
                        {plan2 && (
                          <div className={`text-xs mt-1 flex items-center ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff >= 0 ? <FiTrendingUp className="h-3 w-3 mr-1" /> : <FiTrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(growth)}% {diff >= 0 ? 'increase' : 'decrease'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </>
      )}
    </ReportLayout>
  );
}
