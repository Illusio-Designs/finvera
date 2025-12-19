import { useEffect, useRef } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import DataTable from '../../../components/tables/DataTable';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI, companyAPI } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import { FiPrinter } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';

export default function StockSummary() {
  const printRef = useRef(null);
  const { user } = useAuth();
  const { data, loading, execute } = useApi(() => reportsAPI.stockSummary(), false);

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

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.data?.data || data?.data || [];
  const totals = data?.data?.totals || data?.totals || {};

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
          <title>Stock Summary</title>
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
              text-align: right;
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
    { key: 'item_name', label: 'Item', sortable: true },
    { key: 'hsn_sac_code', label: 'HSN/SAC', sortable: true, render: (v) => v || '-' },
    { key: 'uqc', label: 'UQC', sortable: true, render: (v) => v || '-' },
    { key: 'quantity_on_hand', label: 'Qty', sortable: true, render: (v) => v ?? 0 },
    { key: 'avg_cost', label: 'Avg Cost', sortable: true, render: (v) => formatCurrency(v || 0) },
    { key: 'stock_value', label: 'Value', sortable: true, render: (v) => formatCurrency(v || 0) },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Stock Summary - Client Portal">
        <Toaster />
        <PageLayout
          title="Stock Summary"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports/trial-balance' },
            { label: 'Stock Summary' },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={handlePrint}>
                <FiPrinter className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
              <Button variant="outline" onClick={() => toast.info('Export coming soon')}>
              Export
              </Button>
            </>
          }
        >
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
                <div className="text-lg font-semibold text-gray-700 mt-2">Stock Summary</div>
                <div className="text-sm text-gray-600 mt-1">
                  As On: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              </div>

              {rows && rows.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>HSN/SAC</th>
                      <th>UQC</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Avg Cost</th>
                      <th className="text-right">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        <td>{row.item_name || '-'}</td>
                        <td>{row.hsn_sac_code || '-'}</td>
                        <td>{row.uqc || '-'}</td>
                        <td className="text-right">{row.quantity_on_hand ?? 0}</td>
                        <td className="text-right">{formatCurrency(row.avg_cost || 0)}</td>
                        <td className="text-right">{formatCurrency(row.stock_value || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="print-summary">
                Total Stock Value: {formatCurrency(totals.stock_value || 0)}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={rows || []} loading={loading} searchable />
              <Card title="Totals" className="mt-6">
                <div className="text-sm text-gray-600">
                  Stock Value: <span className="font-semibold text-gray-900">{formatCurrency(totals.stock_value || 0)}</span>
                </div>
              </Card>
            </>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

