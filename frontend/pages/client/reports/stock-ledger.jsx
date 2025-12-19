import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import DataTable from '../../../components/tables/DataTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import FormInput from '../../../components/forms/FormInput';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import Button from '../../../components/ui/Button';
import { useApi } from '../../../hooks/useApi';
import { reportsAPI, companyAPI } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../../lib/dateUtils';
import { FiPrinter } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function StockLedger() {
  const printRef = useRef(null);
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    item_key: '',
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const { data, loading, execute } = useApi(() => reportsAPI.stockLedger(filters), false);

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
          <title>Stock Ledger</title>
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
    { key: 'date', label: 'Date', sortable: true, render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    { key: 'item_name', label: 'Item', sortable: true, render: (v) => v || '-' },
    { key: 'movement_type', label: 'Type', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true },
    { key: 'rate', label: 'Rate', sortable: true, render: (v) => formatCurrency(v || 0) },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => formatCurrency(v || 0) },
    { key: 'narration', label: 'Narration', sortable: false, render: (v) => v || '-' },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Stock Ledger - Client Portal">
        <PageLayout
          title="Stock Ledger"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports', href: '/client/reports/trial-balance' },
            { label: 'Stock Ledger' },
          ]}
          actions={
            <Button variant="outline" onClick={handlePrint}>
              <FiPrinter className="h-4 w-4 mr-2" />
              Print PDF
            </Button>
          }
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                name="item_key"
                label="Item Key (optional)"
                value={filters.item_key}
                onChange={(name, value) => setFilters((p) => ({ ...p, item_key: value }))}
                placeholder="(item_code or name key)"
              />
              <FormDatePicker
                name="from_date"
                label="From Date"
                value={filters.from_date}
                onChange={(name, value) => setFilters((p) => ({ ...p, from_date: value }))}
              />
              <FormDatePicker
                name="to_date"
                label="To Date"
                value={filters.to_date}
                onChange={(name, value) => setFilters((p) => ({ ...p, to_date: value }))}
              />
            </div>
            <div className="mt-4">
              <Button onClick={() => execute()} loading={loading}>
                Refresh
              </Button>
            </div>
          </Card>

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
                <div className="text-lg font-semibold text-gray-700 mt-2">Stock Ledger</div>
                <div className="text-sm text-gray-600 mt-1">
                  {filters.item_key && `Item: ${filters.item_key} | `}
                  Period: {formatDate(filters.from_date, 'DD-MM-YYYY')} to {formatDate(filters.to_date, 'DD-MM-YYYY')}
                </div>
              </div>

              {rows && rows.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item Name</th>
                      <th>Type</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amount</th>
                      <th>Narration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        <td>{row.date ? formatDate(row.date, 'DD-MM-YYYY') : '-'}</td>
                        <td>{row.item_name || '-'}</td>
                        <td>{row.movement_type || '-'}</td>
                        <td className="text-right">{row.quantity ?? 0}</td>
                        <td className="text-right">{formatCurrency(row.rate || 0)}</td>
                        <td className="text-right">{formatCurrency(row.amount || 0)}</td>
                        <td>{row.narration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <DataTable columns={columns} data={rows || []} loading={loading} searchable />
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

