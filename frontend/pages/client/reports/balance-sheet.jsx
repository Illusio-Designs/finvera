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
import { getEndOfMonth } from '../../../lib/dateUtils';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';
import { FiPrinter } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';

export default function BalanceSheet() {
  const printRef = useRef(null);
  const { user } = useAuth();
  const [asOnDate, setAsOnDate] = useState(getEndOfMonth());

  const { data, loading, execute } = useApi(
    () => reportsAPI.balanceSheet({ as_on_date: asOnDate }),
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
          <title>Balance Sheet</title>
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
            }
            .print-section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .print-item {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid #eee;
            }
            .print-item-label {
              flex: 1;
            }
            .print-item-value {
              font-weight: bold;
              text-align: right;
            }
            .print-total {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              margin-top: 10px;
              border-top: 2px solid #000;
              font-weight: bold;
              font-size: 14px;
            }
            .print-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
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

  const reportData = data?.data || data || {};

  return (
    <ProtectedRoute>
      <ClientLayout title="Balance Sheet - Client Portal">
        <Toaster />
        <PageLayout
          title="Balance Sheet"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports' },
            { label: 'Balance Sheet' },
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
            <div className="max-w-xs">
              <FormDatePicker
                name="as_on_date"
                label="As On Date"
                value={asOnDate}
                onChange={(name, value) => setAsOnDate(value)}
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
                <div className="text-lg font-semibold text-gray-700 mt-2">Balance Sheet</div>
                <div className="text-sm text-gray-600 mt-1">
                  As On: {formatDate(asOnDate, 'DD-MM-YYYY')}
                </div>
              </div>

              <div className="print-grid">
                {reportData.balanceSheet?.assets && reportData.balanceSheet.assets.length > 0 && (
                  <div className="print-section">
                    <div className="print-section-title">Assets</div>
                    {reportData.balanceSheet.assets.map((item, index) => (
                      <div key={index} className="print-item">
                        <span className="print-item-label">{item.group_name || item.name || '-'}</span>
                        <span className="print-item-value">{formatCurrency(item.amount || 0)}</span>
                      </div>
                    ))}
                    <div className="print-total">
                      <span>Total Assets</span>
                      <span>{formatCurrency(reportData.totals?.totalAssets || 0)}</span>
                    </div>
                  </div>
                )}

                {reportData.balanceSheet?.liabilities && reportData.balanceSheet.liabilities.length > 0 && (
                  <div className="print-section">
                    <div className="print-section-title">Liabilities & Capital</div>
                    {reportData.balanceSheet.liabilities.map((item, index) => (
                      <div key={index} className="print-item">
                        <span className="print-item-label">{item.group_name || item.name || '-'}</span>
                        <span className="print-item-value">{formatCurrency(item.amount || 0)}</span>
                      </div>
                    ))}
                    <div className="print-total">
                      <span>Total Liabilities & Capital</span>
                      <span>{formatCurrency(reportData.totals?.totalLiabilities || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {reportData.balanceSheet?.assets && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Assets">
                <div className="space-y-4">
                  {reportData.balanceSheet.assets.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-700">{item.group_name || item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                    <span>Total Assets</span>
                    <span>{formatCurrency(reportData.totals?.totalAssets || 0)}</span>
                  </div>
                </div>
              </Card>

              <Card title="Liabilities & Capital">
                <div className="space-y-4">
                  {reportData.balanceSheet.liabilities?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-700">{item.group_name || item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount || 0)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                    <span>Total Liabilities & Capital</span>
                    <span>{formatCurrency(reportData.totals?.totalLiabilities || 0)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

