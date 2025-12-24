/**
 * PDF Generation Service
 * Handles client-side PDF generation from invoice templates
 */

/**
 * Generate PDF from HTML element using jsPDF and html2canvas
 * @param {HTMLElement} element - The element to convert to PDF
 * @param {string} filename - Name for the PDF file
 * @param {object} options - PDF generation options
 */
export async function generatePDFFromElement(element, filename = 'invoice.pdf', options = {}) {
  try {
    // Dynamic import to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const {
      format = 'a4',
      orientation = 'portrait',
      margin = 10,
      quality = 1.0,
    } = options;

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = format === 'a4' ? 210 : format === 'a5' ? 148 : 80; // mm
    const pageHeight = format === 'a4' ? 297 : format === 'a5' ? 210 : 200; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
    });

    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - (2 * margin);

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - (2 * margin);
    }

    // Save the PDF
    pdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
}

/**
 * Generate PDF from invoice template
 * @param {HTMLElement} templateElement - The template element
 * @param {string} invoiceNumber - Invoice number for filename
 * @param {string} printSize - Print size (A4, A5, etc.)
 */
export async function generateInvoicePDF(templateElement, invoiceNumber = 'invoice', printSize = 'A4') {
  const formatMap = {
    'A4': 'a4',
    'A5': 'a5',
    'thermal_2inch': [48, 200], // width, height in mm
    'thermal_3inch': [80, 200],
  };

  const format = formatMap[printSize] || 'a4';
  const filename = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

  return generatePDFFromElement(templateElement, filename, {
    format,
    orientation: 'portrait',
    margin: 5,
    quality: 2.0,
  });
}

/**
 * Alternative: Use browser print to PDF (fallback)
 */
export function printToPDF(element) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Please allow popups to print');
  }

  const printContent = element.innerHTML;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice</title>
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
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            padding: 20px;
            color: #000;
            background: #fff;
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
}

