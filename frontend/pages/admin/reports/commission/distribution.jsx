import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReportLayout from '../../../../components/reports/ReportLayout';
import { adminAPI } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/formatters';
import toast from 'react-hot-toast';
import DataTable from '../../../../components/tables/DataTable';

export default function CommissionDistributionReport() {
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
      const response = await adminAPI.reports.commission.distribution(params);
      setReportData(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const distributorColumns = [
    { header: 'Distributor Code', accessor: 'distributor_code' },
    { header: 'Company Name', accessor: 'company_name' },
    { header: 'Total Commission', accessor: 'total_commission', cell: (row) => formatCurrency(row.total_commission) },
    { header: 'Pending', accessor: 'pending', cell: (row) => formatCurrency(row.pending) },
    { header: 'Approved', accessor: 'approved', cell: (row) => formatCurrency(row.approved) },
    { header: 'Count', accessor: 'commission_count' },
  ];

  const salesmanColumns = [
    { header: 'Salesman Code', accessor: 'salesman_code' },
    { header: 'Name', accessor: 'full_name' },
    { header: 'Total Commission', accessor: 'total_commission', cell: (row) => formatCurrency(row.total_commission) },
    { header: 'Pending', accessor: 'pending', cell: (row) => formatCurrency(row.pending) },
    { header: 'Approved', accessor: 'approved', cell: (row) => formatCurrency(row.approved) },
    { header: 'Count', accessor: 'commission_count' },
  ];

  if (loading) {
    return (
      <ReportLayout title="Commission Distribution Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="Commission Distribution Report"
      description="Commissions by distributor and salesman with top earners"
    >
      {/* Distributor Summary */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distributor Commissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Commissions</div>
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(reportData?.distributor_summary?.total_commissions || 0)}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Distributors</div>
            <div className="text-2xl font-bold text-blue-600">
              {reportData?.distributor_summary?.total_distributors || 0}
            </div>
          </div>
        </div>
        <h3 className="text-md font-semibold text-gray-700 mb-3">Top 10 Earners</h3>
        {reportData?.distributor_summary?.top_earners && reportData.distributor_summary.top_earners.length > 0 ? (
          <DataTable
            data={reportData.distributor_summary.top_earners}
            columns={distributorColumns}
          />
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>

      {/* Salesman Summary */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Salesman Commissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Commissions</div>
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(reportData?.salesman_summary?.total_commissions || 0)}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Salesmen</div>
            <div className="text-2xl font-bold text-green-600">
              {reportData?.salesman_summary?.total_salesmen || 0}
            </div>
          </div>
        </div>
        <h3 className="text-md font-semibold text-gray-700 mb-3">Top 10 Earners</h3>
        {reportData?.salesman_summary?.top_earners && reportData.salesman_summary.top_earners.length > 0 ? (
          <DataTable
            data={reportData.salesman_summary.top_earners}
            columns={salesmanColumns}
          />
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>
    </ReportLayout>
  );
}
