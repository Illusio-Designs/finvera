import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTable } from '../../hooks/useTable';
import { tdsAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/formatters';
import toast from 'react-hot-toast';
import { FiRefreshCw } from 'react-icons/fi';

export default function TDSList() {
  const router = useRouter();
  const [showReturnStatusModal, setShowReturnStatusModal] = useState(false);
  const [returnId, setReturnId] = useState('');
  const [formType, setFormType] = useState('24Q');
  const [returnStatus, setReturnStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(tdsAPI.list, {});

  const handleCheckReturnStatus = async () => {
    if (!returnId.trim()) {
      toast.error('Please enter Return ID');
      return;
    }
    try {
      setCheckingStatus(true);
      const response = await tdsAPI.getReturnStatus(returnId.trim(), formType);
      const data = response.data?.data || response.data;
      setReturnStatus(data);
      toast.success('Return status fetched successfully');
    } catch (error) {
      console.error('Return status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get return status');
      setReturnStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const columns = [
    {
      key: 'voucher_number',
      label: 'Voucher No.',
      sortable: true,
    },
    {
      key: 'tds_section',
      label: 'TDS Section',
      sortable: true,
      render: (value) => <Badge variant="primary">{value || 'N/A'}</Badge>,
    },
    {
      key: 'tds_rate',
      label: 'Rate',
      sortable: true,
      render: (value) => (value ? `${value}%` : 'N/A'),
    },
    {
      key: 'tds_amount',
      label: 'TDS Amount',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'payment_date',
      label: 'Payment Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="TDS Management - Client Portal">
        <PageLayout
          title="TDS Entries"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'TDS' },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => setShowReturnStatusModal(true)}
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Check Return Status
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/client/tds/calculate')}
              >
                Calculate TDS
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/client/tds/returns')}
              >
                Generate Return
              </Button>
            </>
          }
        >
          {/* Return Status Check Modal */}
          <Modal
            isOpen={showReturnStatusModal}
            onClose={() => {
              setShowReturnStatusModal(false);
              setReturnId('');
              setReturnStatus(null);
            }}
            title="Check TDS Return Status"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="24Q">24Q (Salary)</option>
                  <option value="26Q">26Q (Non-Salary)</option>
                  <option value="27Q">27Q (NR)</option>
                  <option value="27EQ">27EQ (TDS on Interest)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return ID
                </label>
                <div className="flex gap-2">
                  <Input
                    value={returnId}
                    onChange={(e) => setReturnId(e.target.value)}
                    placeholder="Enter Return ID"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCheckReturnStatus}
                    disabled={checkingStatus || !returnId.trim()}
                  >
                    {checkingStatus ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <FiRefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Check
                  </Button>
                </div>
              </div>
              {returnStatus && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold mb-2">Return Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>{' '}
                      <Badge variant={returnStatus.status === 'filed' ? 'success' : 'warning'}>
                        {returnStatus.status || 'N/A'}
                      </Badge>
                    </div>
                    {returnStatus.acknowledgmentNumber && (
                      <div>
                        <span className="text-gray-600">Acknowledgment Number:</span>{' '}
                        <span className="font-mono">{returnStatus.acknowledgmentNumber}</span>
                      </div>
                    )}
                    {returnStatus.filedAt && (
                      <div>
                        <span className="text-gray-600">Filed At:</span>{' '}
                        <span>{new Date(returnStatus.filedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal>

          <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={tableData?.data || tableData || []}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
