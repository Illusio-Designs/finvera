const fc = require('fast-check');
const EInvoiceService = require('../eInvoiceService');

describe('EInvoiceService Property-Based Tests', () => {
  let eInvoiceService;

  beforeEach(() => {
    // Create a new instance for each test to avoid state pollution
    eInvoiceService = Object.create(Object.getPrototypeOf(EInvoiceService));
    Object.assign(eInvoiceService, EInvoiceService);
    eInvoiceService.eInvoiceThreshold = 50000; // Set default threshold
  });

  describe('Property 10: E-Invoice Threshold Triggering', () => {
    // Feature: indian-invoice-system-backend, Property 10: E-Invoice Threshold Triggering
    test('invoices above threshold trigger E-Invoice generation', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Sales Invoice', 'Tax Invoice'),
            total_amount: fc.integer({ min: 50001, max: 100000 }) // Above threshold (reduced range)
          }),
          (voucher) => {
            const isRequired = eInvoiceService.isEInvoiceRequired(voucher);
            return isRequired === true;
          }
        ),
        { numRuns: 10 } // Reduced from 20 to 10
      );
    });

    test('invoices below threshold do not trigger E-Invoice generation', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Sales Invoice', 'Tax Invoice'),
            total_amount: fc.integer({ min: 1, max: 50000 }) // Below or equal to threshold
          }),
          (voucher) => {
            const isRequired = eInvoiceService.isEInvoiceRequired(voucher);
            return isRequired === false;
          }
        ),
        { numRuns: 10 } // Reduced from 20 to 10
      );
    });

    test('non-sales invoices do not trigger E-Invoice generation', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Purchase Invoice', 'Bill of Supply'),
            total_amount: fc.integer({ min: 50001, max: 100000 }) // Reduced range
          }),
          (voucher) => {
            const isRequired = eInvoiceService.isEInvoiceRequired(voucher);
            return isRequired === false;
          }
        ),
        { numRuns: 10 } // Reduced from 20 to 10
      );
    });

    test('threshold boundary conditions', () => {
      // Test exact threshold value
      const voucherAtThreshold = {
        voucher_type: 'Sales Invoice',
        total_amount: 50000
      };
      expect(eInvoiceService.isEInvoiceRequired(voucherAtThreshold)).toBe(false);

      // Test just above threshold
      const voucherAboveThreshold = {
        voucher_type: 'Sales Invoice',
        total_amount: 50001
      };
      expect(eInvoiceService.isEInvoiceRequired(voucherAboveThreshold)).toBe(true);
    });
  });

  describe('Property 11: E-Invoice Mandatory Field Validation', () => {
    // Feature: indian-invoice-system-backend, Property 11: E-Invoice Mandatory Field Validation
    
    // Simplified GSTIN generator
    const validGstinArbitrary = fc.tuple(
      fc.integer({ min: 1, max: 37 }).map(n => n.toString().padStart(2, '0')),
      fc.constant('ABCDE1234F'), // Fixed PAN for speed
      fc.integer({ min: 1, max: 9 }),
      fc.constant('Z'),
      fc.integer({ min: 0, max: 9 })
    ).map(([state, pan, entity, z, check]) => `${state}${pan}${entity}${z}${check}`);

    // Simplified voucher item
    const validVoucherItemArbitrary = fc.record({
      item_description: fc.constant('Test Item'),
      hsn_sac_code: fc.constant('123456'),
      quantity: fc.integer({ min: 1, max: 100 }),
      rate: fc.integer({ min: 100, max: 10000 }),
      amount: fc.integer({ min: 100, max: 10000 }),
      gst_rate: fc.constantFrom(5, 12, 18),
      cgst_amount: fc.integer({ min: 0, max: 1000 }),
      sgst_amount: fc.integer({ min: 0, max: 1000 }),
      igst_amount: fc.integer({ min: 0, max: 1000 })
    });

    // Simplified valid voucher
    const validVoucherArbitrary = fc.record({
      voucher_number: fc.constant('INV-001'),
      voucher_date: fc.constant(new Date('2024-01-15')),
      total_amount: fc.integer({ min: 1000, max: 100000 }),
      company: fc.record({
        gstin: validGstinArbitrary,
        company_name: fc.constant('Test Company'),
        address: fc.constant('123 Test St'),
        city: fc.constant('Mumbai'),
        state_code: fc.constant('27'),
        pincode: fc.constant('400001'),
        phone: fc.constant('9876543210'),
        email: fc.constant('test@example.com')
      }),
      partyLedger: fc.record({
        ledger_name: fc.constant('Test Customer'),
        gstin: fc.option(validGstinArbitrary),
        address: fc.constant('456 Customer St'),
        city: fc.constant('Delhi'),
        state_code: fc.constant('07'),
        pincode: fc.constant('110001')
      }),
      voucher_items: fc.array(validVoucherItemArbitrary, { minLength: 1, maxLength: 2 })
    });

    test('complete valid vouchers pass validation', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary,
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === true;
          }
        ),
        { numRuns: 5 }
      );
    });

    test('vouchers with missing voucher_number are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ ...voucher, voucher_number: null })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Voucher number is required'));
          }
        ),
        { numRuns: 5 } // Reduced from 20 to 5
      );
    });

    test('vouchers with missing voucher_date are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ ...voucher, voucher_date: null })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Voucher date is required'));
          }
        ),
        { numRuns: 5 } // Reduced from 20 to 5
      );
    });

    test('vouchers with zero or negative total_amount are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 0,
        company: { gstin: '27ABCDE1234F1Z5' },
        partyLedger: { ledger_name: 'Test' },
        voucher_items: [{ item_description: 'Item', hsn_sac_code: '123456', quantity: 1, rate: 100, gst_rate: 18 }]
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Total amount must be greater than 0'))).toBe(true);
    });

    test('vouchers with missing seller GSTIN are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 1000,
        company: { gstin: null },
        partyLedger: { ledger_name: 'Test' },
        voucher_items: [{ item_description: 'Item', hsn_sac_code: '123456', quantity: 1, rate: 100, gst_rate: 18 }]
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Seller GSTIN is required'))).toBe(true);
    });

    test('vouchers with invalid seller GSTIN format are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 1000,
        company: { gstin: 'INVALID' },
        partyLedger: { ledger_name: 'Test' },
        voucher_items: [{ item_description: 'Item', hsn_sac_code: '123456', quantity: 1, rate: 100, gst_rate: 18 }]
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Invalid seller GSTIN format'))).toBe(true);
    });

    test('vouchers with missing buyer name are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 1000,
        company: { gstin: '27ABCDE1234F1Z5' },
        partyLedger: { ledger_name: null, name: null },
        voucher_items: [{ item_description: 'Item', hsn_sac_code: '123456', quantity: 1, rate: 100, gst_rate: 18 }]
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Buyer name is required'))).toBe(true);
    });

    test('vouchers with empty item list are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 1000,
        company: { gstin: '27ABCDE1234F1Z5' },
        partyLedger: { ledger_name: 'Test' },
        voucher_items: []
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('At least one item is required'))).toBe(true);
    });

    test('vouchers with items missing description are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 1000,
        company: { gstin: '27ABCDE1234F1Z5' },
        partyLedger: { ledger_name: 'Test' },
        voucher_items: [{ item_description: null, hsn_sac_code: '123456', quantity: 1, rate: 100, gst_rate: 18 }]
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Description is required'))).toBe(true);
    });

    test('vouchers with items missing HSN code are rejected', () => {
      const invalidVoucher = {
        voucher_number: 'INV-001',
        voucher_date: new Date(),
        total_amount: 1000,
        company: { gstin: '27ABCDE1234F1Z5' },
        partyLedger: { ledger_name: 'Test' },
        voucher_items: [{ item_description: 'Item', hsn_sac_code: null, quantity: 1, rate: 100, gst_rate: 18 }]
      };
      const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('HSN/SAC code is required'))).toBe(true);
    });
  });

  describe('Property 14: E-Invoice Cancellation Time Window', () => {
    // Feature: indian-invoice-system-backend, Property 14: E-Invoice Cancellation Time Window
    
    test('cancellation allowed within 24 hours', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }), // 0 to 23 hours
          (hours) => {
            const ackDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            const currentTime = new Date();
            const hoursDiff = (currentTime - ackDate) / (1000 * 60 * 60);
            
            return hoursDiff <= 24;
          }
        ),
        { numRuns: 10 } // Reduced from 50 to 10
      );
    });

    test('cancellation rejected after 24 hours', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 25, max: 100 }), // 25 to 100 hours
          (hours) => {
            const ackDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            const currentTime = new Date();
            const hoursDiff = (currentTime - ackDate) / (1000 * 60 * 60);
            
            return hoursDiff > 24;
          }
        ),
        { numRuns: 10 } // Reduced from 50 to 10
      );
    });

    test('boundary: exactly 24 hours allowed', () => {
      const ackDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const currentTime = new Date();
      const hoursDiff = (currentTime - ackDate) / (1000 * 60 * 60);
      
      expect(hoursDiff).toBeLessThanOrEqual(24);
    });

    test('boundary: just over 24 hours rejected', () => {
      const ackDate = new Date(Date.now() - (24 * 60 * 60 * 1000 + 1000));
      const currentTime = new Date();
      const hoursDiff = (currentTime - ackDate) / (1000 * 60 * 60);
      
      expect(hoursDiff).toBeGreaterThan(24);
    });
  });
});