import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import DataTable from '../../../../components/tables/DataTable';

export default function TargetAchievementReport() {
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
        type: router.query.type,
        period: router.query.period,
      };
      const response = await adminAPI.reports.performance.targets(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Owner', accessor: 'owner', cell: (row) => `${row.owner?.type || 'N/A'}: ${row.owner?.name || 'N/A'}` },
    { header: 'Type', accessor: 'target_type' },
    { header: 'Period', accessor: 'target_period' },
    { header: 'Target', accessor: 'target_value', cell: (row) => formatCurrency(row.target_value) },
    { header: 'Achieved', accessor: 'achieved_value', cell: (row) => formatCurrency(row.achieved_value) },
    { header: 'Left', accessor: 'left_to_achieve', cell: (row) => formatCurrency(row.left_to_achieve) },
    { header: 'Achievement %', accessor: 'achievement_percentage', cell: (row) => `${row.achievement_percentage}%` },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        const colors = {
          exceeded: 'bg-green-100 text-green-800',
          on_track: 'bg-blue-100 text-blue-800',
          behind: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[row.status] || colors.behind}`}>
            {row.status?.toUpperCase() || 'BEHIND'}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <ReportLayout title="Target Achievement Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Target Achievement Report"
      description="Target vs achieved comparison for all active targets"
      dateRange={false}
    >
      {/* Summary */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Target Value</div>
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(reportData?.summary?.total_target_value || 0)}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Achieved</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reportData?.summary?.total_achieved_value || 0)}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Overall Achievement</div>
            <div className="text-2xl font-bold text-blue-600">
              {reportData?.summary?.overall_achievement_percentage || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Targets List */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          All Targets ({reportData?.total_targets || 0})
        </h2>
        {reportData?.targets && (Array.isArray(reportData.targets) ? reportData.targets : Object.values(reportData.targets).flat()).length > 0 ? (
          <DataTable
            data={Array.isArray(reportData.targets) ? reportData.targets : Object.values(reportData.targets).flat()}
            columns={columns}
          />
        ) : (
          <p className="text-gray-500 text-center py-4">No targets available</p>
        )}
      </div>
    </ReportLayout>
  );
}
