const fc = require('fast-check');
const EWayBillService = require('../eWayBillService');

describe('EWayBillService Property-Based Tests', () => {
  let eWayBillService;

  beforeEach(() => {
    // Create a new instance for each test to avoid state pollution
    eWayBillService = Object.create(Object.getPrototypeOf(EWayBillService));
    Object.assign(eWayBillService, EWayBillService);
    eWayBillService.eWayBillThreshold = 50000; // Set default threshold
  });

  describe('Property 17: E-Way Bill Threshold Triggering', () => {
    // Feature: indian-invoice-system-backend, Property 17: E-Way Bill Threshold Triggering
    test('invoices above ₹50,000 trigger E-Way Bill prompt', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Sales Invoice', 'Sales', 'Tax Invoice'),
            total_amount: fc.integer({ min: 50001, max: 100000 }) // Above threshold
          }),
          (voucher) => {
            const isRequired = eWayBillService.isEWayBillRequired(voucher);
            return isRequired === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('invoices below ₹50,000 do not trigger E-Way Bill prompt', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Sales Invoice', 'Sales', 'Tax Invoice'),
            total_amount: fc.integer({ min: 1, max: 50000 }) // Below or equal to threshold
          }),
          (voucher) => {
            const isRequired = eWayBillService.isEWayBillRequired(voucher);
            return isRequired === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('non-sales invoices do not trigger E-Way Bill prompt', () => {
      fc.assert(
        fc.property(
          fc.record({
            voucher_type: fc.constantFrom('Purchase Invoice', 'Bill of Supply', 'Proforma Invoice'),
            total_amount: fc.integer({ min: 50001, max: 100000 })
          }),
          (voucher) => {
            const isRequired = eWayBillService.isEWayBillRequired(voucher);
            return isRequired === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('threshold boundary conditions', () => {
      // Test exact threshold value
      const voucherAtThreshold = {
        voucher_type: 'Sales Invoice',
        total_amount: 50000
      };
      expect(eWayBillService.isEWayBillRequired(voucherAtThreshold)).toBe(false);

      // Test just above threshold
      const voucherAboveThreshold = {
        voucher_type: 'Sales Invoice',
        total_amount: 50001
      };
      expect(eWayBillService.isEWayBillRequired(voucherAboveThreshold)).toBe(true);
    });
  });

  describe('Property 20: E-Way Bill Validity Calculation', () => {
    // Feature: indian-invoice-system-backend, Property 20: E-Way Bill Validity Calculation
    test('validity = ceil(distance / 200) days for all distances', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5000 }), // Distance in kilometers
          (distance) => {
            const validityDate = eWayBillService.calculateValidityPeriod(distance, 'normal');
            const now = new Date();
            const expectedDays = Math.ceil(distance / 200);
            
            // Calculate the difference in days
            const diffTime = validityDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays === expectedDays;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validity calculation for over-dimensional goods', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // Distance in kilometers
          (distance) => {
            const validityDate = eWayBillService.calculateValidityPeriod(distance, 'over-dimensional');
            const now = new Date();
            const expectedDays = Math.ceil(distance / 20); // 1 day per 20 KM for over-dimensional
            
            // Calculate the difference in days
            const diffTime = validityDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays === expectedDays;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validity calculation boundary conditions', () => {
      // Test 200 KM exactly (should be 1 day)
      const validity200 = eWayBillService.calculateValidityPeriod(200, 'normal');
      const now200 = new Date();
      const diff200 = Math.ceil((validity200.getTime() - now200.getTime()) / (1000 * 60 * 60 * 24));
      expect(diff200).toBe(1);

      // Test 201 KM (should be 2 days)
      const validity201 = eWayBillService.calculateValidityPeriod(201, 'normal');
      const now201 = new Date();
      const diff201 = Math.ceil((validity201.getTime() - now201.getTime()) / (1000 * 60 * 60 * 24));
      expect(diff201).toBe(2);

      // Test 1 KM (should be 1 day)
      const validity1 = eWayBillService.calculateValidityPeriod(1, 'normal');
      const now1 = new Date();
      const diff1 = Math.ceil((validity1.getTime() - now1.getTime()) / (1000 * 60 * 60 * 24));
      expect(diff1).toBe(1);
    });
  });

  describe('Property 21: E-Way Bill Vehicle Update Constraint', () => {
    // Feature: indian-invoice-system-backend, Property 21: E-Way Bill Vehicle Update Constraint
    
    // Mock tenant models for testing
    const createMockEWayBill = (status) => ({
      id: 'test-id',
      voucher_id: 'voucher-id',
      ewb_number: '123456789012',
      status: status,
      vehicle_no: 'MH01AB1234',
      update: jest.fn().mockResolvedValue(true)
    });

    const createMockContext = (eWayBill) => ({
      tenantModels: {
        EWayBill: {
          findByPk: jest.fn().mockResolvedValue(eWayBill)
        }
      },
      company: {
        gstin: '27ABCDE1234F1Z5'
      }
    });

    test('vehicle updates allowed only when status=active', async () => {
      // Test with active status - should succeed
      const activeEWayBill = createMockEWayBill('active');
      const activeCtx = createMockContext(activeEWayBill);
      
      // Mock the E-Way Bill client
      eWayBillService.getEWayBillClient = jest.fn().mockReturnValue({
        updateVehicleDetails: jest.fn().mockResolvedValue({ success: true })
      });

      await expect(
        eWayBillService.updateVehicleDetails('test-id', 'MH02CD5678', 'BREAKDOWN', '', activeCtx)
      ).resolves.toBeDefined();

      // Test with cancelled status - should fail
      const cancelledEWayBill = createMockEWayBill('cancelled');
      const cancelledCtx = createMockContext(cancelledEWayBill);

      await expect(
        eWayBillService.updateVehicleDetails('test-id', 'MH02CD5678', 'BREAKDOWN', '', cancelledCtx)
      ).rejects.toThrow('Vehicle details can only be updated for active E-Way Bills');

      // Test with expired status - should fail
      const expiredEWayBill = createMockEWayBill('expired');
      const expiredCtx = createMockContext(expiredEWayBill);

      await expect(
        eWayBillService.updateVehicleDetails('test-id', 'MH02CD5678', 'BREAKDOWN', '', expiredCtx)
      ).rejects.toThrow('Vehicle details can only be updated for active E-Way Bills');
    });

    test('vehicle update requires valid vehicle number', async () => {
      const activeEWayBill = createMockEWayBill('active');
      const activeCtx = createMockContext(activeEWayBill);

      // Test with empty vehicle number
      await expect(
        eWayBillService.updateVehicleDetails('test-id', '', 'BREAKDOWN', '', activeCtx)
      ).rejects.toThrow('Vehicle number is required');

      // Test with null vehicle number
      await expect(
        eWayBillService.updateVehicleDetails('test-id', null, 'BREAKDOWN', '', activeCtx)
      ).rejects.toThrow('Vehicle number is required');
    });

    test('vehicle update requires reason code', async () => {
      const activeEWayBill = createMockEWayBill('active');
      const activeCtx = createMockContext(activeEWayBill);

      // Test with empty reason code
      await expect(
        eWayBillService.updateVehicleDetails('test-id', 'MH02CD5678', '', '', activeCtx)
      ).rejects.toThrow('Reason code is required');

      // Test with null reason code
      await expect(
        eWayBillService.updateVehicleDetails('test-id', 'MH02CD5678', null, '', activeCtx)
      ).rejects.toThrow('Reason code is required');
    });
  });

  describe('E-Way Bill Field Validation', () => {
    test('validates transporter GSTIN format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 15, maxLength: 15 }),
          (gstin) => {
            const isValid = eWayBillService.validateGSTIN(gstin);
            // Valid GSTIN must match the pattern
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
            return isValid === gstinRegex.test(gstin);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates transport mode', () => {
      const validModes = ['road', 'rail', 'air', 'ship'];
      const invalidModes = ['truck', 'plane', 'boat', 'train', ''];

      validModes.forEach(mode => {
        const voucher = {
          voucher_number: 'INV001',
          voucher_date: new Date(),
          total_amount: 60000,
          voucher_items: [{ item_description: 'Test' }]
        };
        const transportDetails = {
          transport_mode: mode,
          vehicle_no: 'MH01AB1234',
          distance: 100
        };
        const validation = eWayBillService.validateEWayBillFields(voucher, transportDetails);
        expect(validation.isValid).toBe(true);
      });

      invalidModes.forEach(mode => {
        const voucher = {
          voucher_number: 'INV001',
          voucher_date: new Date(),
          total_amount: 60000,
          voucher_items: [{ item_description: 'Test' }]
        };
        const transportDetails = {
          transport_mode: mode,
          vehicle_no: 'MH01AB1234',
          distance: 100
        };
        const validation = eWayBillService.validateEWayBillFields(voucher, transportDetails);
        expect(validation.isValid).toBe(false);
      });
    });

    test('validates distance is greater than zero', () => {
      const voucher = {
        voucher_number: 'INV001',
        voucher_date: new Date(),
        total_amount: 60000,
        voucher_items: [{ item_description: 'Test' }]
      };

      // Valid distance
      const validTransport = {
        transport_mode: 'road',
        vehicle_no: 'MH01AB1234',
        distance: 100
      };
      expect(eWayBillService.validateEWayBillFields(voucher, validTransport).isValid).toBe(true);

      // Zero distance
      const zeroTransport = {
        transport_mode: 'road',
        vehicle_no: 'MH01AB1234',
        distance: 0
      };
      expect(eWayBillService.validateEWayBillFields(voucher, zeroTransport).isValid).toBe(false);

      // Negative distance
      const negativeTransport = {
        transport_mode: 'road',
        vehicle_no: 'MH01AB1234',
        distance: -10
      };
      expect(eWayBillService.validateEWayBillFields(voucher, negativeTransport).isValid).toBe(false);
    });
  });
});
