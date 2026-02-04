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
            total_amount: fc.integer({ min: 50001, max: 10000000 }) // Above threshold
          }),
          (voucher) => {
            const isRequired = eInvoiceService.isEInvoiceRequired(voucher);
            return isRequired === true;
          }
        ),
        { numRuns: 20 }
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
        { numRuns: 20 }
      );
    });

    test('non-sales invoices do not trigger E-Invoice generation regardless of amount', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Purchase Invoice', 'Bill of Supply', 'Credit Note', 'Debit Note'),
            total_amount: fc.integer({ min: 50001, max: 10000000 }) // Above threshold
          }),
          (voucher) => {
            const isRequired = eInvoiceService.isEInvoiceRequired(voucher);
            return isRequired === false;
          }
        ),
        { numRuns: 20 }
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
    
    // Generate valid GSTIN
    const validGstinArbitrary = fc.tuple(
      fc.integer({ min: 1, max: 37 }).map(n => n.toString().padStart(2, '0')), // State code
      fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^[A-Z0-9]{10}$/.test(s)), // PAN
      fc.integer({ min: 1, max: 9 }), // Entity number
      fc.constant('Z'), // Z
      fc.integer({ min: 0, max: 9 }) // Check digit
    ).map(([state, pan, entity, z, check]) => `${state}${pan}${entity}${z}${check}`);

    // Generate valid voucher item
    const validVoucherItemArbitrary = fc.record({
      item_description: fc.string({ minLength: 1, maxLength: 100 }),
      hsn_sac_code: fc.string({ minLength: 6, maxLength: 8 }).filter(s => /^[0-9]{6,8}$/.test(s)),
      quantity: fc.integer({ min: 1, max: 1000 }),
      rate: fc.integer({ min: 1, max: 100000 }),
      amount: fc.integer({ min: 1, max: 100000 }),
      gst_rate: fc.constantFrom(0, 5, 12, 18, 28),
      cgst_amount: fc.integer({ min: 0, max: 10000 }),
      sgst_amount: fc.integer({ min: 0, max: 10000 }),
      igst_amount: fc.integer({ min: 0, max: 10000 })
    });

    // Generate complete valid voucher
    const validVoucherArbitrary = fc.record({
      voucher_number: fc.string({ minLength: 1, maxLength: 50 }),
      voucher_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
      total_amount: fc.integer({ min: 1, max: 1000000 }),
      company: fc.record({
        gstin: validGstinArbitrary,
        company_name: fc.string({ minLength: 1, maxLength: 100 }),
        address: fc.string({ minLength: 1, maxLength: 200 }),
        city: fc.string({ minLength: 1, maxLength: 50 }),
        state_code: fc.integer({ min: 1, max: 37 }).map(n => n.toString().padStart(2, '0')),
        pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()),
        phone: fc.string({ minLength: 10, maxLength: 15 }),
        email: fc.emailAddress()
      }),
      partyLedger: fc.record({
        ledger_name: fc.string({ minLength: 1, maxLength: 100 }),
        gstin: fc.option(validGstinArbitrary), // Optional GSTIN
        address: fc.string({ minLength: 1, maxLength: 200 }),
        city: fc.string({ minLength: 1, maxLength: 50 }),
        state_code: fc.integer({ min: 1, max: 37 }).map(n => n.toString().padStart(2, '0')),
        pincode: fc.integer({ min: 100000, max: 999999 }).map(n => n.toString())
      }),
      voucher_items: fc.array(validVoucherItemArbitrary, { minLength: 1, maxLength: 10 })
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
        { numRuns: 20 }
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
        { numRuns: 20 }
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
        { numRuns: 20 }
      );
    });

    test('vouchers with zero or negative total_amount are rejected', () => {
      fc.assert(
        fc.property(
          fc.tuple(validVoucherArbitrary, fc.integer({ min: -10000, max: 0 })),
          ([voucher, invalidAmount]) => {
            const invalidVoucher = { ...voucher, total_amount: invalidAmount };
            const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Total amount must be greater than 0'));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('vouchers with missing seller GSTIN are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ 
            ...voucher, 
            company: { ...voucher.company, gstin: null } 
          })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Seller GSTIN is required'));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('vouchers with invalid seller GSTIN format are rejected', () => {
      fc.assert(
        fc.property(
          fc.tuple(validVoucherArbitrary, fc.string({ minLength: 1, maxLength: 20 })),
          ([voucher, invalidGstin]) => {
            // Ensure invalid GSTIN doesn't accidentally match valid format
            const reallyInvalidGstin = invalidGstin.length === 15 ? invalidGstin + 'X' : invalidGstin;
            const invalidVoucher = { 
              ...voucher, 
              company: { ...voucher.company, gstin: reallyInvalidGstin } 
            };
            const validation = eInvoiceService.validateEInvoiceFields(invalidVoucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Invalid seller GSTIN format'));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('vouchers with missing buyer name are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ 
            ...voucher, 
            partyLedger: { ...voucher.partyLedger, ledger_name: null, name: null } 
          })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Buyer name is required'));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('vouchers with empty item list are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ ...voucher, voucher_items: [] })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('At least one item is required'));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('vouchers with items missing description are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ 
            ...voucher, 
            voucher_items: [{ ...voucher.voucher_items[0], item_description: null }] 
          })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('Description is required'));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('vouchers with items missing HSN code are rejected', () => {
      fc.assert(
        fc.property(
          validVoucherArbitrary.map(voucher => ({ 
            ...voucher, 
            voucher_items: [{ ...voucher.voucher_items[0], hsn_sac_code: null }] 
          })),
          (voucher) => {
            const validation = eInvoiceService.validateEInvoiceFields(voucher);
            return validation.isValid === false && 
                   validation.errors.some(error => error.includes('HSN/SAC code is required'));
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});