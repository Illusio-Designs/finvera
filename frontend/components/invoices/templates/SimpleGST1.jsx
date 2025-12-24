import Image from 'next/image';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { PRINT_SIZE_CONFIGS } from '../../../lib/invoiceTemplates';

/**
 * Convert number to words (Indian format)
 */
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

/**
 * Get voucher type label
 */
function getVoucherTypeLabel(type) {
  const typeMap = {
    'Sales': 'TAX INVOICE',
    'Purchase': 'PURCHASE INVOICE',
    'Payment': 'PAYMENT VOUCHER',
    'Receipt': 'RECEIPT VOUCHER',
    'Journal': 'JOURNAL ENTRY',
    'Contra': 'CONTRA VOUCHER',
    'Debit Note': 'DEBIT NOTE',
    'Credit Note': 'CREDIT NOTE',
  };
  return typeMap[type] || type?.toUpperCase() || 'INVOICE';
}

/**
 * Simple GST Invoicing 1 - Default Template
 * Professional invoice template with clean layout
 */
export default function SimpleGST1({ invoice, company, partyLedger, items, settings }) {
  const printSize = settings?.print_size || 'A4';
  const sizeConfig = PRINT_SIZE_CONFIGS[printSize] || PRINT_SIZE_CONFIGS.A4;
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.taxable_amount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + parseFloat(item.cgst_amount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + parseFloat(item.sgst_amount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + parseFloat(item.igst_amount || 0), 0);
  const totalCess = items.reduce((sum, item) => sum + parseFloat(item.cess_amount || 0), 0);
  const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
  const roundOff = parseFloat(invoice.round_off || 0);
  const grandTotal = parseFloat(invoice.total_amount || 0);

  // Get e-invoice data if available
  const eInvoice = invoice.eInvoice || invoice.EInvoice;
  const eWayBill = invoice.eWayBill || invoice.EWayBill;

  // Bank details from company
  const bankDetails = company?.bank_details || {};

  return (
    <div 
      className="invoice-template-simple-gst-1 bg-white"
      style={{
        maxWidth: sizeConfig.maxWidth,
        width: sizeConfig.width,
        minHeight: sizeConfig.height,
        fontSize: sizeConfig.fontSize || '11px',
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        padding: printSize === 'A4' ? '20px' : printSize === 'A5' ? '15px' : '10px',
      }}
    >
      {/* Header Section */}
      <div className="border-b-2 border-black pb-4 mb-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {settings?.show_logo && company?.logo_url && (
              <div className="mb-3">
                <Image 
                  src={company.logo_url} 
                  alt={company.company_name || 'Company Logo'} 
                  width={150}
                  height={60}
                  className="h-auto max-h-16 object-contain"
                />
              </div>
            )}
            <div className="text-xl font-bold mb-1">
              {company?.company_name || 'Company Name'}
            </div>
            <div className="text-xs leading-relaxed text-gray-700">
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
            <div className="text-2xl font-bold uppercase text-gray-900 mb-2">
              {getVoucherTypeLabel(invoice.voucher_type)}
            </div>
            {eInvoice?.signed_qr_code && (
              <div className="mt-2">
                <img 
                  src={eInvoice.signed_qr_code} 
                  alt="E-Invoice QR Code" 
                  className="w-20 h-20 mx-auto"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-start mt-3 text-sm">
          <div>
            <div><strong>Invoice No:</strong> {invoice.voucher_number || 'N/A'}</div>
            <div><strong>Date:</strong> {formatDate(invoice.voucher_date, 'DD-MM-YYYY')}</div>
            {invoice.place_of_supply && (
              <div><strong>Place of Supply:</strong> {invoice.place_of_supply}</div>
            )}
            {invoice.due_date && (
              <div><strong>Due Date:</strong> {formatDate(invoice.due_date, 'DD-MM-YYYY')}</div>
            )}
            {eInvoice?.irn && (
              <div className="text-xs mt-1">
                <strong>IRN:</strong> {eInvoice.irn}
              </div>
            )}
            {eWayBill?.eway_bill_no && (
              <div className="text-xs mt-1">
                <strong>E-Way Bill:</strong> {eWayBill.eway_bill_no}
                {eWayBill.vehicle_no && ` | Vehicle: ${eWayBill.vehicle_no}`}
              </div>
            )}
          </div>
          <div className="text-right text-xs">
            <div className="font-semibold">ORIGINAL FOR RECIPIENT</div>
          </div>
        </div>
      </div>

      {/* Billing & Shipping Section */}
      {partyLedger && (
        <div className="flex justify-between my-5 gap-8">
          <div className="flex-1 border border-gray-300 p-3 bg-gray-50">
            <div className="font-bold text-sm mb-2 border-b border-gray-300 pb-1">
              {invoice.voucher_type === 'Sales' ? 'Bill To' : invoice.voucher_type === 'Purchase' ? 'Bill From' : 'Party Details'}
            </div>
            <div className="text-xs leading-relaxed">
              <div className="font-semibold">{partyLedger.ledger_name}</div>
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
          {(invoice.shipping_address || invoice.place_of_supply) && (
            <div className="flex-1 border border-gray-300 p-3 bg-gray-50">
              <div className="font-bold text-sm mb-2 border-b border-gray-300 pb-1">Ship To</div>
              <div className="text-xs leading-relaxed">
                {invoice.shipping_address ? (
                  <>
                    <div>{invoice.shipping_address}</div>
                    {(invoice.shipping_city || invoice.shipping_state || invoice.shipping_pincode) && (
                      <div>
                        {[invoice.shipping_city, invoice.shipping_state, invoice.shipping_pincode].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </>
                ) : (
                  <div>Same as billing address</div>
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
                <th className="border border-gray-300 p-2 text-center w-[5%]">#</th>
                <th className="border border-gray-300 p-2 text-left w-[30%]">Item Description</th>
                <th className="border border-gray-300 p-2 text-center w-[8%]">HSN/SAC</th>
                <th className="border border-gray-300 p-2 text-center w-[6%]">Qty</th>
                <th className="border border-gray-300 p-2 text-center w-[8%]">UQC</th>
                <th className="border border-gray-300 p-2 text-right w-[10%]">Rate</th>
                {(invoice.voucher_type === 'Sales' || invoice.voucher_type === 'Purchase') && (
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
                  {(invoice.voucher_type === 'Sales' || invoice.voucher_type === 'Purchase') && (
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
              {(invoice.voucher_type === 'Sales' || invoice.voucher_type === 'Purchase') && (
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

      {/* Tax Summary Table */}
      {(invoice.voucher_type === 'Sales' || invoice.voucher_type === 'Purchase') && (
        <div className="my-5">
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">HSN/SAC</th>
                <th className="border border-gray-300 p-2 text-right">Taxable Value</th>
                <th className="border border-gray-300 p-2 text-center">Rate</th>
                <th className="border border-gray-300 p-2 text-right">CGST</th>
                <th className="border border-gray-300 p-2 text-right">SGST</th>
                <th className="border border-gray-300 p-2 text-right">IGST</th>
                <th className="border border-gray-300 p-2 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                items.reduce((acc, item) => {
                  const hsn = item.hsn_sac_code || 'N/A';
                  const rate = item.gst_rate || 0;
                  const key = `${hsn}_${rate}`;
                  if (!acc[key]) {
                    acc[key] = {
                      hsn,
                      rate,
                      taxable: 0,
                      cgst: 0,
                      sgst: 0,
                      igst: 0,
                    };
                  }
                  acc[key].taxable += parseFloat(item.taxable_amount || 0);
                  acc[key].cgst += parseFloat(item.cgst_amount || 0);
                  acc[key].sgst += parseFloat(item.sgst_amount || 0);
                  acc[key].igst += parseFloat(item.igst_amount || 0);
                  return acc;
                }, {})
              ).map(([key, tax]) => (
                <tr key={key}>
                  <td className="border border-gray-300 p-2">{tax.hsn}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(tax.taxable, false)}</td>
                  <td className="border border-gray-300 p-2 text-center">{tax.rate}%</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(tax.cgst, false)}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(tax.sgst, false)}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(tax.igst, false)}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(tax.cgst + tax.sgst + tax.igst, false)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-200">
                <td className="border border-gray-300 p-2">TOTAL</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(subtotal, false)}</td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalCGST, false)}</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalSGST, false)}</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalIGST, false)}</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(totalTax, false)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      <div className="flex justify-end mt-5">
        <table className="w-[350px] border-collapse border border-gray-300">
          {(invoice.voucher_type === 'Sales' || invoice.voucher_type === 'Purchase') ? (
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

      {/* Payment Information */}
      {settings?.show_bank_details && (bankDetails.bank_name || bankDetails.account_number) && (
        <div className="mt-6 p-4 border border-gray-300 bg-gray-50">
          <div className="font-bold text-sm mb-2">Bank Details</div>
          <div className="text-xs space-y-1">
            {bankDetails.bank_name && (
              <div><strong>Bank:</strong> {bankDetails.bank_name}</div>
            )}
            {bankDetails.account_number && (
              <div><strong>Account #:</strong> {bankDetails.account_number}</div>
            )}
            {bankDetails.ifsc && (
              <div><strong>IFSC:</strong> {bankDetails.ifsc}</div>
            )}
            {bankDetails.branch && (
              <div><strong>Branch:</strong> {bankDetails.branch}</div>
            )}
          </div>
          {settings?.show_qr_code && bankDetails.upi_id && (
            <div className="mt-3">
              <div className="text-xs font-semibold mb-1">Pay using UPI</div>
              <div className="text-xs text-gray-600">UPI ID: {bankDetails.upi_id}</div>
              {/* QR Code would be generated here - placeholder for now */}
              <div className="w-24 h-24 border border-gray-300 bg-white mt-2 flex items-center justify-center text-xs text-gray-400">
                QR Code
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terms and Conditions */}
      {invoice.narration && (
        <div className="mt-6 pt-4 border-t border-gray-300 text-xs">
          <div className="font-bold mb-1">Terms & Conditions:</div>
          <div>{invoice.narration}</div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-600">
        <div>Thank you for the Business!</div>
        <div className="mt-2">This is a computer generated document and does not require a signature.</div>
        <div className="mt-1">
          Generated on {formatDate(new Date().toISOString(), 'DD-MM-YYYY HH:mm')}
        </div>
        {eInvoice?.irn && (
          <div className="mt-2 text-xs">
            <strong>E-Invoice IRN:</strong> {eInvoice.irn} | <strong>Ack No:</strong> {eInvoice.ack_no}
          </div>
        )}
      </div>
    </div>
  );
}

