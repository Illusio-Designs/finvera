import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import { adminAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiTarget, FiDollarSign, FiBriefcase, FiTrendingUp,
  FiCheckCircle, FiClock, FiArrowRight
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';

export default function DistributorDashboard() {
  const [dashboardData, setDashboardData] = useState({
    targets: {
      total: 0,
      achieved: 0,
      left: 0,
      percentage: 0,
      list: [],
    },
    commissions: {
      total: 0,
      pending: 0,
      approved: 0,
      list: [],
    },
    tenants: {
      total: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.distributors.dashboard();
      const data = response.data.data || response.data;
      setDashboardData(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const commissionColumns = [
    {
      header: 'Tenant',
      accessor: 'tenant_id',
      cell: (row) => row.tenant_id?.substring(0, 8) || 'N/A',
    },
    {
      header: 'Plan',
      accessor: 'subscription_plan',
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => formatCurrency(row.amount || 0),
    },
    {
      header: 'Rate',
      accessor: 'commission_rate',
      cell: (row) => `${row.commission_rate || 0}%`,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        const status = row.status || 'pending';
        const colors = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout title="Dashboard">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Dashboard">
        <Toaster />
        <div className="space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Target</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.targets.total)}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg text-white">
                  <FiTarget className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Achieved</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.targets.achieved)}</p>
                  <p className="text-xs text-gray-500 mt-1">{dashboardData.targets.percentage}%</p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg text-white">
                  <FiCheckCircle className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Left to Achieve</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardData.targets.left)}</p>
                </div>
                <div className="bg-orange-500 p-3 rounded-lg text-white">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Commissions</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(dashboardData.commissions.total)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(dashboardData.commissions.pending)} pending
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg text-white">
                  <FiDollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Target Progress */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Progress</h2>
            <div className="space-y-4">
              {dashboardData.targets.list.length > 0 ? (
                dashboardData.targets.list.map((target) => {
                  const percentage = target.target_value > 0 
                    ? (target.achieved_value / target.target_value) * 100 
                    : 0;
                  return (
                    <div key={target.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {target.target_type === 'revenue' ? 'Revenue' : 'Subscription'} Target
                          </p>
                          <p className="text-sm text-gray-600">
                            {target.start_date && target.end_date 
                              ? `${new Date(target.start_date).toLocaleDateString()} - ${new Date(target.end_date).toLocaleDateString()}`
                              : 'No date range'}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Achieved: {formatCurrency(target.achieved_value)}</span>
                        <span>Target: {formatCurrency(target.target_value)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No active targets</p>
              )}
            </div>
          </div>

          {/* Commissions List */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Commissions</h2>
              <button
                onClick={() => router.push('/admin/commissions')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                View All <FiArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            {dashboardData.commissions.list.length > 0 ? (
              <DataTable
                data={dashboardData.commissions.list}
                columns={commissionColumns}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">No commissions yet</p>
            )}
          </div>

          {/* Tenants Summary */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Total Tenants</h2>
                <p className="text-3xl font-bold text-primary-600">{dashboardData.tenants.total}</p>
              </div>
              <button
                onClick={() => router.push('/admin/tenants')}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center"
              >
                <FiBriefcase className="mr-2 h-4 w-4" />
                View Tenants
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
