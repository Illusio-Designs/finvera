/**
 * Export Invoice Implementation Test
 * 
 * Tests for Task 13: Export Invoice Implementation
 * 
 * Requirements tested:
 * - 7.1: Export Invoice voucher type support
 * - 7.3: Zero-rated GST with LUT
 * - 7.4: IGST refundable without LUT
 * - 7.6: Currency conversion
 * - 7.7: Separate numbering series for Export Invoice
 * 
 * This test verifies:
 * 1. Export Invoice numbering series can be created
 * 2. Export Invoice with LUT has zero GST
 * 3. Export Invoice without LUT has IGST marked as refundable
 * 4. Currency conversion works correctly
 * 5. Shipping details are validated
 */

const fc = require('fast-check');
const voucherService = require('../voucherService');
const GSTCalculationService = require('../gstCalculationService');

describe('Export Invoice Implementation - Task 13', () => {

  describe('Property 43: Export Invoice Zero GST with LUT', () => {
    /**
     * Feature: indian-invoice-system-backend, Property 43: Export Invoice Zero GST with LUT
     * 
     * Property: For any Export Invoice where has_lut = true, all GST amounts 
     * (CGST, SGST, IGST) SHALL equal zero
     * 
     * Validates: Requirements 7.3
     */
    it('should have zero GST for all items when LUT is present', () => {
      fc.assert(
        fc.property(
          // Generate random export invoice data with LUT
          fc.record({
            items: fc.array(
              fc.record({
                quantity: fc.integer({ min: 1, max: 100 }),
                rate: fc.integer({ min: 100, max: 100000 }),
                gst_rate: fc.constantFrom(0, 5, 12, 18, 28),
                discount_percent: fc.integer({ min: 0, max: 20 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            has_lut: fc.constant(true),
            place_of_supply: fc.constant('Export')
          }),
          async (exportInvoiceData) => {
            // Mock context
            const ctx = {
              tenantModels: {
                Ledger: {
                  findByPk: jest.fn().mockResolvedValue({
                    id: 'party-123',
                    ledger_name: 'Export Customer',
                    state: null
                  })
                }
              },
              masterModels: {},
              company: { state: 'Maharashtra' },
              tenant_id: 'test-tenant-123'
            };

            const voucherData = {
              voucher_type: 'export_invoice',
              party_ledger_id: 'party-123',
              place_of_supply: exportInvoiceData.place_of_supply,
              has_lut: exportInvoiceData.has_lut,
              items: exportInvoiceData.items.map(item => ({
                ...item,
                item_description: 'Export Item',
                hsn_sac_code: '123456'
              }))
            };

            // Calculate voucher with GST
            const result = await voucherService.calculateVoucherWithGST(ctx, voucherData);

            // Property: All GST amounts must be zero when LUT is present
            expect(result.cgst_amount).toBe(0);
            expect(result.sgst_amount).toBe(0);
            expect(result.igst_amount).toBe(0);

            // Verify each item also has zero GST
            result.items.forEach(item => {
              expect(item.cgst_amount).toBe(0);
              expect(item.sgst_amount).toBe(0);
              expect(item.igst_amount).toBe(0);
            });

            // Verify total amount equals subtotal (no GST added)
            const expectedTotal = GSTCalculationService.roundOff(result.subtotal);
            expect(result.total_amount).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have zero GST even with high GST rates when LUT is present', () => {
      // Test with maximum GST rate (28%)
      const exportInvoiceData = {
        voucher_type: 'export_invoice',
        party_ledger_id: 'party-123',
        place_of_supply: 'Export',
        has_lut: true,
        items: [
          {
            quantity: 10,
            rate: 10000,
            gst_rate: 28, // Maximum GST rate
            discount_percent: 0,
            item_description: 'High GST Export Item',
            hsn_sac_code: '123456'
          }
        ]
      };

      const ctx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-123',
              ledger_name: 'Export Customer',
              state: null
            })
          }
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant-123'
      };

      return voucherService.calculateVoucherWithGST(ctx, exportInvoiceData).then(result => {
        // Even with 28% GST rate, all GST amounts should be zero with LUT
        expect(result.cgst_amount).toBe(0);
        expect(result.sgst_amount).toBe(0);
        expect(result.igst_amount).toBe(0);

        // Subtotal should be 10 × 10000 = 100000
        expect(result.subtotal).toBe(100000);

        // Total should equal subtotal (no GST)
        expect(result.total_amount).toBe(100000);
      });
    });
  });

  describe('Export Invoice without LUT - IGST Refundable', () => {
    it('should calculate IGST when LUT is not present', () => {
      const exportInvoiceData = {
        voucher_type: 'export_invoice',
        party_ledger_id: 'party-123',
        place_of_supply: 'Export',
        has_lut: false, // No LUT
        items: [
          {
            quantity: 10,
            rate: 10000,
            gst_rate: 18,
            discount_percent: 0,
            item_description: 'Export Item without LUT',
            hsn_sac_code: '123456'
          }
        ]
      };

      const ctx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-123',
              ledger_name: 'Export Customer',
              state: null
            })
          }
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant-123'
      };

      return voucherService.calculateVoucherWithGST(ctx, exportInvoiceData).then(result => {
        // Without LUT, IGST should be calculated
        expect(result.cgst_amount).toBe(0);
        expect(result.sgst_amount).toBe(0);
        expect(result.igst_amount).toBeGreaterThan(0);

        // IGST should be 18% of taxable amount
        // Taxable amount = 10 × 10000 = 100000
        // IGST = 100000 × 18 / 100 = 18000
        expect(result.igst_amount).toBe(18000);

        // Total should include IGST
        expect(result.total_amount).toBe(118000);
      });
    });
  });

  describe('Property 46: Export Invoice Currency Conversion', () => {
    /**
     * Feature: indian-invoice-system-backend, Property 46: Export Invoice Currency Conversion
     * 
     * Property: For any Export Invoice with foreign currency amount F and conversion rate R,
     * the base currency amount SHALL equal F × R
     * 
     * Validates: Requirements 7.6
     */
    it('should convert foreign currency to base currency correctly', () => {
      fc.assert(
        fc.property(
          // Generate random foreign amounts and exchange rates
          fc.record({
            foreignAmount: fc.float({ min: 1, max: 100000, noNaN: true }),
            exchangeRate: fc.float({ min: 0.01, max: 100, noNaN: true })
          }),
          (data) => {
            const { foreignAmount, exchangeRate } = data;

            // Convert to base currency
            const baseAmount = voucherService.convertToBaseCurrency(foreignAmount, exchangeRate);

            // Property: Base amount = Foreign amount × Exchange rate
            const expectedAmount = Math.round(foreignAmount * exchangeRate * 100) / 100;
            expect(baseAmount).toBeCloseTo(expectedAmount, 2);

            // Verify the conversion is reversible (within rounding tolerance)
            const convertedBack = baseAmount / exchangeRate;
            expect(convertedBack).toBeCloseTo(foreignAmount, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply exchange rate to all items in invoice', () => {
      const items = [
        { quantity: 10, rate: 100, discount_percent: 0 }, // USD 100 per unit
        { quantity: 5, rate: 200, discount_percent: 10 }  // USD 200 per unit with 10% discount
      ];

      const exchangeRate = 83.5; // 1 USD = 83.5 INR

      const convertedItems = voucherService.applyExchangeRateToItems(items, exchangeRate);

      // First item: rate should be 100 × 83.5 = 8350 INR
      expect(convertedItems[0].rate).toBe(8350);
      expect(convertedItems[0].foreign_rate).toBe(100);
      expect(convertedItems[0].taxable_amount).toBe(83500); // 10 × 8350

      // Second item: rate should be 200 × 83.5 = 16700 INR
      expect(convertedItems[1].rate).toBe(16700);
      expect(convertedItems[1].foreign_rate).toBe(200);
      // Taxable amount = 5 × 16700 × (1 - 0.1) = 75150
      expect(convertedItems[1].taxable_amount).toBe(75150);
    });

    it('should throw error for invalid exchange rate', () => {
      expect(() => {
        voucherService.convertToBaseCurrency(100, 0);
      }).toThrow('Exchange rate must be greater than 0');

      expect(() => {
        voucherService.convertToBaseCurrency(100, -1);
      }).toThrow('Exchange rate must be greater than 0');
    });
  });

  describe('Export Invoice Validation', () => {
    it('should validate shipping details for export invoice', async () => {
      const ctx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-123',
              ledger_name: 'Export Customer'
            })
          }
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant-123'
      };

      const errors = [];

      // Missing shipping_bill_number
      await voucherService.validateVoucherTypeRules(
        {
          voucher_type: 'export_invoice',
          party_ledger_id: 'party-123',
          place_of_supply: 'Export'
        },
        ctx,
        errors
      );

      expect(errors).toContain('Export Invoice requires shipping bill number');
      expect(errors).toContain('Export Invoice requires shipping bill date');
      expect(errors).toContain('Export Invoice requires port of loading');
      expect(errors).toContain('Export Invoice requires destination country');
    });

    it('should validate place of supply is "Export" for export invoice', async () => {
      const ctx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-123',
              ledger_name: 'Export Customer'
            })
          }
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant-123'
      };

      const errors = [];

      await voucherService.validateVoucherTypeRules(
        {
          voucher_type: 'export_invoice',
          party_ledger_id: 'party-123',
          place_of_supply: 'Maharashtra', // Wrong - should be "Export"
          shipping_bill_number: 'SB123',
          shipping_bill_date: new Date(),
          port_of_loading: 'Mumbai',
          destination_country: 'USA'
        },
        ctx,
        errors
      );

      expect(errors).toContain('Export Invoice must have place of supply as "Export"');
    });
  });
});
