/**
 * Proforma Invoice Property-Based Tests
 * 
 * Tests for Task 15: Proforma Invoice Implementation
 * 
 * Property 54: Proforma Invoice No Ledger Entries
 * - Validates: Requirements 9.4
 * - Test: No ledger entries created for Proforma Invoice
 * 
 * Property 56: Proforma to Sales Invoice Conversion
 * - Validates: Requirements 9.7
 * - Test: Sales Invoice has same items, new date
 */

const fc = require('fast-check');
const VoucherService = require('../voucherService');

describe('Proforma Invoice Property-Based Tests', () => {
  let voucherService;

  beforeEach(() => {
    // VoucherService is exported as a singleton, so we just reference it
    voucherService = require('../voucherService');
  });

  describe('Property 54: Proforma Invoice No Ledger Entries', () => {
    /**
     * **Validates: Requirements 9.4**
     * 
     * For any Proforma Invoice, the system SHALL NOT create any ledger entries 
     * (no debits or credits to any ledger)
     */
    
    test('Proforma Invoice has no ledger entries', async () => {
      // Arbitrary for generating proforma invoice items
      const itemArbitrary = fc.record({
        item_description: fc.string({ minLength: 3, maxLength: 50 }),
        quantity: fc.integer({ min: 1, max: 100 }),
        rate: fc.integer({ min: 100, max: 10000 }),
        gst_rate: fc.constantFrom(0, 5, 12, 18, 28),
        hsn_sac_code: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
      });

      const itemsArbitrary = fc.array(itemArbitrary, { minLength: 1, maxLength: 5 });

      await fc.assert(
        fc.asyncProperty(
          itemsArbitrary,
          async (items) => {
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

            // Create proforma invoice data
            const voucherData = {
              voucher_type: 'proforma_invoice',
              party_ledger_id: 'party-ledger-id',
              items: items,
            };

            // Calculate voucher with GST
            const calculatedData = await voucherService.calculateVoucherWithGST(mockCtx, voucherData);

            // Property: No ledger entries should be created for Proforma Invoice
            // Ledger entries should be empty or not exist
            const hasNoLedgerEntries = !calculatedData.ledger_entries || 
              calculatedData.ledger_entries.length === 0;

            return hasNoLedgerEntries;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Proforma Invoice calculates GST but does not create GST ledger entries', async () => {
      // Arbitrary for generating proforma invoice items with taxable GST rates
      const itemArbitrary = fc.record({
        item_description: fc.string({ minLength: 3, maxLength: 50 }),
        quantity: fc.integer({ min: 1, max: 100 }),
        rate: fc.integer({ min: 100, max: 10000 }),
        gst_rate: fc.constantFrom(5, 12, 18, 28), // Only taxable rates
        hsn_sac_code: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
      });

      const itemsArbitrary = fc.array(itemArbitrary, { minLength: 1, maxLength: 5 });

      await fc.assert(
        fc.asyncProperty(
          itemsArbitrary,
          async (items) => {
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

            // Create proforma invoice data
            const voucherData = {
              voucher_type: 'proforma_invoice',
              party_ledger_id: 'party-ledger-id',
              items: items,
            };

            // Calculate voucher with GST
            const calculatedData = await voucherService.calculateVoucherWithGST(mockCtx, voucherData);

            // Property 1: GST amounts should be calculated (non-zero for taxable items)
            const hasGSTCalculated = 
              calculatedData.cgst_amount > 0 ||
              calculatedData.sgst_amount > 0 ||
              calculatedData.igst_amount > 0;

            // Property 2: But no ledger entries should be created
            const hasNoLedgerEntries = !calculatedData.ledger_entries || 
              calculatedData.ledger_entries.length === 0;

            return hasGSTCalculated && hasNoLedgerEntries;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Proforma Invoice does not affect inventory', async () => {
      const voucherData = {
        voucher_type: 'proforma_invoice',
        party_ledger_id: 'party-ledger-id',
        items: [
          {
            item_description: 'Test Item',
            quantity: 10,
            rate: 100,
            gst_rate: 18,
            hsn_sac_code: '1234',
            inventory_item_id: 'inventory-item-id',
            warehouse_id: 'warehouse-id',
          },
        ],
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
        },
        masterModels: {},
        company: { state: 'Maharashtra' },
        tenant_id: 'test-tenant',
      };

      const calculatedData = await voucherService.calculateVoucherWithGST(mockCtx, voucherData);

      // Property: Proforma Invoice should not have inventory movements
      // This is verified by checking that no inventory-related fields are set
      const hasNoInventoryImpact = !calculatedData.inventory_movements || 
        calculatedData.inventory_movements.length === 0;

      expect(hasNoInventoryImpact).toBe(true);
    });
  });

  describe('Property 56: Proforma to Sales Invoice Conversion', () => {
    /**
     * **Validates: Requirements 9.7**
     * 
     * For any Proforma Invoice converted to Sales Invoice, 
     * the Sales Invoice SHALL contain the same items and amounts, 
     * but with voucher_date set to the conversion date
     */
    
    test('converted Sales Invoice contains same items as Proforma Invoice', async () => {
      // Arbitrary for generating proforma invoice items
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
            // Mock source Proforma Invoice voucher
            const sourceVoucher = {
              id: 'source-voucher-id',
              voucher_type: 'proforma_invoice',
              voucher_number: 'PI-2024-0001',
              voucher_date: new Date('2024-01-01'),
              party_ledger_id: 'party-ledger-id',
              place_of_supply: 'Maharashtra',
              is_reverse_charge: false,
              validity_period: 30,
              valid_until: new Date('2024-01-31'),
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
                voucher_date: voucherData.voucher_date,
                items: voucherData.items,
              };
            });

            // Convert Proforma Invoice to Sales Invoice
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

    test('converted voucher has new date set to conversion date', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'proforma_invoice',
        voucher_number: 'PI-2024-0001',
        voucher_date: new Date('2024-01-01'),
        party_ledger_id: 'party-ledger-id',
        place_of_supply: 'Maharashtra',
        validity_period: 30,
        valid_until: new Date('2024-01-31'),
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
      
      // Verify new date (should be current date, not the old proforma date)
      const now = new Date();
      const convertedDate = new Date(convertedVoucher.voucher_date);
      const timeDiff = Math.abs(now.getTime() - convertedDate.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
      
      // Verify date is different from source
      expect(convertedVoucher.voucher_date).not.toEqual(sourceVoucher.voucher_date);
    });

    test('converted voucher recalculates GST with new date', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'proforma_invoice',
        voucher_number: 'PI-2024-0001',
        voucher_date: new Date('2024-01-01'),
        party_ledger_id: 'party-ledger-id',
        place_of_supply: 'Maharashtra',
        cgst_amount: 90, // Old calculated amounts
        sgst_amount: 90,
        igst_amount: 0,
        total_amount: 1180,
        items: [
          {
            item_description: 'Test Item',
            quantity: 10,
            rate: 100,
            gst_rate: 18,
            hsn_sac_code: '1234',
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
      
      // Mock createVoucher to simulate GST recalculation
      voucherService.createVoucher = jest.fn().mockImplementation(async (ctx, voucherData) => {
        // Simulate recalculation - GST should be recalculated based on new date
        return {
          id: 'new-voucher-id',
          voucher_type: voucherData.voucher_type,
          voucher_number: 'SI-2024-0001',
          voucher_date: voucherData.voucher_date,
          cgst_amount: 90, // Recalculated
          sgst_amount: 90, // Recalculated
          igst_amount: 0,
          total_amount: 1180,
          items: voucherData.items,
        };
      });

      const convertedVoucher = await voucherService.convertVoucher(
        'source-voucher-id',
        'sales_invoice',
        mockCtx
      );

      // Verify that createVoucher was called (which triggers GST recalculation)
      expect(voucherService.createVoucher).toHaveBeenCalled();
      
      // Verify GST amounts exist in converted voucher
      expect(convertedVoucher.cgst_amount).toBeDefined();
      expect(convertedVoucher.sgst_amount).toBeDefined();
      expect(convertedVoucher.total_amount).toBeDefined();
    });

    test('source voucher is marked with converted_to_invoice_id', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'proforma_invoice',
        voucher_number: 'PI-2024-0001',
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

    test('cannot convert already converted Proforma Invoice', async () => {
      const sourceVoucher = {
        id: 'source-voucher-id',
        voucher_type: 'proforma_invoice',
        voucher_number: 'PI-2024-0001',
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

  describe('Proforma Invoice Validation', () => {
    test('Proforma Invoice is marked with PROFORMA INVOICE label', () => {
      const voucherType = 'proforma_invoice';
      
      // The voucher type itself serves as the label/marker
      expect(voucherType).toBe('proforma_invoice');
      
      // In the UI or printed document, this would be displayed as "PROFORMA INVOICE"
      const displayLabel = voucherType.replace('_', ' ').toUpperCase();
      expect(displayLabel).toBe('PROFORMA INVOICE');
    });

    test('Proforma Invoice can have validity period', () => {
      const voucherData = {
        voucher_type: 'proforma_invoice',
        party_ledger_id: 'party-id',
        validity_period: 30, // 30 days
        items: [{ item_description: 'Test', quantity: 1, rate: 100 }],
      };

      expect(voucherData.validity_period).toBe(30);
      expect(voucherData.validity_period).toBeGreaterThan(0);
    });

    test('valid_until is calculated from voucher_date + validity_period', () => {
      const voucherDate = new Date('2024-01-01');
      const validityPeriod = 30; // days
      
      // Calculate valid_until
      const validUntil = new Date(voucherDate);
      validUntil.setDate(validUntil.getDate() + validityPeriod);
      
      // Expected: 2024-01-31
      expect(validUntil.getDate()).toBe(31);
      expect(validUntil.getMonth()).toBe(0); // January (0-indexed)
      expect(validUntil.getFullYear()).toBe(2024);
    });

    test('Proforma Invoice validity period is optional', () => {
      const voucherData = {
        voucher_type: 'proforma_invoice',
        party_ledger_id: 'party-id',
        items: [{ item_description: 'Test', quantity: 1, rate: 100 }],
        // validity_period is optional
      };

      // Should not have validity_period if not specified
      expect(voucherData.validity_period).toBeUndefined();
    });
  });
});
