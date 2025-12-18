import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { accountingAPI, companyAPI } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPrinter, FiDownload } from 'react-icons/fi';

export default function VoucherDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const printRef = useRef(null);
  const [company, setCompany] = useState(null);

  const { data, loading, error, execute: fetchVoucher } = useApi(
    () => {
      if (!id) return Promise.reject(new Error('Voucher ID is required'));
      return accountingAPI.vouchers.get(id);
    },
    false
  );

  // Fetch company information
  useEffect(() => {
    const fetchCompany = async () => {
      if (user?.company_id) {
        try {
          const response = await companyAPI.get(user.company_id);
          const companyData = response?.data?.data || response?.data;
          setCompany(companyData);
        } catch (err) {
          console.error('Error fetching company:', err);
        }
      }
    };
    fetchCompany();
  }, [user?.company_id]);

  useEffect(() => {
    if (id) {
      fetchVoucher().catch((err) => {
        if (err.response?.status === 404) {
          toast.error('Voucher not found');
          router.push('/client/vouchers/vouchers');
        } else {
          toast.error('Failed to load voucher');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const voucher = data?.voucher || data?.data?.voucher || data;

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
          <title>${voucher?.voucher_number || 'Voucher'}</title>
          <style>
            @media print {
              @page {
                margin: 0.5cm;
                size: A4;
              }
              body {
                font-family: 'Arial', sans-serif;
                font-size: 11px;
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
              font-size: 11px;
              padding: 20px;
              color: #000;
              background: #fff;
            }
            .invoice-container {
              max-width: 210mm;
              margin: 0 auto;
              background: #fff;
            }
            .invoice-header {
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .company-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            .company-info {
              flex: 1;
            }
            .company-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 10px;
              line-height: 1.4;
            }
            .invoice-title {
              text-align: right;
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 10px;
            }
            .billing-section {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              gap: 30px;
            }
            .billing-box {
              flex: 1;
              border: 1px solid #ddd;
              padding: 10px;
            }
            .billing-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .billing-content {
              font-size: 10px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-table {
              width: 300px;
              border-collapse: collapse;
            }
            .summary-table td {
              border: 1px solid #ddd;
              padding: 6px 10px;
            }
            .summary-table td:first-child {
              font-weight: bold;
              background-color: #f5f5f5;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
              font-size: 12px;
            }
            .terms-section {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 9px;
            }
            .terms-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 9px;
              color: #666;
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
      printWindow.close();
    }, 250);
  };

  const handleExportPDF = () => {
    toast.info('Opening print dialog. Use "Save as PDF" option in your browser.');
    handlePrint();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <ClientLayout>
          <PageLayout title="Voucher Details">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </PageLayout>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  if (error || !voucher) {
    return (
      <ProtectedRoute>
        <ClientLayout>
          <PageLayout title="Voucher Details">
            <Card>
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Failed to load voucher</p>
                <Button onClick={() => router.push('/client/vouchers/vouchers')}>
                  <FiArrowLeft className="h-4 w-4 mr-2" />
                  Back to Vouchers
                </Button>
              </div>
            </Card>
          </PageLayout>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  const items = voucher.voucher_items || [];
  const ledgerEntries = voucher.voucher_ledger_entries || [];
  const partyLedger = voucher.partyLedger;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.taxable_amount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + parseFloat(item.cgst_amount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + parseFloat(item.sgst_amount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + parseFloat(item.igst_amount || 0), 0);
  const totalCess = items.reduce((sum, item) => sum + parseFloat(item.cess_amount || 0), 0);
  const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
  const roundOff = parseFloat(voucher.round_off || 0);
  const grandTotal = parseFloat(voucher.total_amount || 0);

  // Determine voucher type label
  const getVoucherTypeLabel = (type) => {
    const typeMap = {
      'Sales': 'TAX INVOICE',
      'Purchase': 'PURCHASE INVOICE',
      'Payment': 'PAYMENT VOUCHER',
      'Receipt': 'RECEIPT VOUCHER',
      'Journal': 'JOURNAL ENTRY',
      'Contra': 'CONTRA VOUCHER',
      'Debit Note': 'DEBIT NOTE',
      'Credit Note': 'CREDIT NOTE',
      'GST Payment': 'GST PAYMENT VOUCHER',
      'GST Utilization': 'GST UTILIZATION VOUCHER',
      'TDS Payment': 'TDS PAYMENT VOUCHER',
      'TDS Settlement': 'TDS SETTLEMENT VOUCHER',
    };
    return typeMap[type] || type?.toUpperCase() || 'VOUCHER';
  };

  const getVoucherTypeColor = (type) => {
    const normalizedType = (type || '').toLowerCase().replace(/\s+/g, '_');
    const typeColors = {
      sales: 'success',
      purchase: 'warning',
      payment: 'primary',
      receipt: 'success',
      journal: 'default',
      contra: 'primary',
      debit_note: 'warning',
      'debit note': 'warning',
      credit_note: 'success',
      'credit note': 'success',
      gst_payment: 'primary',
      'gst payment': 'primary',
      gst_utilization: 'primary',
      'gst utilization': 'primary',
      tds_payment: 'warning',
      'tds payment': 'warning',
      tds_settlement: 'warning',
      'tds settlement': 'warning',
    };
    return typeColors[normalizedType] || typeColors[type?.toLowerCase()] || 'default';
  };

  return (
    <ProtectedRoute>
      <ClientLayout>
        <PageLayout
          title={`${getVoucherTypeLabel(voucher.voucher_type)}: ${voucher.voucher_number || 'N/A'}`}
          breadcrumbs={[
            { label: 'Vouchers', href: '/client/vouchers/vouchers' },
            { label: voucher.voucher_number || 'Details', href: '#' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/client/vouchers/vouchers')}>
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <FiPrinter className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <FiDownload className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          }
        >
          {/* Professional Invoice View */}
          <Card className="bg-white p-0">
            <div ref={printRef} className="max-w-[210mm] mx-auto bg-white p-5 print:p-0">
              {/* Header Section */}
              <div className="border-b-2 border-black pb-4 mb-5">
                <div className="flex justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-xl font-bold mb-1">
                      {company?.company_name || 'Company Name'}
                    </div>
                    <div className="text-xs leading-relaxed text-gray-600">
                      {company?.registered_address && (
                        <div>{company.registered_address}</div>
                      )}
                      {(company?.city || company?.state || company?.pincode) && (
                        <div>
                          {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {company?.gstin && (
                        <div><strong>GSTIN:</strong> {company.gstin}</div>
                      )}
                      {company?.pan && (
                        <div><strong>PAN:</strong> {company.pan}</div>
                      )}
                      {company?.contact_number && (
                        <div><strong>Phone:</strong> {company.contact_number}</div>
                      )}
                      {company?.email && (
                        <div><strong>Email:</strong> {company.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold uppercase text-gray-900">
                      {getVoucherTypeLabel(voucher.voucher_type)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-start mt-3 text-sm">
                  <div>
                    <div><strong>Voucher No:</strong> {voucher.voucher_number || 'N/A'}</div>
                    <div><strong>Date:</strong> {formatDate(voucher.voucher_date, 'DD-MM-YYYY')}</div>
                    {voucher.reference_number && (
                      <div>
                        <strong>Reference:</strong> {voucher.reference_number}
                        {voucher.reference_date && ` (${formatDate(voucher.reference_date, 'DD-MM-YYYY')})`}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge
                      variant={
                        voucher.status === 'posted'
                          ? 'success'
                          : voucher.status === 'cancelled'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {voucher.status ? voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1) : 'Draft'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Billing Section */}
              {partyLedger && (
                <div className="flex justify-between my-5 gap-8">
                  <div className="flex-1 border border-gray-300 p-3 bg-gray-50">
                    <div className="font-bold text-sm mb-2 border-b border-gray-300 pb-1">
                      {voucher.voucher_type === 'Sales' ? 'Bill To' : voucher.voucher_type === 'Purchase' ? 'Bill From' : 'Party Details'}
                    </div>
                    <div className="text-xs leading-relaxed">
                      <div><strong>{partyLedger.ledger_name}</strong></div>
                      {partyLedger.address && <div>{partyLedger.address}</div>}
                      {(partyLedger.city || partyLedger.state || partyLedger.pincode) && (
                        <div>
                          {[partyLedger.city, partyLedger.state, partyLedger.pincode].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {partyLedger.gstin && (
                        <div><strong>GSTIN:</strong> {partyLedger.gstin}</div>
                      )}
                      {partyLedger.pan && (
                        <div><strong>PAN:</strong> {partyLedger.pan}</div>
                      )}
                      {partyLedger.phone && (
                        <div><strong>Phone:</strong> {partyLedger.phone}</div>
                      )}
                      {partyLedger.email && (
                        <div><strong>Email:</strong> {partyLedger.email}</div>
                      )}
                    </div>
                  </div>
                  {(voucher.place_of_supply || voucher.shipping_address) && (
                    <div className="flex-1 border border-gray-300 p-3 bg-gray-50">
                      <div className="font-bold text-sm mb-2 border-b border-gray-300 pb-1">Ship To</div>
                      <div className="text-xs leading-relaxed">
                        {voucher.shipping_address ? (
                          <>
                            <div>{voucher.shipping_address}</div>
                            {(voucher.shipping_city || voucher.shipping_state || voucher.shipping_pincode) && (
                              <div>
                                {[voucher.shipping_city, voucher.shipping_state, voucher.shipping_pincode].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>Same as billing address</div>
                        )}
                        {voucher.place_of_supply && (
                          <div><strong>Place of Supply:</strong> {voucher.place_of_supply}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              {items.length > 0 && (
                <div className="my-5">
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 w-[5%]">Sr.</th>
                        <th className="border border-gray-300 p-2 text-left w-[30%]">Item Description</th>
                        <th className="border border-gray-300 p-2 text-center w-[8%]">HSN/SAC</th>
                        <th className="border border-gray-300 p-2 text-center w-[6%]">Qty</th>
                        <th className="border border-gray-300 p-2 text-center w-[8%]">UQC</th>
                        <th className="border border-gray-300 p-2 text-right w-[10%]">Rate</th>
                        {(voucher.voucher_type === 'Sales' || voucher.voucher_type === 'Purchase') && (
                          <>
                            <th className="border border-gray-300 p-2 text-right w-[10%]">Taxable Value</th>
                            <th className="border border-gray-300 p-2 text-center w-[5%]">GST%</th>
                            <th className="border border-gray-300 p-2 text-right w-[6%]">CGST</th>
                            <th className="border border-gray-300 p-2 text-right w-[6%]">SGST</th>
                            <th className="border border-gray-300 p-2 text-right w-[6%]">IGST</th>
                          </>
                        )}
                        <th className="border border-gray-300 p-2 text-right w-[10%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 p-2">{item.item_description || item.item_code || 'N/A'}</td>
                          <td className="border border-gray-300 p-2 text-center">{item.hsn_sac_code || 'N/A'}</td>
                          <td className="border border-gray-300 p-2 text-center">{parseFloat(item.quantity || 0).toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-center">{item.uqc || 'NOS'}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.rate || 0, false)}</td>
                          {(voucher.voucher_type === 'Sales' || voucher.voucher_type === 'Purchase') && (
                            <>
                              <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.taxable_amount || 0, false)}</td>
                              <td className="border border-gray-300 p-2 text-center">{parseFloat(item.gst_rate || 0).toFixed(2)}%</td>
                              <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.cgst_amount || 0, false)}</td>
                              <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.sgst_amount || 0, false)}</td>
                              <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.igst_amount || 0, false)}</td>
                            </>
                          )}
                          <td className="border border-gray-300 p-2 text-right font-medium">{formatCurrency(item.total_amount || 0, false)}</td>
                        </tr>
                      ))}
                      {(voucher.voucher_type === 'Sales' || voucher.voucher_type === 'Purchase') && (
                        <tr className="bg-gray-100 font-semibold">
                          <td colSpan="5" className="border border-gray-300 p-2 text-right">Total</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(subtotal, false)}</td>
                          <td className="border border-gray-300 p-2"></td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalCGST, false)}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalSGST, false)}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalIGST, false)}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(grandTotal, false)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Section */}
              <div className="flex justify-end mt-5">
                <table className="w-[350px] border-collapse border border-gray-300">
                  {(voucher.voucher_type === 'Sales' || voucher.voucher_type === 'Purchase') ? (
                    <>
                      <tr>
                        <td className="border border-gray-300 p-2 bg-gray-50 font-medium">Subtotal</td>
                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(subtotal, false)}</td>
                      </tr>
                      {totalCGST > 0 && (
                        <tr>
                          <td className="border border-gray-300 p-2 bg-gray-50 font-medium">CGST</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalCGST, false)}</td>
                        </tr>
                      )}
                      {totalSGST > 0 && (
                        <tr>
                          <td className="border border-gray-300 p-2 bg-gray-50 font-medium">SGST</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalSGST, false)}</td>
                        </tr>
                      )}
                      {totalIGST > 0 && (
                        <tr>
                          <td className="border border-gray-300 p-2 bg-gray-50 font-medium">IGST</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalIGST, false)}</td>
                        </tr>
                      )}
                      {totalCess > 0 && (
                        <tr>
                          <td className="border border-gray-300 p-2 bg-gray-50 font-medium">Cess</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalCess, false)}</td>
                        </tr>
                      )}
                      {Math.abs(roundOff) > 0.01 && (
                        <tr>
                          <td className="border border-gray-300 p-2 bg-gray-50 font-medium">Round Off</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(roundOff, false)}</td>
                        </tr>
                      )}
                    </>
                  ) : null}
                  <tr className="font-bold bg-gray-200">
                    <td className="border border-gray-300 p-2 text-base">Grand Total</td>
                    <td className="border border-gray-300 p-2 text-right text-base">{formatCurrency(grandTotal, false)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="border border-gray-300 text-center p-3 text-xs bg-gray-50">
                      <div className="font-semibold mb-1">Amount in Words:</div>
                      <div className="italic">{numberToWords(grandTotal)}</div>
                    </td>
                  </tr>
                </table>
              </div>

              {/* Terms and Conditions */}
              {voucher.narration && (
                <div className="mt-8 pt-4 border-t border-gray-300 text-xs">
                  <div className="font-bold mb-1">Terms & Conditions:</div>
                  <div>{voucher.narration}</div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 text-center text-xs text-gray-600">
                <div>This is a computer generated document and does not require a signature.</div>
                <div className="mt-1">
                  Generated on {formatDate(new Date().toISOString(), 'DD-MM-YYYY HH:mm')}
                </div>
              </div>
            </div>
          </Card>

          {/* Ledger Entries (for non-invoice vouchers or detailed view) */}
          {ledgerEntries.length > 0 && (voucher.voucher_type !== 'Sales' && voucher.voucher_type !== 'Purchase') && (
            <Card title="Ledger Entries" className="mt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Ledger</th>
                      <th className="text-right">Debit</th>
                      <th className="text-right">Credit</th>
                      <th className="text-left">Narration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.map((entry, index) => (
                      <tr key={entry.id || index}>
                        <td>{entry.Ledger?.ledger_name || 'N/A'}</td>
                        <td className="text-right">{formatCurrency(entry.debit_amount || 0)}</td>
                        <td className="text-right">{formatCurrency(entry.credit_amount || 0)}</td>
                        <td>{entry.narration || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

// Helper function to convert number to words (Indian format)
function numberToWords(amount) {
  if (amount === 0) return 'Zero Rupees Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertHundreds = (num) => {
    let result = '';
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    if (num > 0) {
      result += ones[num] + ' ';
    }
    return result;
  };

  const convert = (num) => {
    if (num === 0) return '';
    
    let result = '';
    if (num >= 10000000) {
      const crores = Math.floor(num / 10000000);
      result += convertHundreds(crores) + 'Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      const lakhs = Math.floor(num / 100000);
      result += convertHundreds(lakhs) + 'Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      result += convertHundreds(thousands) + 'Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      result += convertHundreds(num);
    }
    return result.trim();
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let words = convert(rupees);
  if (words) {
    words += 'Rupees';
  }
  if (paise > 0) {
    if (words) words += ' and ';
    words += convert(paise) + 'Paise';
  }
  if (!words) words = 'Zero';
  
  return words + ' Only';
}
