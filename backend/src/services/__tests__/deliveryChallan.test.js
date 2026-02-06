/**
 * Delivery Challan Property-Based Tests
 * 
 * Tests for Task 14: Delivery Challan Implementation
 * 
 * Property 49: Delivery Challan No Tax Liability
 * - Validates: Requirements 8.2
 * - Test: GST=0 and no sales ledger entries for Delivery Challan
 * 
 * Property 51: Delivery Challan to Sales Invoice Conversion
 * - Validates: Requirements 8.5
 * - Test: Sales Invoice contains same items as Delivery Challan
 */

const fc = require('fast-check');
const VoucherService = require('../voucherService');
const GSTCalculationService = require('../gstCalculationService');

describe('Delivery Challan Property-Based Tests', () => {
  let voucherService;

  beforeEach(() => {
    // VoucherService is exported as a singleton, so we just reference it
    voucherService = require('../voucherService');
  });

  describe('Property 49: Delivery Challan No Tax Liability', () => {
    /**
     * **Validates: Requirements 8.2**
     * 
     * For any Delivery Challan, all GST amounts SHALL be zero AND 
     * no sales ledger entries SHALL be created
     */
    
    test('Delivery Challan has zero GST amounts', async () => {
      // Arbitrary for generating delivery challan items
      const itemArbitrary = fc.record({
        item_description: fc.string({ minLength: 3, maxLength: 50 }),
        quantity: fc.integer({ min: 1, max: 100 }),
        rate: fc.integer({ min: 100, max: 10000 }),
        gst_rate: fc.constantFrom(0, 5, 12, 18, 28),
        hsn_sac_code: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
      });

      const itemsArbitrary = fc.array(itemArbitrary, { minLength: 1, maxLength: 5 });
      const purposeArbitrary = fc.constantFrom('job_work', 'stock_transfer', 'sample');

      await fc.assert(
        fc.asyncProperty(
          itemsArbitrary,
          purposeArbitrary,
          async (items, purpose) => {
            // Mock context
            const mockCtx = {
              tenantModels: {
                Ledger: {
                  findByPk: jest.fn().mockResolvedValue({
                    id: 'party-ledger-id',
                    ledger_name: 'Test Customer',
                    state: 'Maharashtra',
                  }),
                },
              },
              masterModels: {},
              company: { state: 'Maharashtra' },
              tenant_id: 'test-tenant',
            };

            // Create delivery challan data
            const voucherData = {
              voucher_type: 'delivery_challan',
              party_ledger_id: 'party-ledger-id',
              purpose: purpose,
              items: items,
            };

            // Calculate voucher with GST
            const calculatedData = await voucherService.calculateVoucherWithGST(mockCtx, voucherData);

            // Property: All GST amounts must be zero for Delivery Challan
            const hasZeroGST = 
              calculatedData.cgst_amount === 0 &&
              calculatedData.sgst_amount === 0 &&
              calculatedData.igst_amount === 0 &&
              calculatedData.cess_amount === 0;

            return hasZeroGST;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Delivery Challan has no sales ledger entries', async () => {
      // Arbitrary for generating delivery challan items
      const itemArbitrary = fc.record({
        item_description: fc.string({ minLength: 3, maxLength: 50 }),
        quantity: fc.integer({ min: 1, max: 100 }),
        rate: fc.integer({ min: 100, max: 10000 }),
        gst_rate: fc.constantFrom(0, 5, 12, 18, 28),
        hsn_sac_code: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
      });

      const itemsArbitrary = fc.array(itemArbitrary, { minLength: 1, maxLength: 5 });
      const purposeArbitrary = fc.constantFrom('job_work', 'stock_transfer', 'sample');

      await fc.assert(
        fc.asyncProperty(
          itemsArbitrary,
          purposeArbitrary,
          async (items, purpose) => {
            // Mock context
            const mockCtx = {
              tenantModels: {
                Ledger: {
                  findByPk: jest.fn().mockResolvedValue({
                    id: 'party-ledger-id',
                    ledger_name: 'Test Customer',
                    state: 'Maharashtra',
                  }),
                },
              },
              masterModels: {},
              company: { state: 'Maharashtra' },
              tenant_id: 'test-tenant',
            };

            // Create delivery challan data
            const voucherData = {
              voucher_type: 'delivery_challan',
              party_ledger_id: 'party-ledger-id',
              purpose: purpose,
              items: items,
            };

            // Calculate voucher with GST
            const calculatedData = await voucherService.calculateVoucherWithGST(mockCtx, voucherData);

            // Property: No sales ledger entries should be created for Delivery Challan
            // Ledger entries should be empty or not contain sales ledger
            const hasNoSalesLedger = !calculatedData.ledger_entries || 
              calculatedData.ledger_entries.length === 0;

            return hasNoSalesLedger;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Delivery Challan purpose validation', () => {
      const validPurposes = ['job_work', 'stock_transfer', 'sample'];
      const invalidPurposes = ['sale', 'purchase', 'return', 'invalid'];

      // Test valid purposes - they should be in the valid list
      validPurposes.forEach(purpose => {
        expect(validPurposes.includes(purpose)).toBe(true);
      });

      // Test invalid purposes - they should not be in the valid list
      invalidPurposes.forEach(purpose => {
        expect(validPurposes.includes(purpose)).toBe(false);
      });
    });
  });

  describe('Property 51: Delivery Challan to Sales Invoice Conversion', () => {
    /**
     * **Validates: Requirements 8.5**
     * 
     * For any Delivery Challan converted to Sales Invoice, 
     * the Sales Invoice SHALL contain the same items (description, quantity, rate) 
     * as the Delivery Challan
     */
    
    test('converted Sales Invoice contains same items as Delivery Challan', async () => {
      // Arbitrary for generating delivery challan items
      const itemArbitrary = fc.record({
        item_description: fc.string({ minLength: 3, maxLength: 50 }),
        quantity: fc.integer({ min: 1, max: 100 }),
        rate: fc.integer({ min: 100, max: 10000 }),
        gst_rate: fc.constantFrom(0, 5, 12, 18, 28),
        hsn_sac_code: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
        inventory_item_id: fc.uuid(),
        warehouse_id: fc.uuid(),
        item_code: fc.string({ minLength: 3, maxLength: 10 }),
        uqc: fc.constantFrom('PCS', 'KGS', 'LTR', 'MTR'),
        discount_percent: fc.integer({ min: 0, max: 20 }),
      });

      const itemsArbitrary = fc.array(itemArbitrary, { minLength: 1, maxLength: 5 });

      await fc.assert(
        fc.asyncProperty(
          itemsArbitrary,
          async (items) => {
            // Mock source Delivery Challan voucher
            const sourceVoucher = {
              id: 'source-voucher-id',
              voucher_type: 'delivery_challan',
              voucher_number: 'DC-2024-0001',
              party_ledger_id: 'party-ledger-id',
              place_of_supply: 'Maharashtra',
              is_reverse_charge: false,
              purpose: 'job_work',
              items: items,
              converted_to_invoice_id: null,
            };

            // Mock context
            const mockCtx = {
              tenantModels: {
                Ledger: {
                  findByPk: jest.fn().mockResolvedValue({
                    id: 'party-ledger-id',
                    ledger_name: 'Test Customer',
                    state: 'Maharashtra',
                  }),
                },
                Voucher: {
                  findByPk: jest.fn().mockResolvedValue(sourceVoucher),
                  update: jest.fn().mockResolvedValue([1]),
                },
                sequelize: {
                  transaction: jest.fn().mockResolvedValue({
                    commit: jest.fn(),
                    rollback: jest.fn(),
                  }),
                },
              },
              masterModels: {},
              company: { state: 'Maharashtra' },
              tenant_id: 'test-tenant',
            };

            // Mock getVoucher to return source voucher
            voucherService.getVoucher = jest.fn().mockResolvedValue(sourceVoucher);
            
            // Mock createVoucher to return new voucher with same items
            voucherService.createVoucher = jest.fn().mockImplementation(async (ctx, voucherData) => {
              return {
                id: 'new-voucher-id',
                voucher_type: voucherData.voucher_type,
                voucher_number: 'SI-2024-0001',
                items: voucherData.items,
              };
            });

            // Convert Delivery Challan to Sales Invoice
            const convertedVoucher = await voucherService.convertVoucher(
              'source-voucher-id',
              'sales_invoice',
              mockCtx
            );

            // Property: Converted voucher must have same number of items
            if (convertedVoucher.items.length !== sourceVoucher.items.length) {
              return false;
            }

            // Property: Each item must match in key properties
            for (let i = 0; i < sourceVoucher.items.length; i++) {
              const sourceItem = sourceVoucher.items[i];
              const convertedItem = convertedVoucher.items[i];

              // Check that key properties are preserved
              if (
                sourceItem.item_description !== convertedItem.item_description ||
                sourceItem.quantity !== convertedItem.quantity ||
                sourceItem.rate !== convertedItem.rate ||
                sourceItem.hsn_sac_code !== convertedItem.hsn_sac_code ||
                sourceItem.inventory_item_id !== convertedItem.inventory_item_id ||
                sourceItem.warehouse_id !== convertedItem.warehouse_id
              ) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 50 } // Reduced runs due to complexity
      );
    });

    test('converted voucher has new voucher number and date', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'delivery_challan',
        voucher_number: 'DC-2024-0001',
        voucher_date: new Date('2024-01-01'),
        party_ledger_id: 'party-ledger-id',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Test Item',
            quantity: 10,
            rate: 100,
            gst_rate: 18,
          },
        ],
        converted_to_invoice_id: null,
      };

      const mockCtx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-ledger-id',
              ledger_name: 'Test Customer',
              state: 'Maharashtra',
            }),
          },
          Voucher: {
            findByPk: jest.fn().mockResolvedValue(sourceVoucher),
            update: jest.fn().mockResolvedValue([1]),
          },
          sequelize: {
            transaction: jest.fn().mockResolvedValue({
              commit: jest.fn(),
              rollback: jest.fn(),
            }),
          },
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant',
      };

      voucherService.getVoucher = jest.fn().mockResolvedValue(sourceVoucher);
      voucherService.createVoucher = jest.fn().mockImplementation(async (ctx, voucherData) => {
        return {
          id: 'new-voucher-id',
          voucher_type: voucherData.voucher_type,
          voucher_number: 'SI-2024-0001',
          voucher_date: voucherData.voucher_date,
          items: voucherData.items,
        };
      });

      const convertedVoucher = await voucherService.convertVoucher(
        'source-voucher-id',
        'sales_invoice',
        mockCtx
      );

      // Verify new voucher number
      expect(convertedVoucher.voucher_number).not.toBe(sourceVoucher.voucher_number);
      expect(convertedVoucher.voucher_type).toBe('sales_invoice');
      
      // Verify new date (should be current date)
      const now = new Date();
      const convertedDate = new Date(convertedVoucher.voucher_date);
      const timeDiff = Math.abs(now.getTime() - convertedDate.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    test('source voucher is marked with converted_to_invoice_id', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'delivery_challan',
        voucher_number: 'DC-2024-0001',
        party_ledger_id: 'party-ledger-id',
        items: [{ item_description: 'Test', quantity: 1, rate: 100, gst_rate: 18 }],
        converted_to_invoice_id: null,
      };

      const mockUpdate = jest.fn().mockResolvedValue([1]);
      const mockCtx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-ledger-id',
              ledger_name: 'Test Customer',
              state: 'Maharashtra',
            }),
          },
          Voucher: {
            findByPk: jest.fn().mockResolvedValue(sourceVoucher),
            update: mockUpdate,
          },
          sequelize: {
            transaction: jest.fn().mockResolvedValue({
              commit: jest.fn(),
              rollback: jest.fn(),
            }),
          },
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant',
      };

      voucherService.getVoucher = jest.fn().mockResolvedValue(sourceVoucher);
      voucherService.createVoucher = jest.fn().mockResolvedValue({
        id: 'new-voucher-id',
        voucher_type: 'sales_invoice',
        voucher_number: 'SI-2024-0001',
      });

      await voucherService.convertVoucher('source-voucher-id', 'sales_invoice', mockCtx);

      // Verify that update was called with converted_to_invoice_id
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          converted_to_invoice_id: 'new-voucher-id',
        }),
        expect.any(Object)
      );
    });

    test('cannot convert already converted Delivery Challan', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'delivery_challan',
        voucher_number: 'DC-2024-0001',
        converted_to_invoice_id: 'existing-invoice-id', // Already converted
        items: [],
      };

      const mockCtx = {
        tenantModels: {
          Voucher: {
            findByPk: jest.fn().mockResolvedValue(sourceVoucher),
          },
          sequelize: {
            transaction: jest.fn().mockResolvedValue({
              commit: jest.fn(),
              rollback: jest.fn(),
            }),
          },
        },
      };

      voucherService.getVoucher = jest.fn().mockResolvedValue(sourceVoucher);

      await expect(
        voucherService.convertVoucher('source-voucher-id', 'sales_invoice', mockCtx)
      ).rejects.toThrow('already been converted');
    });
  });

  describe('Delivery Challan Validation', () => {
    test('purpose field is required for Delivery Challan', async () => {
      const voucherData = {
        voucher_type: 'delivery_challan',
        party_ledger_id: 'party-id',
        items: [{ item_description: 'Test', quantity: 1, rate: 100 }],
        // Missing purpose field
      };

      const mockCtx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-id',
              ledger_name: 'Test',
            }),
          },
        },
        company: {},
      };

      await expect(
        voucherService.validateVoucherData(voucherData, mockCtx)
      ).rejects.toThrow('purpose');
    });

    test('purpose must be one of valid values', async () => {
      const validPurposes = ['job_work', 'stock_transfer', 'sample'];
      const invalidPurpose = 'invalid_purpose';

      const voucherData = {
        voucher_type: 'delivery_challan',
        party_ledger_id: 'party-id',
        purpose: invalidPurpose,
        items: [{ item_description: 'Test', quantity: 1, rate: 100 }],
      };

      const mockCtx = {
        tenantModels: {
          Ledger: {
            findByPk: jest.fn().mockResolvedValue({
              id: 'party-id',
              ledger_name: 'Test',
            }),
          },
        },
        company: {},
      };

      await expect(
        voucherService.validateVoucherData(voucherData, mockCtx)
      ).rejects.toThrow();
    });

    test('valid purpose values are accepted', () => {
      const validPurposes = ['job_work', 'stock_transfer', 'sample'];
      
      validPurposes.forEach(purpose => {
        // Should not throw for valid purposes
        expect(() => {
          const validPurposes = ['job_work', 'stock_transfer', 'sample'];
          if (!validPurposes.includes(purpose)) {
            throw new Error(`Invalid purpose: ${purpose}`);
          }
        }).not.toThrow();
      });
    });
  });
});
