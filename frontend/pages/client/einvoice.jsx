import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTable } from '../../hooks/useTable';
import { eInvoiceAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiEye } from 'react-icons/fi';

export default function EInvoiceList() {
  const router = useRouter();
  const [showIRNStatusModal, setShowIRNStatusModal] = useState(false);
  const [irnToCheck, setIrnToCheck] = useState('');
  const [irnStatus, setIrnStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(eInvoiceAPI.list, {});

  const handleCheckIRNStatus = async () => {
    if (!irnToCheck.trim()) {
      toast.error('Please enter IRN');
      return;
    }
    try {
      setCheckingStatus(true);
      const response = await eInvoiceAPI.getIRNStatus(irnToCheck.trim());
      const data = response.data?.data || response.data;
      setIrnStatus(data);
      toast.success('IRN status fetched successfully');
    } catch (error) {
      console.error('IRN status error:', error);
      toast.error(error.response?.data?.message || 'Failed to get IRN status');
      setIrnStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const columns = [
    {
      key: 'irn',
      label: 'IRN',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'voucher_number',
      label: 'Voucher No.',
      sortable: true,
    },
    {
      key: 'invoice_date',
      label: 'Invoice Date',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          generated: 'success',
          cancelled: 'danger',
          pending: 'warning',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'generated_at',
      label: 'Generated At',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : ''),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          {row.irn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIrnToCheck(row.irn);
                setShowIRNStatusModal(true);
              }}
              className="text-blue-600 hover:text-blue-700"
              title="Check IRN Status"
            >
              <FiRefreshCw className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/client/einvoice/${row.id}`);
            }}
            className="text-primary-600 hover:text-primary-700"
            title="View Details"
          >
            <FiEye className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="E-Invoices - Client Portal">
        <PageLayout
          title="E-Invoices"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'E-Invoice' },
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => setShowIRNStatusModal(true)}
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Check IRN Status
            </Button>
          }
        >
          {/* IRN Status Check Modal */}
          <Modal
            isOpen={showIRNStatusModal}
            onClose={() => {
              setShowIRNStatusModal(false);
              setIrnToCheck('');
              setIrnStatus(null);
            }}
            title="Check IRN Status"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IRN (Invoice Reference Number)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={irnToCheck}
                    onChange={(e) => setIrnToCheck(e.target.value)}
                    placeholder="Enter IRN"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCheckIRNStatus}
                    disabled={checkingStatus || !irnToCheck.trim()}
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
              {irnStatus && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold mb-2">IRN Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>{' '}
                      <Badge variant={irnStatus.status === 'generated' ? 'success' : 'warning'}>
                        {irnStatus.status || 'N/A'}
                      </Badge>
                    </div>
                    {irnStatus.irn && (
                      <div>
                        <span className="text-gray-600">IRN:</span>{' '}
                        <span className="font-mono">{irnStatus.irn}</span>
                      </div>
                    )}
                    {irnStatus.ack_no && (
                      <div>
                        <span className="text-gray-600">Acknowledgment No:</span>{' '}
                        <span className="font-mono">{irnStatus.ack_no}</span>
                      </div>
                    )}
                    {irnStatus.ack_date && (
                      <div>
                        <span className="text-gray-600">Acknowledgment Date:</span>{' '}
                        <span>{new Date(irnStatus.ack_date).toLocaleString()}</span>
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
              onRowClick={(row) => router.push(`/client/einvoice/${row.id}`)}
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
