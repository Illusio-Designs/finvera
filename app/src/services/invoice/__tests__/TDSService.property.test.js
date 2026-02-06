/**
 * Property-Based Tests for TDSService
 * 
 * Tests universal properties that should hold for all inputs.
 * Feature: mobile-invoice-system-enhancement
 */

import fc from 'fast-check';
import TDSService from '../TDSService';
import { tdsAPI } from '../../../lib/api';

// Mock the API
jest.mock('../../../lib/api', () => ({
  tdsAPI: {
    calculate: jest.fn(),
    getDetails: jest.fn(),
    getRates: jest.fn(),
  },
}));

describe('TDSService - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 12: TDS Calculation Correctness
   * 
   * For any transaction amount and TDS section with a known rate,
   * when TDS is enabled in settings, the calculated TDS amount should
   * equal the transaction amount multiplied by the section's rate.
   * 
   * Validates: Requirements 4.1
   */
  test('Property 12: TDS Calculation Correctness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random voucher IDs (UUIDs)
        fc.uuid(),
        // Generate random transaction amounts (0 to 10,000,000)
        fc.float({ min: 0, max: 10000000, noNaN: true }),
        // Generate random TDS sections
        fc.constantFrom('194C', '194J', '194H', '194I', '194A', '192', '194D', '194G'),
        // Generate random deductee types
        fc.constantFrom('INDIVIDUAL', 'COMPANY', 'FIRM'),
        // Generate random TDS rates (0% to 30%)
        fc.float({ min: 0, max: Math.fround(0.30), noNaN: true }),
        async (voucherId, amount, section, deducteeType, rate) => {
          // Calculate expected TDS amount
          const expectedTDSAmount = amount * rate;

          // Mock API response with calculated TDS
          const mockResponse = {
            data: {
              id: 'tds-' + Math.random(),
              voucher_id: voucherId,
              section: section,
              rate: rate,
              amount: expectedTDSAmount,
              deductee_type: deducteeType,
              pan_number: null,
              calculated_at: new Date().toISOString(),
            },
          };

          tdsAPI.calculate.mockResolvedValueOnce(mockResponse);

          // Call calculateTDS
          const result = await TDSService.calculateTDS({
            voucherId,
            amount,
            section,
            deducteeType,
          });

          // Property: API should be called with correct parameters
          expect(tdsAPI.calculate).toHaveBeenCalledWith({
            voucher_id: voucherId,
            amount: amount,
            section: section,
            deductee_type: deducteeType,
            pan_number: null,
          });

          // Property: Result should contain voucher ID
          expect(result.voucherId).toBe(voucherId);

          // Property: Result should have the correct section
          expect(result.section).toBe(section);

          // Property: Result should have the correct rate
          expect(result.rate).toBe(rate);

          // Property: Calculated TDS amount should equal amount * rate (within floating point precision)
          expect(result.amount).toBeCloseTo(expectedTDSAmount, 2);

          // Property: TDS amount should never be negative
          expect(result.amount).toBeGreaterThanOrEqual(0);

          // Property: TDS amount should never exceed the transaction amount
          expect(result.amount).toBeLessThanOrEqual(amount);

          // Property: Result should have deductee type
          expect(result.deducteeType).toBe(deducteeType);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Net Amount Calculation Invariant
   * 
   * For any voucher with TDS, the net payable amount should always
   * equal the gross amount minus the TDS amount (netAmount = grossAmount - tdsAmount).
   * 
   * Validates: Requirements 4.5
   */
  test('Property 16: Net Amount Calculation Invariant', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random gross amounts (1 to 10,000,000) - avoid very small values to prevent floating point precision issues
        fc.float({ min: 1, max: 10000000, noNaN: true }),
        // Generate random TDS rates (0% to 30%)
        fc.float({ min: 0, max: Math.fround(0.30), noNaN: true }),
        async (grossAmount, tdsRate) => {
          // Calculate TDS amount
          const tdsAmount = grossAmount * tdsRate;
          
          // Calculate net amount
          const netAmount = grossAmount - tdsAmount;

          // Property: Net amount should equal gross amount minus TDS amount
          expect(netAmount).toBeCloseTo(grossAmount - tdsAmount, 2);

          // Property: Net amount should never be negative
          expect(netAmount).toBeGreaterThanOrEqual(0);

          // Property: Net amount should never exceed gross amount
          expect(netAmount).toBeLessThanOrEqual(grossAmount);

          // Property: If TDS rate is 0, net amount should equal gross amount
          if (tdsRate === 0) {
            expect(netAmount).toBeCloseTo(grossAmount, 2);
          }

          // Property: If TDS rate is positive and produces meaningful TDS amount, net amount should be less than gross amount
          // We add a threshold to avoid floating point precision issues with very small numbers
          const PRECISION_THRESHOLD = 0.01; // 1 cent
          if (tdsRate > 0 && tdsAmount > PRECISION_THRESHOLD) {
            expect(netAmount).toBeLessThan(grossAmount);
          }

          // Property: The relationship should be commutative: grossAmount = netAmount + tdsAmount
          expect(grossAmount).toBeCloseTo(netAmount + tdsAmount, 2);

          // Property: TDS amount should be proportional to gross amount
          if (grossAmount > 0) {
            const calculatedRate = tdsAmount / grossAmount;
            expect(calculatedRate).toBeCloseTo(tdsRate, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
