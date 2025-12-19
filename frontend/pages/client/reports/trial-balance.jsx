import { useState, useRef } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import Button from '../../../components/ui/Button';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI, companyAPI } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../lib/dateUtils';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';
import { FiPrinter } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';

export default function TrialBalance() {
  const printRef = useRef(null);
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const { data, loading, execute } = useApi(
    () => reportsAPI.trialBalance(dateRange),
    false
  );

  // Fetch company information for print header
  const { data: companyData } = useApi(
    () => {
      if (!user?.company_id) return Promise.resolve({ data: null });
      return companyAPI.get(user.company_id);
    },
    true,
    [user?.company_id]
  );
  const company = companyData?.data || companyData || {};

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    execute();
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trial Balance</title>
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
              text-align: center;
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
            .print-summary {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid #000;
            }
            .print-summary-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .print-summary-label {
              font-weight: bold;
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

  const columns = [
    {
      key: 'ledger_name',
      label: 'Ledger Name',
      sortable: true,
    },
    {
      key: 'debit',
      label: 'Debit',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'credit',
      label: 'Credit',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
  ];

  const reportData = data?.data || data || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Trial Balance - Client Portal">
        <Toaster />
        <PageLayout
          title="Trial Balance"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Trial Balance' },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={handlePrint}>
                <FiPrinter className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
            </>
          }
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Print Content - Hidden in display, shown in print */}
          <div ref={printRef} style={{ display: 'none' }}>
            <div className="print-container">
              <div className="print-header">
                <div className="print-title">{company.company_name || 'Company Name'}</div>
                {company.registered_address && (
                  <div className="text-sm text-gray-600 mt-1">
                    {company.registered_address}
                    {company.state && `, ${company.state}`}
                    {company.pincode && ` - ${company.pincode}`}
                  </div>
                )}
                <div className="text-lg font-semibold text-gray-700 mt-2">Trial Balance</div>
                <div className="text-sm text-gray-600 mt-1">
                  As On: {formatDate(reportData.as_on_date || dateRange.to_date, 'DD-MM-YYYY')}
                </div>
              </div>

              {reportData.trialBalance && reportData.trialBalance.length > 0 && (
                <div className="print-section">
                  <table>
                    <thead>
                      <tr>
                        <th>Ledger Name</th>
                        <th className="text-right">Debit</th>
                        <th className="text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.trialBalance.map((row, index) => (
                        <tr key={index}>
                          <td>{row.ledger_name || '-'}</td>
                          <td className="text-right">{formatCurrency(row.debit || 0)}</td>
                          <td className="text-right">{formatCurrency(row.credit || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportData.totals && (
                <div className="print-summary">
                  <div className="print-summary-item">
                    <span className="print-summary-label">Total Debit:</span>
                    <span>{formatCurrency(reportData.totals.totalDebit || 0)}</span>
                  </div>
                  <div className="print-summary-item">
                    <span className="print-summary-label">Total Credit:</span>
                    <span>{formatCurrency(reportData.totals.totalCredit || 0)}</span>
                  </div>
                  <div className="print-summary-item">
                    <span className="print-summary-label">Difference:</span>
                    <span>{formatCurrency(reportData.totals.difference || 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {reportData.trialBalance && (
            <>
              <DataTable
                columns={columns}
                data={reportData.trialBalance || []}
                loading={loading}
              />

              {reportData.totals && (
                <Card title="Summary" className="mt-6">
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Debit</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.totals.totalDebit || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Credit</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.totals.totalCredit || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Difference</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(reportData.totals.difference || 0)}
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

