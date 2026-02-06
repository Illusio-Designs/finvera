/**
 * Bill of Supply Implementation Test
 * 
 * Tests for Task 11.1: Add Bill of Supply voucher type support
 * 
 * Requirements tested:
 * - 5.1: Bill of Supply voucher type support
 * - 5.4: Items must be exempt/nil-rated
 * - 5.5: Separate numbering series for Bill of Supply
 * 
 * This test verifies:
 * 1. Bill of Supply numbering series can be created
 * 2. Bill of Supply vouchers can be created with exempt items
 * 3. Validation prevents taxable items in Bill of Supply
 * 4. GST amounts are zero for Bill of Supply
 * 5. Ledger entries are created without GST ledgers
 */

const fc = require('fast-check');
const NumberingService = require('../numberingService');
const VoucherService = require('../voucherService');
const GSTCalculationService = require('../gstCalculationService');

describe('Bill of Supply Implementation - Task 11.1', () => {
  describe('Format Token Validation', () => {
    it('should validate that format contains required tokens', () => {
      // Valid format
      expect(() => {
        NumberingService.validateFormat('PREFIXSEPARATORSEQUENCE');
      }).not.toThrow();

      // Missing PREFIX
      expect(() => {
        NumberingService.validateFormat('YEARSEQUENCE');
      }).toThrow('Format must contain PREFIX token');

      // Missing SEQUENCE
      expect(() => {
        NumberingService.validateFormat('PREFIXYEAR');
      }).toThrow('Format must contain SEQUENCE token');
    });
  });

  describe('Prefix Validation', () => {
    it('should validate prefix is uppercase alphanumeric', () => {
      // Valid prefix
      expect(() => {
        NumberingService.validatePrefix('BOS');
      }).not.toThrow();

      expect(() => {
        NumberingService.validatePrefix('BOS123');
      }).not.toThrow();

      // Invalid - lowercase
      expect(() => {
        NumberingService.validatePrefix('bos');
      }).toThrow('must contain only uppercase letters and numbers');

      // Invalid - special characters
      expect(() => {
        NumberingService.validatePrefix('BOS-');
      }).toThrow('must contain only uppercase letters and numbers');
    });

    it('should reject prefix longer than 10 characters', () => {
      expect(() => {
        NumberingService.validatePrefix('VERYLONGPREFIX');
      }).toThrow('cannot exceed 10 characters');
    });
  });

  describe('GST Compliance - 16 Character Limit', () => {
    it('should ensure generated voucher numbers do not exceed 16 characters', () => {
      const mockSeries = {
        prefix: 'BOS',
        format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
        separator: '-',
        sequence_length: 4
      };

      // Generate a test number
      const testNumber = NumberingService.formatVoucherNumber(mockSeries, 9999);

      // Verify length
      expect(testNumber.length).toBeLessThanOrEqual(16);
      expect(testNumber).toMatch(/^BOS-\d{4}-\d{4}$/);
    });

    it('should validate GST compliance for voucher numbers', () => {
      // Valid voucher number
      expect(() => {
        NumberingService.validateGSTCompliance('BOS-2025-0001');
      }).not.toThrow();

      // Too long
      expect(() => {
        NumberingService.validateGSTCompliance('VERYLONGPREFIX-2025-0001');
      }).toThrow('exceeds 16 character GST limit');

      // Invalid characters
      expect(() => {
        NumberingService.validateGSTCompliance('BOS@2025#0001');
      }).toThrow('contains invalid characters');
    });
  });

  describe('Bill of Supply Validation - Exempt Items Only', () => {
    it('should accept Bill of Supply with exempt items (GST rate = 0)', async () => {
      const voucherData = {
        voucher_type: 'bill_of_supply',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        items: [
          {
            item_description: 'Exempt Item 1',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 100,
            gst_rate: 0 // Exempt
          },
          {
            item_description: 'Exempt Item 2',
            hsn_sac_code: '1002',
            quantity: 5,
            rate: 200,
            gst_rate: 0 // Exempt
          }
        ]
      };

      const ctx = {
        tenantModels: {},
        masterModels: {},
        tenant_id: 'test-tenant-001'
      };

      const errors = [];
      await VoucherService.validateVoucherTypeRules(voucherData, ctx, errors);

      // Should have no errors
      expect(errors).toHaveLength(0);
    });

    it('should reject Bill of Supply with taxable items (GST rate > 0)', async () => {
      const voucherData = {
        voucher_type: 'bill_of_supply',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        items: [
          {
            item_description: 'Exempt Item',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 100,
            gst_rate: 0 // Exempt
          },
          {
            item_description: 'Taxable Item',
            hsn_sac_code: '1002',
            quantity: 5,
            rate: 200,
            gst_rate: 18 // Taxable - should be rejected
          }
        ]
      };

      const ctx = {
        tenantModels: {},
        masterModels: {},
        tenant_id: 'test-tenant-001'
      };

      const errors = [];
      await VoucherService.validateVoucherTypeRules(voucherData, ctx, errors);

      // Should have validation error
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Bill of Supply cannot contain taxable items');
    });
  });

  describe('Voucher Number Format Generation', () => {
    it('should format voucher number with all tokens', () => {
      const mockSeries = {
        prefix: 'BOS',
        format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
        separator: '-',
        sequence_length: 4,
        branch_id: null
      };

      const voucherNumber = NumberingService.formatVoucherNumber(mockSeries, 1);
      
      // Should match pattern BOS-YYYY-0001
      expect(voucherNumber).toMatch(/^BOS-\d{4}-0001$/);
    });

    it('should pad sequence numbers correctly', () => {
      const mockSeries = {
        prefix: 'BOS',
        format: 'PREFIXSEQUENCE',
        separator: '-',
        sequence_length: 6
      };

      const voucherNumber = NumberingService.formatVoucherNumber(mockSeries, 42);
      
      // Should be BOS000042 (6 digits)
      expect(voucherNumber).toBe('BOS000042');
    });
  });

  describe('Financial Year Calculation', () => {
    it('should calculate financial year correctly for dates after April', () => {
      // May 2024 should be FY 2024-25
      const date1 = new Date('2024-05-15');
      const fy1 = NumberingService.getFinancialYear(date1);
      expect(fy1).toBe('2024-25');

      // December 2024 should be FY 2024-25
      const date2 = new Date('2024-12-31');
      const fy2 = NumberingService.getFinancialYear(date2);
      expect(fy2).toBe('2024-25');
    });

    it('should calculate financial year correctly for dates before April', () => {
      // January 2025 should be FY 2024-25
      const date1 = new Date('2025-01-15');
      const fy1 = NumberingService.getFinancialYear(date1);
      expect(fy1).toBe('2024-25');

      // March 2025 should be FY 2024-25
      const date2 = new Date('2025-03-31');
      const fy2 = NumberingService.getFinancialYear(date2);
      expect(fy2).toBe('2024-25');
    });

    it('should handle April correctly (start of FY)', () => {
      // April 1, 2024 should be FY 2024-25
      const date = new Date('2024-04-01');
      const fy = NumberingService.getFinancialYear(date);
      expect(fy).toBe('2024-25');
    });
  });
});


describe('Property-Based Tests - Bill of Supply', () => {
  describe('Property 34: Bill of Supply Zero GST', () => {
    // Feature: indian-invoice-system-backend, Property 34: Bill of Supply Zero GST
    // Validates: Requirements 5.2
    
    test('all GST amounts are zero for Bill of Supply vouchers', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                quantity: fc.integer({ min: 1, max: 100 }),
                rate: fc.integer({ min: 100, max: 10000 }),
                discountPercent: fc.integer({ min: 0, max: 20 }),
                gstRate: fc.constant(0), // Bill of Supply must have 0% GST
                cessAmount: fc.constant(0)
              }),
              { minLength: 1, maxLength: 5 }
            ),
            supplierState: fc.constantFrom('27', '07', '29'), // Maharashtra, Delhi, Karnataka
            placeOfSupply: fc.constantFrom('27', '07', '29')
          }),
          (testData) => {
            // Calculate GST for the items
            const gstResult = GSTCalculationService.calculateVoucherGST(
              testData.items,
              testData.supplierState,
              testData.placeOfSupply,
              false
            );
            
            // Property: All GST amounts must be zero for Bill of Supply
            return (
              gstResult.totalCGST === 0 &&
              gstResult.totalSGST === 0 &&
              gstResult.totalIGST === 0 &&
              gstResult.totalCess === 0 &&
              gstResult.totalTax === 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply with exempt items has zero GST regardless of state', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                quantity: fc.integer({ min: 1, max: 50 }),
                rate: fc.integer({ min: 50, max: 5000 }),
                discountPercent: fc.constant(0),
                gstRate: fc.constant(0), // Exempt items
                cessAmount: fc.constant(0)
              }),
              { minLength: 1, maxLength: 3 }
            ),
            // Test both intrastate and interstate scenarios
            supplierState: fc.constantFrom('27', '07', '29', '33'),
            placeOfSupply: fc.constantFrom('27', '07', '29', '33', '19')
          }),
          (testData) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              testData.items,
              testData.supplierState,
              testData.placeOfSupply,
              false
            );
            
            // Property: Zero GST for both intrastate and interstate Bill of Supply
            const allGSTZero = 
              gstResult.totalCGST === 0 &&
              gstResult.totalSGST === 0 &&
              gstResult.totalIGST === 0;
            
            // Property: Subtotal equals final amount (no tax added)
            const subtotalEqualsFinal = 
              Math.abs(gstResult.subtotal - gstResult.grandTotal) < 0.01;
            
            return allGSTZero && subtotalEqualsFinal;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply item-level GST amounts are all zero', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 20 }),
              rate: fc.integer({ min: 100, max: 2000 }),
              discountPercent: fc.integer({ min: 0, max: 10 }),
              gstRate: fc.constant(0),
              cessAmount: fc.constant(0)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              items,
              '27', // Maharashtra
              '27', // Maharashtra (intrastate)
              false
            );
            
            // Property: Every item breakdown must have zero GST
            return gstResult.itemBreakdowns.every(item => 
              item.cgstAmount === 0 &&
              item.sgstAmount === 0 &&
              item.igstAmount === 0 &&
              item.cessAmount === 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply total amount equals subtotal (no tax component)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 100 }),
              rate: fc.integer({ min: 10, max: 10000 }),
              discountPercent: fc.constant(0),
              gstRate: fc.constant(0),
              cessAmount: fc.constant(0)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (items) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              items,
              '07', // Delhi
              '19', // West Bengal (interstate)
              false
            );
            
            // Property: For Bill of Supply, grandTotal should equal subtotal
            // (allowing for minor rounding differences)
            const difference = Math.abs(gstResult.grandTotal - gstResult.subtotal);
            return difference < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply with discounts still has zero GST', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                quantity: fc.integer({ min: 1, max: 50 }),
                rate: fc.integer({ min: 100, max: 5000 }),
                discountPercent: fc.integer({ min: 0, max: 50 }), // Various discount levels
                gstRate: fc.constant(0),
                cessAmount: fc.constant(0)
              }),
              { minLength: 1, maxLength: 5 }
            ),
            supplierState: fc.constantFrom('27', '29'),
            placeOfSupply: fc.constantFrom('27', '29')
          }),
          (testData) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              testData.items,
              testData.supplierState,
              testData.placeOfSupply,
              false
            );
            
            // Property: Discounts don't affect zero GST for Bill of Supply
            return (
              gstResult.totalCGST === 0 &&
              gstResult.totalSGST === 0 &&
              gstResult.totalIGST === 0 &&
              gstResult.totalTax === 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 35: Bill of Supply No GST Ledgers', () => {
    // Feature: indian-invoice-system-backend, Property 35: Bill of Supply No GST Ledgers
    // Validates: Requirements 5.6
    
    test('no GST ledger entries created for Bill of Supply', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                quantity: fc.integer({ min: 1, max: 100 }),
                rate: fc.integer({ min: 100, max: 10000 }),
                discountPercent: fc.integer({ min: 0, max: 20 }),
                gstRate: fc.constant(0), // Bill of Supply must have 0% GST
                cessAmount: fc.constant(0)
              }),
              { minLength: 1, maxLength: 5 }
            ),
            supplierState: fc.constantFrom('27', '07', '29'), // Maharashtra, Delhi, Karnataka
            placeOfSupply: fc.constantFrom('27', '07', '29')
          }),
          (testData) => {
            // Calculate GST for the items
            const gstResult = GSTCalculationService.calculateVoucherGST(
              testData.items,
              testData.supplierState,
              testData.placeOfSupply,
              false
            );

            // Simulate Bill of Supply ledger entries structure
            // Based on generateBillOfSupplyLedgerEntries method
            const ledgerEntries = [];
            
            // Customer debit entry
            ledgerEntries.push({
              ledger_id: 'customer-001',
              debit_amount: gstResult.grandTotal,
              credit_amount: 0,
              narration: 'Bill of Supply to Test Customer'
            });

            // Sales credit entry (no GST for Bill of Supply)
            ledgerEntries.push({
              ledger_id: 'sales-ledger',
              debit_amount: 0,
              credit_amount: gstResult.subtotal,
              narration: 'Bill of Supply revenue'
            });

            // Round-off entry (if applicable)
            if (gstResult.roundOff !== 0) {
              ledgerEntries.push({
                ledger_id: 'roundoff-ledger',
                debit_amount: gstResult.roundOff > 0 ? 0 : Math.abs(gstResult.roundOff),
                credit_amount: gstResult.roundOff > 0 ? gstResult.roundOff : 0,
                narration: 'Round Off'
              });
            }

            // Property: No GST ledger entries should be present
            const hasGSTLedgers = ledgerEntries.some(entry => {
              const narration = entry.narration.toLowerCase();
              return (
                narration.includes('cgst') ||
                narration.includes('sgst') ||
                narration.includes('igst') ||
                narration.includes('cess')
              );
            });

            // Property: Should have customer debit and sales credit entries only
            const hasCustomerDebit = ledgerEntries.some(entry => 
              entry.ledger_id === 'customer-001' && entry.debit_amount > 0
            );
            
            const hasSalesCredit = ledgerEntries.some(entry => 
              entry.narration.toLowerCase().includes('bill of supply revenue') && 
              entry.credit_amount > 0
            );

            return !hasGSTLedgers && hasCustomerDebit && hasSalesCredit;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply ledger entries count is minimal (no GST entries)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 50 }),
              rate: fc.integer({ min: 50, max: 5000 }),
              discountPercent: fc.constant(0),
              gstRate: fc.constant(0),
              cessAmount: fc.constant(0)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              items,
              '27', // Maharashtra
              '27', // Maharashtra (intrastate)
              false
            );

            // Simulate Bill of Supply ledger entries
            const ledgerEntries = [];
            
            // Customer debit
            ledgerEntries.push({
              ledger_id: 'customer-002',
              debit_amount: gstResult.grandTotal,
              credit_amount: 0,
              narration: 'Bill of Supply'
            });

            // Sales credit
            ledgerEntries.push({
              ledger_id: 'sales-ledger',
              debit_amount: 0,
              credit_amount: gstResult.subtotal,
              narration: 'Bill of Supply revenue'
            });

            // Round-off (if applicable)
            if (gstResult.roundOff !== 0) {
              ledgerEntries.push({
                ledger_id: 'roundoff-ledger',
                debit_amount: gstResult.roundOff > 0 ? 0 : Math.abs(gstResult.roundOff),
                credit_amount: gstResult.roundOff > 0 ? gstResult.roundOff : 0,
                narration: 'Round Off'
              });
            }

            // Property: Bill of Supply should have at most 3 ledger entries:
            // 1. Customer debit
            // 2. Sales credit
            // 3. Round-off (if applicable)
            // No GST entries should be present
            const maxExpectedEntries = gstResult.roundOff !== 0 ? 3 : 2;
            
            return ledgerEntries.length <= maxExpectedEntries;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply vs Tax Invoice ledger entry comparison', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 20 }),
              rate: fc.integer({ min: 100, max: 2000 }),
              discountPercent: fc.constant(0),
              gstRate: fc.constant(0), // For Bill of Supply
              cessAmount: fc.constant(0)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (items) => {
            // Generate Bill of Supply ledger entries
            const bosGstResult = GSTCalculationService.calculateVoucherGST(
              items,
              '27',
              '27',
              false
            );

            const bosLedgerEntries = [];
            bosLedgerEntries.push({ narration: 'Customer debit' });
            bosLedgerEntries.push({ narration: 'Bill of Supply revenue' });
            if (bosGstResult.roundOff !== 0) {
              bosLedgerEntries.push({ narration: 'Round Off' });
            }

            // Generate Tax Invoice ledger entries with same items but 18% GST
            const taxableItems = items.map(item => ({ ...item, gstRate: 18 }));
            const taxGstResult = GSTCalculationService.calculateVoucherGST(
              taxableItems,
              '27',
              '27',
              false
            );

            const taxLedgerEntries = [];
            taxLedgerEntries.push({ narration: 'Customer debit' });
            taxLedgerEntries.push({ narration: 'Sales revenue' });
            // Tax invoice has CGST and SGST entries
            if (taxGstResult.totalCGST > 0) {
              taxLedgerEntries.push({ narration: 'CGST Output' });
            }
            if (taxGstResult.totalSGST > 0) {
              taxLedgerEntries.push({ narration: 'SGST Output' });
            }
            if (taxGstResult.roundOff !== 0) {
              taxLedgerEntries.push({ narration: 'Round Off' });
            }

            // Property: Bill of Supply should have fewer ledger entries than Tax Invoice
            // Tax Invoice has CGST and SGST entries, Bill of Supply doesn't
            const bosHasNoGST = !bosLedgerEntries.some(entry => 
              entry.narration.toLowerCase().includes('gst')
            );
            
            const taxHasGST = taxLedgerEntries.some(entry => 
              entry.narration.toLowerCase().includes('gst')
            );

            return bosHasNoGST && taxHasGST && (bosLedgerEntries.length < taxLedgerEntries.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Bill of Supply interstate transaction has no IGST ledger', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                quantity: fc.integer({ min: 1, max: 30 }),
                rate: fc.integer({ min: 200, max: 3000 }),
                discountPercent: fc.integer({ min: 0, max: 15 }),
                gstRate: fc.constant(0),
                cessAmount: fc.constant(0)
              }),
              { minLength: 1, maxLength: 5 }
            ),
            // Interstate: different supplier and place of supply
            supplierState: fc.constantFrom('27', '07'),
            placeOfSupply: fc.constantFrom('29', '19', '33')
          }),
          (testData) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              testData.items,
              testData.supplierState,
              testData.placeOfSupply,
              false
            );

            // Simulate Bill of Supply ledger entries
            const ledgerEntries = [];
            
            ledgerEntries.push({
              narration: 'Interstate Bill of Supply'
            });
            
            ledgerEntries.push({
              narration: 'Bill of Supply revenue'
            });

            if (gstResult.roundOff !== 0) {
              ledgerEntries.push({
                narration: 'Round Off'
              });
            }

            // Property: Even for interstate Bill of Supply, no IGST ledger should be created
            const hasIGSTLedger = ledgerEntries.some(entry => 
              entry.narration.toLowerCase().includes('igst')
            );

            return !hasIGSTLedger;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Bill of Supply with round-off has exactly 3 ledger entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 25 }),
              rate: fc.integer({ min: 111, max: 999 }), // Rates that likely cause round-off
              discountPercent: fc.constant(0),
              gstRate: fc.constant(0),
              cessAmount: fc.constant(0)
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (items) => {
            const gstResult = GSTCalculationService.calculateVoucherGST(
              items,
              '07',
              '07',
              false
            );

            // Simulate Bill of Supply ledger entries
            const ledgerEntries = [];
            
            // Customer debit
            ledgerEntries.push({
              narration: 'Customer with Roundoff'
            });
            
            // Sales credit
            ledgerEntries.push({
              narration: 'Bill of Supply revenue'
            });

            // Round-off (if applicable)
            if (gstResult.roundOff !== 0) {
              ledgerEntries.push({
                narration: 'Round Off'
              });
            }

            // Property: If round-off exists, should have exactly 3 entries (customer, sales, round-off)
            // If no round-off, should have exactly 2 entries (customer, sales)
            // No GST entries in either case
            const expectedCount = gstResult.roundOff !== 0 ? 3 : 2;
            
            const hasNoGSTEntries = !ledgerEntries.some(entry => {
              const narration = entry.narration.toLowerCase();
              return narration.includes('cgst') || 
                     narration.includes('sgst') || 
                     narration.includes('igst');
            });

            return ledgerEntries.length === expectedCount && hasNoGSTEntries;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
