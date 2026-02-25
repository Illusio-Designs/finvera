const { Router } = require('express');
const pdfController = require('../controllers/pdfController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Test routes (no auth required for testing)
router.get('/test/sales-invoice', pdfController.testSalesInvoice);
router.get('/test/purchase-invoice', pdfController.testPurchaseInvoice);
router.get('/test/receipt-voucher', pdfController.testReceiptVoucher);
router.get('/test/payment-voucher', pdfController.testPaymentVoucher);
router.get('/test/journal-voucher', pdfController.testJournalVoucher);
router.get('/test/contra-voucher', pdfController.testContraVoucher);
router.get('/test/credit-note', pdfController.testCreditNote);
router.get('/test/debit-note', pdfController.testDebitNote);

// Authenticated routes (for actual voucher PDFs)
router.use(authenticate);

// Voucher PDFs (to be implemented)
// router.get('/voucher/:voucherId/pdf', pdfController.generateVoucherPDF);

module.exports = router;
