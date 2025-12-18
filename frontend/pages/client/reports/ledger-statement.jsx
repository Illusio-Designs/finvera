import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import FormSelect from '../../../components/forms/FormSelect';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI, accountingAPI } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../lib/dateUtils';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';
import { FiEye, FiPrinter, FiArrowLeft } from 'react-icons/fi';
import { useTable } from '../../../hooks/useTable';

export default function LedgerStatementReport() {
  const printRef = useRef(null);
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });
  const [ledgerId, setLedgerId] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLedgerId, setSelectedLedgerId] = useState(null);
  const [statementDateRange, setStatementDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  // Fetch all ledgers for the table
  const {
    data: tableData,
    loading: tableLoading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
  } = useTable(accountingAPI.ledgers.list, {});

  // Fetch ledgers for dropdown
  const { data: ledgersData } = useApi(() => accountingAPI.ledgers.list({ limit: 1000 }), true);
  
  // Fetch statement data
  const { data, loading, execute } = useApi(
    () => reportsAPI.ledgerStatement({ ...dateRange, ledger_id: ledgerId }),
    false
  );

  // Fetch statement for selected ledger in modal
  const { data: statementData, loading: statementLoading, execute: fetchStatement } = useApi(
    () => reportsAPI.ledgerStatement({ ledger_id: selectedLedgerId, ...statementDateRange }),
    false
  );

  // Fetch selected ledger details
  const { data: ledgerData, loading: ledgerLoading, execute: fetchLedger } = useApi(
    (id) => {
      if (!id) {
        return Promise.reject(new Error('Ledger ID is required'));
      }
      return accountingAPI.ledgers.get(id);
    },
    false
  );

  // Fetch ledger balance
  const { data: balanceData, execute: fetchBalance } = useApi(
    (id) => {
      if (!id) {
        return Promise.reject(new Error('Ledger ID is required'));
      }
      return accountingAPI.ledgers.getBalance(id, {});
    },
    false
  );

  const ledgers = ledgersData?.data || ledgersData || [];
  const ledgerOptions = ledgers.map((l) => ({
    value: l.id,
    label: `${l.ledger_code} - ${l.ledger_name}`,
  }));

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    if (!ledgerId) {
      toast.error('Please select a ledger');
      return;
    }
    execute();
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const handleView = async (ledger) => {
    if (!ledger || !ledger.id) {
      toast.error('Invalid ledger data');
      return;
    }
    setSelectedLedgerId(ledger.id);
    setShowDetail(true);
    try {
      await fetchLedger(ledger.id);
      await fetchStatement();
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Ledger not found');
        setShowDetail(false);
        setSelectedLedgerId(null);
      } else {
        toast.error('Failed to load ledger statement');
        console.error('Error fetching ledger:', error);
      }
    }
  };

  const handleStatementDateChange = (field, value) => {
    setStatementDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateStatement = () => {
    if (selectedLedgerId) {
      fetchStatement();
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedLedgerId(null);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const printContent = printRef.current.innerHTML;
    const ledger = ledgerData?.data || ledgerData;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${ledger?.ledger_name || 'Ledger Statement'}</title>
          <style>
            @media print {
              @page {
                margin: 0.5cm;
                size: A4;
              }
              body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                color: #000;
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              padding: 20px;
              color: #000;
              background: #fff;
            }
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              background: #fff;
            }
            .print-header {
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .print-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .print-section {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
            }
            .print-section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .print-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .print-item {
              margin-bottom: 8px;
            }
            .print-label {
              font-weight: bold;
              color: #666;
              font-size: 11px;
              margin-bottom: 3px;
            }
            .print-value {
              color: #000;
              font-size: 12px;
            }
            .print-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            }
            .print-badge-danger {
              background-color: #fee;
              color: #c00;
            }
            .print-badge-success {
              background-color: #efe;
              color: #060;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Table columns for ledger list
  const ledgerColumns = [
    { key: 'ledger_name', label: 'Ledger Name', sortable: true },
    { key: 'ledger_code', label: 'Code', sortable: true },
    {
      key: 'account_group_id',
      label: 'Account Group',
      sortable: false,
      render: (value, row) => {
        if (row.account_group) {
          return `${row.account_group.group_code || ''} - ${row.account_group.name || row.account_group.group_name || 'N/A'}`;
        }
        return 'N/A';
      },
    },
    {
      key: 'opening_balance',
      label: 'Opening Balance',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance_type',
      label: 'Balance Type',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'debit' ? 'danger' : 'success'}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
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

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value, 'DD-MM-YYYY'),
    },
    {
      key: 'voucher_number',
      label: 'Voucher No.',
      render: (value) => value || '-',
    },
    {
      key: 'narration',
      label: 'Particulars',
      render: (value) => value || '-',
    },
    {
      key: 'debit',
      label: 'Debit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatCurrency(value || 0),
    },
  ];

  const reportData = data?.data || data || {};
  const ledger = ledgerData?.data || ledgerData;
  const balance = balanceData?.data || balanceData || {};
  const statement = statementData?.data || statementData || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Ledger Statement - Client Portal">
        <Toaster />
        <PageLayout
          title="Ledger Statement"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Ledger Statement' },
          ]}
          actions={
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          }
        >
          {/* All Ledgers Table */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">All Ledgers</h2>
            </div>
            <Card className="shadow-sm border border-gray-200">
              <DataTable
                columns={ledgerColumns}
                data={tableData?.data || tableData || []}
                loading={tableLoading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onSort={handleSort}
                sortField={sort.field}
                sortOrder={sort.order}
                searchable={true}
                searchPlaceholder="Search ledgers..."
              />
            </Card>
          </div>

          {/* Ledger Statement Modal */}
          <Modal
            isOpen={showDetail}
            onClose={handleCloseDetail}
            title={ledger ? `${ledger.ledger_name} - Statement` : 'Ledger Statement'}
            size="full"
          >
            {ledgerLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : ledger ? (
              <div className="space-y-6">
                {/* Print Content - Hidden in display, shown in print */}
                <div ref={printRef} style={{ display: 'none' }}>
                  <div className="print-container">
                    <div className="print-header">
                      <div className="print-title">{ledger.ledger_name || 'Ledger Statement'}</div>
                      <div className="text-sm text-gray-600">
                        Ledger Code: {ledger.ledger_code} | Period: {formatDate(statementDateRange.from_date)} to {formatDate(statementDateRange.to_date)}
                      </div>
                    </div>

                    {statement.statement && statement.statement.length > 0 && (
                      <div className="print-section">
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Voucher No.</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Particulars</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Debit</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Credit</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statement.statement.map((row, index) => (
                              <tr key={index}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(row.date, 'DD-MM-YYYY')}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.voucher_number || '-'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.narration || '-'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.debit || 0)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.credit || 0)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatCurrency(row.balance || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {statement.summary && (
                      <div className="print-section">
                        <div className="print-section-title">Summary</div>
                        <div className="print-grid">
                          <div className="print-item">
                            <div className="print-label">Opening Balance</div>
                            <div className="print-value">
                              {formatCurrency(statement.summary.opening_balance || 0)}
                              {statement.summary.opening_balance_type && ` (${statement.summary.opening_balance_type})`}
                            </div>
                          </div>
                          <div className="print-item">
                            <div className="print-label">Total Debit</div>
                            <div className="print-value">{formatCurrency(statement.summary.total_debit || 0)}</div>
                          </div>
                          <div className="print-item">
                            <div className="print-label">Total Credit</div>
                            <div className="print-value">{formatCurrency(statement.summary.total_credit || 0)}</div>
                          </div>
                          <div className="print-item">
                            <div className="print-label">Closing Balance</div>
                            <div className="print-value">
                              {formatCurrency(statement.summary.closing_balance || 0)}
                              {statement.summary.closing_balance_type && ` (${statement.summary.closing_balance_type})`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Content */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormDatePicker
                      name="from_date"
                      label="From Date"
                      value={statementDateRange.from_date}
                      onChange={(name, value) => handleStatementDateChange('from_date', value)}
                    />
                    <FormDatePicker
                      name="to_date"
                      label="To Date"
                      value={statementDateRange.to_date}
                      onChange={(name, value) => handleStatementDateChange('to_date', value)}
                    />
                  </div>
                  <div className="mt-4">
                    <Button onClick={handleGenerateStatement} loading={statementLoading}>
                      Generate Statement
                    </Button>
                  </div>
                </Card>

                {statement.statement && statement.statement.length > 0 && (
                  <Card>
                    <div className="mb-4 text-sm text-gray-600">
                      Period: {formatDate(statementDateRange.from_date)} to {formatDate(statementDateRange.to_date)}
                    </div>
                    <DataTable
                      columns={columns}
                      data={statement.statement || []}
                      loading={statementLoading}
                    />
                  </Card>
                )}

                {statement.summary && (
                  <Card title="Summary">
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Opening Balance</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(statement.summary.opening_balance || 0)}
                          {statement.summary.opening_balance_type && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({statement.summary.opening_balance_type})
                            </span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Debit</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(statement.summary.total_debit || 0)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Credit</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(statement.summary.total_credit || 0)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Closing Balance</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(statement.summary.closing_balance || 0)}
                          {statement.summary.closing_balance_type && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({statement.summary.closing_balance_type})
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                    {statement.summary.transaction_count !== undefined && (
                      <div className="mt-4 text-sm text-gray-500">
                        Total Transactions: {statement.summary.transaction_count}
                      </div>
                    )}
                  </Card>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCloseDetail}>
                    <FiArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <FiPrinter className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-red-600">Ledger not found</p>
              </div>
            )}
          </Modal>

          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect
                name="ledger_id"
                label="Ledger"
                value={ledgerId}
                onChange={(name, value) => setLedgerId(value)}
                options={ledgerOptions}
                required
              />
              <FormDatePicker
                name="from_date"
                label="From Date"
                value={dateRange.from_date}
                onChange={(name, value) => handleDateChange('from_date', value)}
              />
              <FormDatePicker
                name="to_date"
                label="To Date"
                value={dateRange.to_date}
                onChange={(name, value) => handleDateChange('to_date', value)}
              />
            </div>
            <div className="mt-4">
              <Button onClick={handleGenerate} loading={loading}>
                Generate Report
              </Button>
            </div>
          </Card>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {reportData.statement && reportData.statement.length > 0 && (
            <>
              <Card title={`${reportData.ledger?.ledger_name || 'Ledger'} Statement`}>
                <div className="mb-4 text-sm text-gray-600">
                  Period: {formatDate(reportData.period?.from_date)} to {formatDate(reportData.period?.to_date)}
                </div>
                <DataTable
                  columns={columns}
                  data={reportData.statement || reportData.transactions || []}
                  loading={loading}
                />
              </Card>

              {reportData.summary && (
                <Card title="Summary" className="mt-6">
                  <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Opening Balance</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.opening_balance || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Debit</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.total_debit || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Credit</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.total_credit || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Closing Balance</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.closing_balance || 0)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              )}
            </>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

