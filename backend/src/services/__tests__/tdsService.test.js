const tdsService = require('../tdsService');
const { TDS_SECTIONS } = require('../tdsService');
const fc = require('fast-check');

describe('TDS Service - PAN Validation (Task 9.2)', () => {
  describe('validatePAN', () => {
    test('should return true for valid PAN format', () => {
      expect(tdsService.validatePAN('ABCDE1234F')).toBe(true);
      expect(tdsService.validatePAN('AAAAA0000A')).toBe(true);
      expect(tdsService.validatePAN('ZZZZZ9999Z')).toBe(true);
    });

    test('should return false for PAN with lowercase letters', () => {
      expect(tdsService.validatePAN('abcde1234f')).toBe(false);
      expect(tdsService.validatePAN('Abcde1234F')).toBe(false);
    });

    test('should return false for PAN with incorrect length', () => {
      expect(tdsService.validatePAN('ABCDE1234')).toBe(false); // 9 characters
      expect(tdsService.validatePAN('ABCDE12345F')).toBe(false); // 11 characters
      expect(tdsService.validatePAN('ABC')).toBe(false); // Too short
    });

    test('should return false for PAN with incorrect format', () => {
      expect(tdsService.validatePAN('12345ABCDE')).toBe(false); // Numbers first
      expect(tdsService.validatePAN('ABCDEFGHIJ')).toBe(false); // All letters
      expect(tdsService.validatePAN('1234567890')).toBe(false); // All numbers
      expect(tdsService.validatePAN('ABCD1234EF')).toBe(false); // Only 4 letters at start
      expect(tdsService.validatePAN('ABCDE123F4')).toBe(false); // Letter in middle of numbers
    });

    test('should return false for PAN with special characters', () => {
      expect(tdsService.validatePAN('ABCDE@234F')).toBe(false);
      expect(tdsService.validatePAN('ABCDE-1234F')).toBe(false);
      expect(tdsService.validatePAN('ABCDE 1234F')).toBe(false); // Space
    });

    test('should return false for null or undefined PAN', () => {
      expect(tdsService.validatePAN(null)).toBe(false);
      expect(tdsService.validatePAN(undefined)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(tdsService.validatePAN('')).toBe(false);
    });

    test('should return false for non-string input', () => {
      expect(tdsService.validatePAN(123)).toBe(false);
      expect(tdsService.validatePAN({})).toBe(false);
      expect(tdsService.validatePAN([])).toBe(false);
    });
  });
});

describe('TDS Service - calculateTDS Method (Task 9.2)', () => {
  describe('calculateTDSAmount - Basic Calculation', () => {
    test('should calculate TDS correctly for 194C individual above threshold', () => {
      // Amount: 50000, Rate: 1%, Expected TDS: 500
      const result = tdsService.calculateTDSAmount(50000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result).toBeDefined();
      expect(result.sectionCode).toBe('194C');
      expect(result.tdsRate).toBe(1.0);
      expect(result.taxableAmount).toBe(50000);
      expect(result.threshold).toBe(30000);
      expect(result.thresholdApplied).toBe(false);
      expect(result.tdsAmount).toBe(500);
      expect(result.netAmount).toBe(49500);
      expect(result.deducteePAN).toBe('ABCDE1234F');
      expect(result.deducteeType).toBe('individual');
    });

    test('should calculate TDS correctly for 194C company above threshold', () => {
      // Amount: 100000, Rate: 2%, Expected TDS: 2000
      const result = tdsService.calculateTDSAmount(100000, '194C', 'ZZZZZ9999Z', 'company');
      
      expect(result.sectionCode).toBe('194C');
      expect(result.tdsRate).toBe(2.0);
      expect(result.taxableAmount).toBe(100000);
      expect(result.tdsAmount).toBe(2000);
      expect(result.netAmount).toBe(98000);
      expect(result.thresholdApplied).toBe(false);
    });

    test('should calculate TDS correctly for 194J professional', () => {
      // Amount: 50000, Rate: 10%, Expected TDS: 5000
      const result = tdsService.calculateTDSAmount(50000, '194J', 'ABCDE1234F', 'professional');
      
      expect(result.sectionCode).toBe('194J');
      expect(result.tdsRate).toBe(10.0);
      expect(result.taxableAmount).toBe(50000);
      expect(result.tdsAmount).toBe(5000);
      expect(result.netAmount).toBe(45000);
    });

    test('should calculate TDS correctly for 194H commission', () => {
      // Amount: 20000, Rate: 5%, Expected TDS: 1000
      const result = tdsService.calculateTDSAmount(20000, '194H', 'ABCDE1234F', 'commission');
      
      expect(result.sectionCode).toBe('194H');
      expect(result.tdsRate).toBe(5.0);
      expect(result.taxableAmount).toBe(20000);
      expect(result.tdsAmount).toBe(1000);
      expect(result.netAmount).toBe(19000);
    });

    test('should calculate TDS correctly for 194I land_building', () => {
      // Amount: 300000, Rate: 10%, Expected TDS: 30000
      const result = tdsService.calculateTDSAmount(300000, '194I', 'ABCDE1234F', 'land_building');
      
      expect(result.sectionCode).toBe('194I');
      expect(result.tdsRate).toBe(10.0);
      expect(result.taxableAmount).toBe(300000);
      expect(result.tdsAmount).toBe(30000);
      expect(result.netAmount).toBe(270000);
    });

    test('should round TDS amount to 2 decimal places', () => {
      // Amount: 33333, Rate: 1%, Expected TDS: 333.33
      const result = tdsService.calculateTDSAmount(33333, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.tdsAmount).toBe(333.33);
      expect(result.netAmount).toBe(32999.67);
    });
  });

  describe('calculateTDSAmount - Threshold Application', () => {
    test('should not deduct TDS when amount is below threshold for 194C', () => {
      // Amount: 25000, Threshold: 30000, Expected TDS: 0
      const result = tdsService.calculateTDSAmount(25000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.thresholdApplied).toBe(true);
      expect(result.tdsAmount).toBe(0);
      expect(result.netAmount).toBe(25000);
    });

    test('should not deduct TDS when amount is below threshold for 194H', () => {
      // Amount: 10000, Threshold: 15000, Expected TDS: 0
      const result = tdsService.calculateTDSAmount(10000, '194H', 'ABCDE1234F', 'commission');
      
      expect(result.thresholdApplied).toBe(true);
      expect(result.tdsAmount).toBe(0);
      expect(result.netAmount).toBe(10000);
    });

    test('should not deduct TDS when amount is below threshold for 194I', () => {
      // Amount: 200000, Threshold: 240000, Expected TDS: 0
      const result = tdsService.calculateTDSAmount(200000, '194I', 'ABCDE1234F', 'land_building');
      
      expect(result.thresholdApplied).toBe(true);
      expect(result.tdsAmount).toBe(0);
      expect(result.netAmount).toBe(200000);
    });

    test('should deduct TDS when amount equals threshold', () => {
      // Amount: 30000, Threshold: 30000, Expected TDS: 300 (1% of 30000)
      const result = tdsService.calculateTDSAmount(30000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.thresholdApplied).toBe(false);
      expect(result.tdsAmount).toBe(300);
      expect(result.netAmount).toBe(29700);
    });

    test('should deduct TDS when amount is just above threshold', () => {
      // Amount: 30001, Threshold: 30000, Expected TDS: 300.01
      const result = tdsService.calculateTDSAmount(30001, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.thresholdApplied).toBe(false);
      expect(result.tdsAmount).toBe(300.01);
      expect(result.netAmount).toBe(29700.99);
    });
  });

  describe('calculateTDSAmount - PAN Validation', () => {
    test('should throw error for invalid PAN format', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '194C', 'INVALID', 'individual');
      }).toThrow('Invalid PAN format');
    });

    test('should throw error for empty PAN', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '194C', '', 'individual');
      }).toThrow('Invalid PAN format');
    });

    test('should throw error for null PAN', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '194C', null, 'individual');
      }).toThrow('Invalid PAN format');
    });

    test('should throw error for PAN with lowercase letters', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '194C', 'abcde1234f', 'individual');
      }).toThrow('Invalid PAN format');
    });

    test('should throw error for PAN with incorrect length', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '194C', 'ABCDE1234', 'individual');
      }).toThrow('Invalid PAN format');
    });
  });

  describe('calculateTDSAmount - Section Validation', () => {
    test('should throw error for invalid section code', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '194X', 'ABCDE1234F', 'individual');
      }).toThrow('Invalid TDS section code: 194X');
    });

    test('should throw error for empty section code', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, '', 'ABCDE1234F', 'individual');
      }).toThrow('Invalid TDS section code');
    });

    test('should throw error for null section code', () => {
      expect(() => {
        tdsService.calculateTDSAmount(50000, null, 'ABCDE1234F', 'individual');
      }).toThrow('Invalid TDS section code');
    });
  });

  describe('calculateTDSAmount - Return Object Structure', () => {
    test('should return object with all required fields', () => {
      const result = tdsService.calculateTDSAmount(50000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result).toHaveProperty('sectionCode');
      expect(result).toHaveProperty('sectionDescription');
      expect(result).toHaveProperty('tdsRate');
      expect(result).toHaveProperty('taxableAmount');
      expect(result).toHaveProperty('threshold');
      expect(result).toHaveProperty('thresholdApplied');
      expect(result).toHaveProperty('tdsAmount');
      expect(result).toHaveProperty('netAmount');
      expect(result).toHaveProperty('deducteePAN');
      expect(result).toHaveProperty('deducteeType');
    });

    test('should include section description in result', () => {
      const result = tdsService.calculateTDSAmount(50000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.sectionDescription).toBe('Payment to contractors and sub-contractors');
    });

    test('should include threshold information in result', () => {
      const result = tdsService.calculateTDSAmount(50000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.threshold).toBe(30000);
      expect(typeof result.thresholdApplied).toBe('boolean');
    });
  });

  describe('calculateTDSAmount - Edge Cases', () => {
    test('should handle zero amount', () => {
      const result = tdsService.calculateTDSAmount(0, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.taxableAmount).toBe(0);
      expect(result.tdsAmount).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.thresholdApplied).toBe(true); // Below threshold
    });

    test('should handle very large amounts', () => {
      const result = tdsService.calculateTDSAmount(10000000, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.taxableAmount).toBe(10000000);
      expect(result.tdsAmount).toBe(100000); // 1% of 10000000
      expect(result.netAmount).toBe(9900000);
    });

    test('should handle decimal amounts', () => {
      const result = tdsService.calculateTDSAmount(50000.50, '194C', 'ABCDE1234F', 'individual');
      
      expect(result.taxableAmount).toBe(50000.5); // JavaScript drops trailing zero
      expect(result.tdsAmount).toBe(500); // 1% of 50000.5 = 500.005, rounded to 500.00
      expect(result.netAmount).toBe(49500.5);
    });

    test('should default to individual type when not specified', () => {
      const result = tdsService.calculateTDSAmount(50000, '194C', 'ABCDE1234F');
      
      expect(result.deducteeType).toBe('individual');
      expect(result.tdsRate).toBe(1.0); // Individual rate for 194C
    });
  });
});

describe('TDS Service - Sections Configuration', () => {
  describe('TDS_SECTIONS constant', () => {
    test('should have all required sections', () => {
      expect(TDS_SECTIONS).toHaveProperty('194C');
      expect(TDS_SECTIONS).toHaveProperty('194I');
      expect(TDS_SECTIONS).toHaveProperty('194J');
      expect(TDS_SECTIONS).toHaveProperty('194H');
    });

    test('section 194C should have correct configuration', () => {
      const section = TDS_SECTIONS['194C'];
      expect(section.code).toBe('194C');
      expect(section.description).toBe('Payment to contractors and sub-contractors');
      expect(section.rates.individual).toBe(1.0);
      expect(section.rates.company).toBe(2.0);
      expect(section.threshold).toBe(30000);
      expect(section.aggregateThreshold).toBe(100000);
    });

    test('section 194I should have correct configuration', () => {
      const section = TDS_SECTIONS['194I'];
      expect(section.code).toBe('194I');
      expect(section.description).toBe('Payment of rent');
      expect(section.rates.plant_machinery).toBe(2.0);
      expect(section.rates.land_building).toBe(10.0);
      expect(section.threshold).toBe(240000);
    });

    test('section 194J should have correct configuration', () => {
      const section = TDS_SECTIONS['194J'];
      expect(section.code).toBe('194J');
      expect(section.description).toBe('Payment for professional or technical services');
      expect(section.rates.professional).toBe(10.0);
      expect(section.threshold).toBe(30000);
    });

    test('section 194H should have correct configuration', () => {
      const section = TDS_SECTIONS['194H'];
      expect(section.code).toBe('194H');
      expect(section.description).toBe('Payment of commission or brokerage');
      expect(section.rates.commission).toBe(5.0);
      expect(section.threshold).toBe(15000);
    });
  });

  describe('getTDSSections', () => {
    test('should return all TDS sections', () => {
      const sections = tdsService.getTDSSections();
      expect(sections).toBeDefined();
      expect(Object.keys(sections)).toHaveLength(4);
      expect(sections).toHaveProperty('194C');
      expect(sections).toHaveProperty('194I');
      expect(sections).toHaveProperty('194J');
      expect(sections).toHaveProperty('194H');
    });
  });

  describe('getTDSSection', () => {
    test('should return specific section configuration', () => {
      const section = tdsService.getTDSSection('194C');
      expect(section).toBeDefined();
      expect(section.code).toBe('194C');
      expect(section.description).toBe('Payment to contractors and sub-contractors');
    });

    test('should return null for invalid section code', () => {
      const section = tdsService.getTDSSection('194X');
      expect(section).toBeNull();
    });

    test('should return null for empty section code', () => {
      const section = tdsService.getTDSSection('');
      expect(section).toBeNull();
    });

    test('should return null for null section code', () => {
      const section = tdsService.getTDSSection(null);
      expect(section).toBeNull();
    });
  });

  describe('getTDSRate', () => {
    test('should return correct rate for 194C individual', () => {
      const rate = tdsService.getTDSRate('194C', 'individual');
      expect(rate).toBe(1.0);
    });

    test('should return correct rate for 194C company', () => {
      const rate = tdsService.getTDSRate('194C', 'company');
      expect(rate).toBe(2.0);
    });

    test('should return correct rate for 194I land_building', () => {
      const rate = tdsService.getTDSRate('194I', 'land_building');
      expect(rate).toBe(10.0);
    });

    test('should return correct rate for 194I plant_machinery', () => {
      const rate = tdsService.getTDSRate('194I', 'plant_machinery');
      expect(rate).toBe(2.0);
    });

    test('should return correct rate for 194J professional', () => {
      const rate = tdsService.getTDSRate('194J', 'professional');
      expect(rate).toBe(10.0);
    });

    test('should return correct rate for 194H commission', () => {
      const rate = tdsService.getTDSRate('194H', 'commission');
      expect(rate).toBe(5.0);
    });

    test('should return default rate for 194I when type not specified', () => {
      const rate = tdsService.getTDSRate('194I');
      expect(rate).toBe(10.0); // Should default to land_building
    });

    test('should return first available rate when deductee type not found', () => {
      const rate = tdsService.getTDSRate('194C', 'unknown_type');
      expect(rate).toBeDefined();
      expect(typeof rate).toBe('number');
    });

    test('should return null for invalid section code', () => {
      const rate = tdsService.getTDSRate('194X', 'individual');
      expect(rate).toBeNull();
    });
  });

  describe('getTDSThreshold', () => {
    test('should return correct threshold for 194C', () => {
      const threshold = tdsService.getTDSThreshold('194C');
      expect(threshold).toBe(30000);
    });

    test('should return correct aggregate threshold for 194C', () => {
      const threshold = tdsService.getTDSThreshold('194C', 'aggregateThreshold');
      expect(threshold).toBe(100000);
    });

    test('should return correct threshold for 194I', () => {
      const threshold = tdsService.getTDSThreshold('194I');
      expect(threshold).toBe(240000);
    });

    test('should return correct threshold for 194J', () => {
      const threshold = tdsService.getTDSThreshold('194J');
      expect(threshold).toBe(30000);
    });

    test('should return correct threshold for 194H', () => {
      const threshold = tdsService.getTDSThreshold('194H');
      expect(threshold).toBe(15000);
    });

    test('should return null for invalid section code', () => {
      const threshold = tdsService.getTDSThreshold('194X');
      expect(threshold).toBeNull();
    });
  });

  describe('isTDSApplicable', () => {
    test('should return true when amount exceeds threshold for 194C', () => {
      const applicable = tdsService.isTDSApplicable('194C', 50000);
      expect(applicable).toBe(true);
    });

    test('should return true when amount equals threshold for 194C', () => {
      const applicable = tdsService.isTDSApplicable('194C', 30000);
      expect(applicable).toBe(true);
    });

    test('should return false when amount is below threshold for 194C', () => {
      const applicable = tdsService.isTDSApplicable('194C', 25000);
      expect(applicable).toBe(false);
    });

    test('should return true when amount exceeds threshold for 194I', () => {
      const applicable = tdsService.isTDSApplicable('194I', 250000);
      expect(applicable).toBe(true);
    });

    test('should return false when amount is below threshold for 194I', () => {
      const applicable = tdsService.isTDSApplicable('194I', 200000);
      expect(applicable).toBe(false);
    });

    test('should return true when amount exceeds threshold for 194J', () => {
      const applicable = tdsService.isTDSApplicable('194J', 50000);
      expect(applicable).toBe(true);
    });

    test('should return false when amount is below threshold for 194J', () => {
      const applicable = tdsService.isTDSApplicable('194J', 25000);
      expect(applicable).toBe(false);
    });

    test('should return true when amount exceeds threshold for 194H', () => {
      const applicable = tdsService.isTDSApplicable('194H', 20000);
      expect(applicable).toBe(true);
    });

    test('should return false when amount is below threshold for 194H', () => {
      const applicable = tdsService.isTDSApplicable('194H', 10000);
      expect(applicable).toBe(false);
    });

    test('should return false for invalid section code', () => {
      const applicable = tdsService.isTDSApplicable('194X', 50000);
      expect(applicable).toBe(false);
    });
  });

  describe('Section configuration completeness', () => {
    test('all sections should have required fields', () => {
      const sections = tdsService.getTDSSections();
      Object.keys(sections).forEach(sectionCode => {
        const section = sections[sectionCode];
        expect(section).toHaveProperty('code');
        expect(section).toHaveProperty('description');
        expect(section).toHaveProperty('applicableTo');
        expect(section).toHaveProperty('rates');
        expect(section).toHaveProperty('threshold');
        expect(section).toHaveProperty('aggregateThreshold');
        expect(section).toHaveProperty('notes');
      });
    });

    test('all sections should have valid rates', () => {
      const sections = tdsService.getTDSSections();
      Object.keys(sections).forEach(sectionCode => {
        const section = sections[sectionCode];
        expect(section.rates).toBeDefined();
        expect(typeof section.rates).toBe('object');
        
        // Check that at least one rate is defined
        const rateValues = Object.values(section.rates);
        expect(rateValues.length).toBeGreaterThan(0);
        
        // Check that all rates are numbers
        rateValues.forEach(rate => {
          expect(typeof rate).toBe('number');
          expect(rate).toBeGreaterThan(0);
        });
      });
    });

    test('all sections should have valid thresholds', () => {
      const sections = tdsService.getTDSSections();
      Object.keys(sections).forEach(sectionCode => {
        const section = sections[sectionCode];
        expect(typeof section.threshold).toBe('number');
        expect(section.threshold).toBeGreaterThan(0);
        expect(typeof section.aggregateThreshold).toBe('number');
        expect(section.aggregateThreshold).toBeGreaterThan(0);
      });
    });
  });
});

describe('TDS Service - createTDSEntry Method (Task 9.3)', () => {
  let mockCtx;
  let mockVoucher;
  let mockPartyLedger;
  let mockTDSDetail;
  let mockTDSPayableLedger;
  let mockAccountGroup;

  beforeEach(() => {
    // Mock party ledger
    mockPartyLedger = {
      id: 'ledger-123',
      ledger_name: 'ABC Contractors',
      name: 'ABC Contractors',
      pan: 'ABCDE1234F',
    };

    // Mock voucher
    mockVoucher = {
      id: 'voucher-123',
      voucher_number: 'PINV-001',
      voucher_date: new Date('2024-05-15'),
      total_amount: 50000,
      party_ledger_id: 'ledger-123',
      partyLedger: mockPartyLedger,
    };

    // Mock TDS detail
    mockTDSDetail = {
      id: 'tds-detail-123',
      voucher_id: 'voucher-123',
      section_code: '194C',
      tds_rate: 1.0,
      taxable_amount: 50000,
      tds_amount: 500,
      deductee_pan: 'ABCDE1234F',
      deductee_name: 'ABC Contractors',
      quarter: 'Q1-2024',
      financial_year: '2024-2025',
      tenant_id: 'tenant-123',
      update: jest.fn().mockResolvedValue(true),
    };

    // Mock TDS Payable ledger
    mockTDSPayableLedger = {
      id: 'tds-payable-ledger-123',
      ledger_name: 'TDS Payable - 194C',
      ledger_code: 'TDS_PAYABLE_194C',
    };

    // Mock account group
    mockAccountGroup = {
      id: 'group-dt-123',
      group_code: 'DT',
      group_name: 'Duties & Taxes',
    };

    // Mock context
    mockCtx = {
      tenant_id: 'tenant-123',
      tenantModels: {
        Voucher: {
          findByPk: jest.fn().mockResolvedValue(mockVoucher),
        },
        TDSDetail: {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockTDSDetail),
        },
        Ledger: {
          findOne: jest.fn().mockResolvedValue(mockTDSPayableLedger),
          create: jest.fn().mockResolvedValue(mockTDSPayableLedger),
        },
        VoucherLedgerEntry: {
          bulkCreate: jest.fn().mockResolvedValue([
            {
              id: 'entry-1',
              voucher_id: 'voucher-123',
              ledger_id: 'tds-payable-ledger-123',
              debit_amount: 0,
              credit_amount: 500,
            },
          ]),
        },
      },
      masterModels: {
        AccountGroup: {
          findOne: jest.fn().mockResolvedValue(mockAccountGroup),
        },
      },
    };
  });

  describe('createTDSEntry - Basic Functionality', () => {
    test('should create TDS entry with correct data', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      const result = await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(result).toBeDefined();
      expect(result.tdsDetail).toBeDefined();
      expect(result.ledgerEntries).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    test('should create TDS detail record with correct fields', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          voucher_id: 'voucher-123',
          section_code: '194C',
          tds_rate: 1.0,
          taxable_amount: 50000,
          tds_amount: 500,
          deductee_pan: 'ABCDE1234F',
          deductee_name: 'ABC Contractors',
          tenant_id: 'tenant-123',
        })
      );
    });

    test('should create TDS payable ledger entry', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.VoucherLedgerEntry.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            voucher_id: 'voucher-123',
            ledger_id: 'tds-payable-ledger-123',
            debit_amount: 0,
            credit_amount: 500,
            tenant_id: 'tenant-123',
          }),
        ])
      );
    });

    test('should return summary with correct amounts', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      const result = await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(result.summary).toEqual({
        grossAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        tdsRate: 1.0,
        sectionCode: '194C',
      });
    });
  });

  describe('createTDSEntry - Update Existing TDS Detail', () => {
    test('should update existing TDS detail instead of creating new one', async () => {
      // Mock existing TDS detail
      mockCtx.tenantModels.TDSDetail.findOne.mockResolvedValue(mockTDSDetail);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockTDSDetail.update).toHaveBeenCalled();
      expect(mockCtx.tenantModels.TDSDetail.create).not.toHaveBeenCalled();
    });
  });

  describe('createTDSEntry - Validation', () => {
    test('should throw error when voucher ID is missing', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await expect(
        tdsService.createTDSEntry(mockCtx, null, tdsCalculation)
      ).rejects.toThrow('Voucher ID is required');
    });

    test('should throw error when TDS calculation is missing', async () => {
      await expect(
        tdsService.createTDSEntry(mockCtx, 'voucher-123', null)
      ).rejects.toThrow('Valid TDS calculation is required');
    });

    test('should throw error when TDS amount is missing', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        deducteePAN: 'ABCDE1234F',
      };

      await expect(
        tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation)
      ).rejects.toThrow('Valid TDS calculation is required');
    });

    test('should throw error when voucher not found', async () => {
      mockCtx.tenantModels.Voucher.findByPk.mockResolvedValue(null);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await expect(
        tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation)
      ).rejects.toThrow('Voucher not found');
    });

    test('should throw error when party ledger not found', async () => {
      mockVoucher.partyLedger = null;
      mockCtx.tenantModels.Voucher.findByPk.mockResolvedValue(mockVoucher);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await expect(
        tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation)
      ).rejects.toThrow('Party ledger not found');
    });
  });

  describe('createTDSEntry - Quarter and Financial Year', () => {
    test('should calculate correct quarter for Q1 (April-June)', async () => {
      mockVoucher.voucher_date = new Date('2024-05-15');
      mockCtx.tenantModels.Voucher.findByPk.mockResolvedValue(mockVoucher);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quarter: 'Q1-2024',
          financial_year: '2024-2025',
        })
      );
    });

    test('should calculate correct quarter for Q2 (July-September)', async () => {
      mockVoucher.voucher_date = new Date('2024-08-15');
      mockCtx.tenantModels.Voucher.findByPk.mockResolvedValue(mockVoucher);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quarter: 'Q2-2024',
          financial_year: '2024-2025',
        })
      );
    });

    test('should calculate correct financial year for April onwards', async () => {
      mockVoucher.voucher_date = new Date('2024-04-01');
      mockCtx.tenantModels.Voucher.findByPk.mockResolvedValue(mockVoucher);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          financial_year: '2024-2025',
        })
      );
    });

    test('should calculate correct financial year for January-March', async () => {
      mockVoucher.voucher_date = new Date('2024-02-15');
      mockCtx.tenantModels.Voucher.findByPk.mockResolvedValue(mockVoucher);

      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quarter: 'Q4-2024',
          financial_year: '2023-2024',
        })
      );
    });
  });

  describe('createTDSEntry - Custom Deductee Name', () => {
    test('should use custom deductee name when provided', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      const options = {
        deducteeName: 'Custom Contractor Name',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation, options);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deductee_name: 'Custom Contractor Name',
        })
      );
    });

    test('should use party ledger name when custom name not provided', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deductee_name: 'ABC Contractors',
        })
      );
    });
  });

  describe('createTDSEntry - Different TDS Sections', () => {
    test('should create TDS entry for section 194J', async () => {
      const tdsCalculation = {
        sectionCode: '194J',
        tdsRate: 10.0,
        taxableAmount: 50000,
        tdsAmount: 5000,
        netAmount: 45000,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          section_code: '194J',
          tds_rate: 10.0,
          tds_amount: 5000,
        })
      );
    });

    test('should create TDS entry for section 194H', async () => {
      const tdsCalculation = {
        sectionCode: '194H',
        tdsRate: 5.0,
        taxableAmount: 20000,
        tdsAmount: 1000,
        netAmount: 19000,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          section_code: '194H',
          tds_rate: 5.0,
          tds_amount: 1000,
        })
      );
    });

    test('should create TDS entry for section 194I', async () => {
      const tdsCalculation = {
        sectionCode: '194I',
        tdsRate: 10.0,
        taxableAmount: 300000,
        tdsAmount: 30000,
        netAmount: 270000,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.TDSDetail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          section_code: '194I',
          tds_rate: 10.0,
          tds_amount: 30000,
        })
      );
    });
  });

  describe('createTDSEntry - Ledger Entry Narration', () => {
    test('should include section code and rate in narration', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.VoucherLedgerEntry.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            narration: expect.stringContaining('TDS 194C @ 1%'),
          }),
        ])
      );
    });

    test('should include party name in narration', async () => {
      const tdsCalculation = {
        sectionCode: '194C',
        tdsRate: 1.0,
        taxableAmount: 50000,
        tdsAmount: 500,
        netAmount: 49500,
        deducteePAN: 'ABCDE1234F',
      };

      await tdsService.createTDSEntry(mockCtx, 'voucher-123', tdsCalculation);

      expect(mockCtx.tenantModels.VoucherLedgerEntry.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            narration: expect.stringContaining('ABC Contractors'),
          }),
        ])
      );
    });
  });
});


describe('TDS Service - generateTDSCertificate Method (Task 9.4)', () => {
  let mockCtx;
  let mockTDSDetail;
  let mockVoucher;
  let mockPartyLedger;
  let mockCompany;

  beforeEach(() => {
    // Mock party ledger
    mockPartyLedger = {
      id: 'ledger-123',
      ledger_name: 'ABC Contractors',
      name: 'ABC Contractors',
      pan: 'ABCDE1234F',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    };

    // Mock voucher
    mockVoucher = {
      id: 'voucher-123',
      voucher_number: 'PINV-001',
      voucher_date: new Date('2024-05-15'),
      total_amount: 50000,
      party_ledger_id: 'ledger-123',
      partyLedger: mockPartyLedger,
    };

    // Mock TDS detail
    mockTDSDetail = {
      id: 'tds-detail-123',
      voucher_id: 'voucher-123',
      section_code: '194C',
      tds_rate: 1.0,
      taxable_amount: 50000,
      tds_amount: 500,
      deductee_pan: 'ABCDE1234F',
      deductee_name: 'ABC Contractors',
      quarter: 'Q1-2024',
      financial_year: '2024-2025',
      tenant_id: 'tenant-123',
      certificate_no: null,
      certificate_date: null,
      voucher: mockVoucher,
      update: jest.fn().mockResolvedValue(true),
    };

    // Mock company
    mockCompany = {
      company_name: 'Test Company Ltd',
      name: 'Test Company Ltd',
      pan: 'AAAAA1111A',
      tan: 'DELA12345E',
      registered_address: '456 Business Park, Delhi',
      address: '456 Business Park, Delhi',
    };

    // Mock context
    mockCtx = {
      tenant_id: 'tenant-123',
      company: mockCompany,
      tenantModels: {
        TDSDetail: {
          findByPk: jest.fn().mockResolvedValue(mockTDSDetail),
          findAll: jest.fn().mockResolvedValue([]),
        },
        Sequelize: {
          Op: {
            ne: Symbol('ne'),
          },
        },
      },
    };
  });

  describe('generateTDSCertificate - Basic Functionality', () => {
    test('should generate TDS certificate with all mandatory fields', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result).toBeDefined();
      expect(result.certificate).toBeDefined();
      expect(result.certificateNumber).toBeDefined();
      expect(result.certificateDate).toBeDefined();
      expect(result.tdsDetail).toBeDefined();
    });

    test('should include certificate type as Form 16A', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.certificate_type).toBe('Form 16A');
    });

    test('should include financial year and quarter', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.financial_year).toBe('2024-2025');
      expect(result.certificate.quarter).toBe('Q1-2024');
    });

    test('should include deductor details with PAN and TAN', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductor).toBeDefined();
      expect(result.certificate.deductor.name).toBe('Test Company Ltd');
      expect(result.certificate.deductor.pan).toBe('AAAAA1111A');
      expect(result.certificate.deductor.tan).toBe('DELA12345E');
      expect(result.certificate.deductor.address).toBe('456 Business Park, Delhi');
    });

    test('should include deductee details with PAN', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee).toBeDefined();
      expect(result.certificate.deductee.name).toBe('ABC Contractors');
      expect(result.certificate.deductee.pan).toBe('ABCDE1234F');
      expect(result.certificate.deductee.address).toContain('Mumbai');
      expect(result.certificate.deductee.address).toContain('Maharashtra');
    });

    test('should include TDS transaction details with section and amounts', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_details).toBeDefined();
      expect(result.certificate.tds_details.section_code).toBe('194C');
      expect(result.certificate.tds_details.section_description).toBe('Payment to contractors and sub-contractors');
      expect(result.certificate.tds_details.tds_rate).toBe(1.0);
      expect(result.certificate.tds_details.taxable_amount).toBe(50000);
      expect(result.certificate.tds_details.tds_amount).toBe(500);
      expect(result.certificate.tds_details.voucher_number).toBe('PINV-001');
    });

    test('should include issued date', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.issued_date).toBeDefined();
      expect(new Date(result.certificate.issued_date)).toBeInstanceOf(Date);
    });

    test('should include metadata with IDs', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_detail_id).toBe('tds-detail-123');
      expect(result.certificate.voucher_id).toBe('voucher-123');
    });
  });

  describe('generateTDSCertificate - Sequential Certificate Number', () => {
    test('should generate certificate number with format TDS/FY/QUARTER/SEQUENCE', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toMatch(/^TDS\/\d{4}-\d{2}\/Q\d-\d{4}\/\d{4}$/);
    });

    test('should generate first certificate number as 0001', async () => {
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([]);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toContain('/0001');
    });

    test('should increment certificate number sequentially', async () => {
      // Mock existing certificate
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([
        { certificate_no: 'TDS/2024-25/Q1-2024/0001' },
      ]);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toContain('/0002');
    });

    test('should handle multiple existing certificates', async () => {
      // Mock existing certificates
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([
        { certificate_no: 'TDS/2024-25/Q1-2024/0005' },
      ]);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toContain('/0006');
    });

    test('should pad sequence number to 4 digits', async () => {
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([
        { certificate_no: 'TDS/2024-25/Q1-2024/0099' },
      ]);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toBe('TDS/2024-25/Q1-2024/0100');
    });

    test('should generate separate sequences for different quarters', async () => {
      // Mock existing certificate in Q1
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([]);

      // Generate certificate for Q2
      mockTDSDetail.quarter = 'Q2-2024';
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toContain('Q2-2024/0001');
    });

    test('should generate separate sequences for different financial years', async () => {
      // Mock existing certificate in FY 2024-25
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([]);

      // Generate certificate for FY 2025-26
      mockTDSDetail.financial_year = '2025-2026';
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toContain('2025-26');
      expect(result.certificateNumber).toContain('/0001');
    });
  });

  describe('generateTDSCertificate - Update TDS Detail', () => {
    test('should update TDS detail with certificate number', async () => {
      await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(mockTDSDetail.update).toHaveBeenCalledWith(
        expect.objectContaining({
          certificate_no: expect.stringMatching(/^TDS\//),
        })
      );
    });

    test('should update TDS detail with certificate date', async () => {
      await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(mockTDSDetail.update).toHaveBeenCalledWith(
        expect.objectContaining({
          certificate_date: expect.any(Date),
        })
      );
    });

    test('should set certificate date to current date', async () => {
      const beforeDate = new Date();
      await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');
      const afterDate = new Date();

      const updateCall = mockTDSDetail.update.mock.calls[0][0];
      const certificateDate = updateCall.certificate_date;

      expect(certificateDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      expect(certificateDate.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });
  });

  describe('generateTDSCertificate - Validation', () => {
    test('should throw error when TDS detail ID is missing', async () => {
      await expect(
        tdsService.generateTDSCertificate(mockCtx, null)
      ).rejects.toThrow('TDS detail ID is required');
    });

    test('should throw error when TDS detail not found', async () => {
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(null);

      await expect(
        tdsService.generateTDSCertificate(mockCtx, 'invalid-id')
      ).rejects.toThrow('TDS detail not found');
    });

    test('should throw error when voucher not found', async () => {
      mockTDSDetail.voucher = null;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      await expect(
        tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123')
      ).rejects.toThrow('Voucher not found');
    });

    test('should throw error when party ledger not found', async () => {
      mockVoucher.partyLedger = null;
      mockTDSDetail.voucher = mockVoucher;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      await expect(
        tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123')
      ).rejects.toThrow('Party ledger not found');
    });
  });

  describe('generateTDSCertificate - Different TDS Sections', () => {
    test('should generate certificate for section 194J', async () => {
      mockTDSDetail.section_code = '194J';
      mockTDSDetail.tds_rate = 10.0;
      mockTDSDetail.taxable_amount = 50000;
      mockTDSDetail.tds_amount = 5000;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_details.section_code).toBe('194J');
      expect(result.certificate.tds_details.section_description).toBe('Payment for professional or technical services');
      expect(result.certificate.tds_details.tds_rate).toBe(10.0);
      expect(result.certificate.tds_details.tds_amount).toBe(5000);
    });

    test('should generate certificate for section 194H', async () => {
      mockTDSDetail.section_code = '194H';
      mockTDSDetail.tds_rate = 5.0;
      mockTDSDetail.taxable_amount = 20000;
      mockTDSDetail.tds_amount = 1000;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_details.section_code).toBe('194H');
      expect(result.certificate.tds_details.section_description).toBe('Payment of commission or brokerage');
      expect(result.certificate.tds_details.tds_rate).toBe(5.0);
      expect(result.certificate.tds_details.tds_amount).toBe(1000);
    });

    test('should generate certificate for section 194I', async () => {
      mockTDSDetail.section_code = '194I';
      mockTDSDetail.tds_rate = 10.0;
      mockTDSDetail.taxable_amount = 300000;
      mockTDSDetail.tds_amount = 30000;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_details.section_code).toBe('194I');
      expect(result.certificate.tds_details.section_description).toBe('Payment of rent');
      expect(result.certificate.tds_details.tds_rate).toBe(10.0);
      expect(result.certificate.tds_details.tds_amount).toBe(30000);
    });
  });

  describe('generateTDSCertificate - Address Formatting', () => {
    test('should format complete address with all fields', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee.address).toBe('123 Main Street, Mumbai, Maharashtra, 400001');
    });

    test('should handle partial address with missing fields', async () => {
      mockPartyLedger.address = '123 Main Street';
      mockPartyLedger.city = null;
      mockPartyLedger.state = 'Maharashtra';
      mockPartyLedger.pincode = null;
      mockVoucher.partyLedger = mockPartyLedger;
      mockTDSDetail.voucher = mockVoucher;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee.address).toBe('123 Main Street, Maharashtra');
    });

    test('should handle empty address', async () => {
      mockPartyLedger.address = null;
      mockPartyLedger.city = null;
      mockPartyLedger.state = null;
      mockPartyLedger.pincode = null;
      mockVoucher.partyLedger = mockPartyLedger;
      mockTDSDetail.voucher = mockVoucher;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee.address).toBe('');
    });
  });

  describe('generateTDSCertificate - Edge Cases', () => {
    test('should handle missing company details gracefully', async () => {
      mockCtx.company = {};

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductor.name).toBe('');
      expect(result.certificate.deductor.pan).toBe('');
      expect(result.certificate.deductor.tan).toBe('');
      expect(result.certificate.deductor.address).toBe('');
    });

    test('should handle missing deductee name', async () => {
      mockTDSDetail.deductee_name = null;
      mockPartyLedger.ledger_name = null;
      mockPartyLedger.name = null;
      mockVoucher.partyLedger = mockPartyLedger;
      mockTDSDetail.voucher = mockVoucher;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee.name).toBe('');
    });

    test('should handle missing deductee PAN', async () => {
      mockTDSDetail.deductee_pan = null;
      mockPartyLedger.pan = null;
      mockVoucher.partyLedger = mockPartyLedger;
      mockTDSDetail.voucher = mockVoucher;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee.pan).toBe('');
    });

    test('should handle decimal amounts correctly', async () => {
      mockTDSDetail.taxable_amount = 50000.50;
      mockTDSDetail.tds_amount = 500.01;
      mockCtx.tenantModels.TDSDetail.findByPk.mockResolvedValue(mockTDSDetail);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_details.taxable_amount).toBe(50000.50);
      expect(result.certificate.tds_details.tds_amount).toBe(500.01);
    });

    test('should handle large certificate sequence numbers', async () => {
      mockCtx.tenantModels.TDSDetail.findAll.mockResolvedValue([
        { certificate_no: 'TDS/2024-25/Q1-2024/9999' },
      ]);

      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificateNumber).toBe('TDS/2024-25/Q1-2024/10000');
    });
  });

  describe('generateTDSCertificate - Return Object Structure', () => {
    test('should return object with all required fields', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result).toHaveProperty('certificate');
      expect(result).toHaveProperty('tdsDetail');
      expect(result).toHaveProperty('certificateNumber');
      expect(result).toHaveProperty('certificateDate');
    });

    test('should return certificate with all mandatory sections', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate).toHaveProperty('certificate_type');
      expect(result.certificate).toHaveProperty('certificate_number');
      expect(result.certificate).toHaveProperty('certificate_date');
      expect(result.certificate).toHaveProperty('financial_year');
      expect(result.certificate).toHaveProperty('quarter');
      expect(result.certificate).toHaveProperty('deductor');
      expect(result.certificate).toHaveProperty('deductee');
      expect(result.certificate).toHaveProperty('tds_details');
      expect(result.certificate).toHaveProperty('issued_date');
    });

    test('should return deductor with all required fields', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductor).toHaveProperty('name');
      expect(result.certificate.deductor).toHaveProperty('pan');
      expect(result.certificate.deductor).toHaveProperty('tan');
      expect(result.certificate.deductor).toHaveProperty('address');
    });

    test('should return deductee with all required fields', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.deductee).toHaveProperty('name');
      expect(result.certificate.deductee).toHaveProperty('pan');
      expect(result.certificate.deductee).toHaveProperty('address');
    });

    test('should return tds_details with all required fields', async () => {
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-123');

      expect(result.certificate.tds_details).toHaveProperty('section_code');
      expect(result.certificate.tds_details).toHaveProperty('section_description');
      expect(result.certificate.tds_details).toHaveProperty('tds_rate');
      expect(result.certificate.tds_details).toHaveProperty('taxable_amount');
      expect(result.certificate.tds_details).toHaveProperty('tds_amount');
      expect(result.certificate.tds_details).toHaveProperty('voucher_number');
      expect(result.certificate.tds_details).toHaveProperty('voucher_date');
    });
  });
});

// ============================================================================
// Property-Based Tests (Task 9.6)
// ============================================================================

describe('TDS Service - Property-Based Tests', () => {
  describe('Property 25: TDS Calculation Formula', () => {
    // Feature: indian-invoice-system-backend, Property 25: TDS Calculation Formula
    // **Validates: Requirements 4.1**
    test('TDS amount = (taxable_amount × section_rate) / 100 for all valid inputs', () => {
      // Define arbitraries for test data generation
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building', 'plant_machinery');

      // Taxable amount: reasonable range for testing (above thresholds to ensure TDS is calculated)
      const taxableAmountArbitrary = fc.integer({ min: 250000, max: 10000000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            // Calculate TDS using the service
            const result = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Get the expected rate for this section and deductee type
            const expectedRate = tdsService.getTDSRate(sectionCode, deducteeType);

            // Calculate expected TDS amount using the formula: (A × rate) / 100
            const expectedTDSAmount = parseFloat(((taxableAmount * expectedRate) / 100).toFixed(2));

            // Property: TDS amount SHALL equal (taxable_amount × section_rate) / 100
            // Allow for floating point precision (within 0.01 rupee)
            const actualTDSAmount = result.tdsAmount;
            const difference = Math.abs(actualTDSAmount - expectedTDSAmount);

            // Assert the formula holds
            return difference < 0.01 && 
                   result.sectionCode === sectionCode &&
                   result.taxableAmount === parseFloat(taxableAmount.toFixed(2)) &&
                   result.tdsRate === expectedRate &&
                   result.thresholdApplied === false; // Amount is above threshold
          }
        ),
        { numRuns: 100 }
      );
    });

    test('TDS calculation respects section-specific rates', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const taxableAmountArbitrary = fc.integer({ min: 250000, max: 5000000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          validPANArbitrary,
          (taxableAmount, pan) => {
            // Test 194C individual (1%)
            const result194CIndividual = tdsService.calculateTDSAmount(taxableAmount, '194C', pan, 'individual');
            const expected194CIndividual = parseFloat(((taxableAmount * 1.0) / 100).toFixed(2));
            
            // Test 194C company (2%)
            const result194CCompany = tdsService.calculateTDSAmount(taxableAmount, '194C', pan, 'company');
            const expected194CCompany = parseFloat(((taxableAmount * 2.0) / 100).toFixed(2));
            
            // Test 194J professional (10%)
            const result194JProfessional = tdsService.calculateTDSAmount(taxableAmount, '194J', pan, 'professional');
            const expected194JProfessional = parseFloat(((taxableAmount * 10.0) / 100).toFixed(2));
            
            // Test 194H commission (5%)
            const result194HCommission = tdsService.calculateTDSAmount(taxableAmount, '194H', pan, 'commission');
            const expected194HCommission = parseFloat(((taxableAmount * 5.0) / 100).toFixed(2));
            
            // Test 194I land_building (10%)
            const result194ILandBuilding = tdsService.calculateTDSAmount(taxableAmount, '194I', pan, 'land_building');
            const expected194ILandBuilding = parseFloat(((taxableAmount * 10.0) / 100).toFixed(2));

            // Verify all calculations match the formula
            return Math.abs(result194CIndividual.tdsAmount - expected194CIndividual) < 0.01 &&
                   Math.abs(result194CCompany.tdsAmount - expected194CCompany) < 0.01 &&
                   Math.abs(result194JProfessional.tdsAmount - expected194JProfessional) < 0.01 &&
                   Math.abs(result194HCommission.tdsAmount - expected194HCommission) < 0.01 &&
                   Math.abs(result194ILandBuilding.tdsAmount - expected194ILandBuilding) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('TDS calculation produces consistent results for same inputs', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building');
      const taxableAmountArbitrary = fc.integer({ min: 250000, max: 5000000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            // Calculate TDS twice with same inputs
            const result1 = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);
            const result2 = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Property: Same inputs should produce identical results (deterministic)
            return result1.tdsAmount === result2.tdsAmount &&
                   result1.taxableAmount === result2.taxableAmount &&
                   result1.netAmount === result2.netAmount &&
                   result1.tdsRate === result2.tdsRate &&
                   result1.sectionCode === result2.sectionCode;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('TDS net amount = taxable amount - TDS amount for all calculations', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building');
      const taxableAmountArbitrary = fc.integer({ min: 250000, max: 10000000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            const result = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Property: Net amount = Taxable amount - TDS amount
            const expectedNetAmount = parseFloat((result.taxableAmount - result.tdsAmount).toFixed(2));
            const difference = Math.abs(result.netAmount - expectedNetAmount);

            return difference < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 29: TDS Payment Reduction', () => {
    // Feature: indian-invoice-system-backend, Property 29: TDS Payment Reduction
    // **Validates: Requirements 4.6**
    test('net amount = total amount - TDS amount for all purchase invoices', () => {
      // Define arbitraries for test data generation
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building', 'plant_machinery');

      // Taxable amount: above thresholds to ensure TDS is calculated
      const taxableAmountArbitrary = fc.integer({ min: 250000, max: 10000000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            // Calculate TDS using the service
            const result = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Property: For any purchase invoice with TDS amount T and total amount A,
            // the credit to supplier ledger SHALL equal (A - T)
            // This is represented as netAmount in the result
            const expectedNetAmount = parseFloat((taxableAmount - result.tdsAmount).toFixed(2));
            const difference = Math.abs(result.netAmount - expectedNetAmount);

            // Assert the payment reduction formula holds
            return difference < 0.01 && 
                   result.netAmount < taxableAmount && // Net amount should be less than total
                   result.tdsAmount > 0; // TDS should be deducted (above threshold)
          }
        ),
        { numRuns: 100 }
      );
    });

    test('payment reduction applies consistently across all TDS sections', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const taxableAmountArbitrary = fc.integer({ min: 250000, max: 5000000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          validPANArbitrary,
          (taxableAmount, pan) => {
            // Test payment reduction for all sections
            const result194C = tdsService.calculateTDSAmount(taxableAmount, '194C', pan, 'individual');
            const result194J = tdsService.calculateTDSAmount(taxableAmount, '194J', pan, 'professional');
            const result194H = tdsService.calculateTDSAmount(taxableAmount, '194H', pan, 'commission');
            const result194I = tdsService.calculateTDSAmount(taxableAmount, '194I', pan, 'land_building');

            // Verify payment reduction formula for each section
            const check194C = Math.abs(result194C.netAmount - (taxableAmount - result194C.tdsAmount)) < 0.01;
            const check194J = Math.abs(result194J.netAmount - (taxableAmount - result194J.tdsAmount)) < 0.01;
            const check194H = Math.abs(result194H.netAmount - (taxableAmount - result194H.tdsAmount)) < 0.01;
            const check194I = Math.abs(result194I.netAmount - (taxableAmount - result194I.tdsAmount)) < 0.01;

            return check194C && check194J && check194H && check194I;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('payment reduction is zero when TDS is not applicable (below threshold)', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building');

      // Taxable amount: below thresholds to ensure TDS is NOT calculated
      const taxableAmountArbitrary = fc.integer({ min: 1000, max: 14999 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            const result = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Property: When TDS is not applicable (below threshold),
            // net amount should equal total amount (no reduction)
            if (result.thresholdApplied) {
              return result.tdsAmount === 0 && 
                     result.netAmount === taxableAmount;
            }
            
            // If threshold not applied (amount >= threshold), verify reduction
            return result.netAmount === parseFloat((taxableAmount - result.tdsAmount).toFixed(2));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('payment reduction maintains precision for decimal amounts', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building');

      // Use float amounts with decimals
      const taxableAmountArbitrary = fc.float({ min: 250000, max: 1000000, noNaN: true }).map(n => parseFloat(n.toFixed(2)));

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            const result = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Property: Payment reduction should maintain 2 decimal precision
            const expectedNetAmount = parseFloat((taxableAmount - result.tdsAmount).toFixed(2));
            const difference = Math.abs(result.netAmount - expectedNetAmount);

            // Verify precision is maintained (within 0.01 rupee)
            // Note: Integer amounts may not have decimal places, which is acceptable
            const decimalPlaces = result.netAmount.toString().split('.')[1]?.length || 0;
            return difference < 0.01 && decimalPlaces <= 2;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 27: TDS Threshold Application', () => {
    // Feature: indian-invoice-system-backend, Property 27: TDS Threshold Application
    // **Validates: Requirements 4.3**
    test('TDS is deducted if and only if taxable amount >= section threshold', () => {
      // Define arbitraries for test data generation
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building', 'plant_machinery');

      // Taxable amount: wide range to test both above and below thresholds
      const taxableAmountArbitrary = fc.integer({ min: 0, max: 500000 });

      fc.assert(
        fc.property(
          taxableAmountArbitrary,
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (taxableAmount, sectionCode, pan, deducteeType) => {
            // Calculate TDS using the service
            const result = tdsService.calculateTDSAmount(taxableAmount, sectionCode, pan, deducteeType);

            // Get the threshold for this section
            const threshold = tdsService.getTDSThreshold(sectionCode);

            // Property: TDS SHALL be deducted if and only if A >= section_threshold
            if (taxableAmount >= threshold) {
              // Above or equal to threshold: TDS should be deducted
              return result.tdsAmount > 0 && 
                     result.thresholdApplied === false &&
                     result.netAmount < result.taxableAmount;
            } else {
              // Below threshold: TDS should NOT be deducted
              return result.tdsAmount === 0 && 
                     result.thresholdApplied === true &&
                     result.netAmount === result.taxableAmount;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('TDS threshold is correctly applied for each section', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      fc.assert(
        fc.property(
          validPANArbitrary,
          (pan) => {
            // Test 194C threshold (30000)
            const below194C = tdsService.calculateTDSAmount(29999, '194C', pan, 'individual');
            const at194C = tdsService.calculateTDSAmount(30000, '194C', pan, 'individual');
            const above194C = tdsService.calculateTDSAmount(30001, '194C', pan, 'individual');

            // Test 194H threshold (15000)
            const below194H = tdsService.calculateTDSAmount(14999, '194H', pan, 'commission');
            const at194H = tdsService.calculateTDSAmount(15000, '194H', pan, 'commission');
            const above194H = tdsService.calculateTDSAmount(15001, '194H', pan, 'commission');

            // Test 194J threshold (30000)
            const below194J = tdsService.calculateTDSAmount(29999, '194J', pan, 'professional');
            const at194J = tdsService.calculateTDSAmount(30000, '194J', pan, 'professional');
            const above194J = tdsService.calculateTDSAmount(30001, '194J', pan, 'professional');

            // Test 194I threshold (240000)
            const below194I = tdsService.calculateTDSAmount(239999, '194I', pan, 'land_building');
            const at194I = tdsService.calculateTDSAmount(240000, '194I', pan, 'land_building');
            const above194I = tdsService.calculateTDSAmount(240001, '194I', pan, 'land_building');

            // Verify threshold behavior for all sections
            return below194C.tdsAmount === 0 && below194C.thresholdApplied === true &&
                   at194C.tdsAmount > 0 && at194C.thresholdApplied === false &&
                   above194C.tdsAmount > 0 && above194C.thresholdApplied === false &&
                   below194H.tdsAmount === 0 && below194H.thresholdApplied === true &&
                   at194H.tdsAmount > 0 && at194H.thresholdApplied === false &&
                   above194H.tdsAmount > 0 && above194H.thresholdApplied === false &&
                   below194J.tdsAmount === 0 && below194J.thresholdApplied === true &&
                   at194J.tdsAmount > 0 && at194J.thresholdApplied === false &&
                   above194J.tdsAmount > 0 && above194J.thresholdApplied === false &&
                   below194I.tdsAmount === 0 && below194I.thresholdApplied === true &&
                   at194I.tdsAmount > 0 && at194I.thresholdApplied === false &&
                   above194I.tdsAmount > 0 && above194I.thresholdApplied === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('TDS threshold boundary conditions are correctly handled', () => {
      const validPANArbitrary = fc.tuple(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 5, maxLength: 5 }),
        fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 4, maxLength: 4 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ).map(([letters, digits, lastLetter]) => `${letters.join('')}${digits.join('')}${lastLetter}`);

      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      
      const deducteeTypeArbitrary = fc.constantFrom('individual', 'company', 'professional', 'commission', 'land_building');

      fc.assert(
        fc.property(
          sectionArbitrary,
          validPANArbitrary,
          deducteeTypeArbitrary,
          (sectionCode, pan, deducteeType) => {
            const threshold = tdsService.getTDSThreshold(sectionCode);

            // Test exactly at threshold
            const atThreshold = tdsService.calculateTDSAmount(threshold, sectionCode, pan, deducteeType);
            
            // Test one rupee below threshold
            const belowThreshold = tdsService.calculateTDSAmount(threshold - 1, sectionCode, pan, deducteeType);
            
            // Test one rupee above threshold
            const aboveThreshold = tdsService.calculateTDSAmount(threshold + 1, sectionCode, pan, deducteeType);

            // Property: Boundary conditions
            // At threshold: TDS should be deducted
            // Below threshold: TDS should NOT be deducted
            // Above threshold: TDS should be deducted
            return atThreshold.tdsAmount > 0 && atThreshold.thresholdApplied === false &&
                   belowThreshold.tdsAmount === 0 && belowThreshold.thresholdApplied === true &&
                   aboveThreshold.tdsAmount > 0 && aboveThreshold.thresholdApplied === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('isTDSApplicable helper function matches threshold logic', () => {
      const sectionArbitrary = fc.constantFrom('194C', '194I', '194J', '194H');
      const taxableAmountArbitrary = fc.integer({ min: 0, max: 500000 });

      fc.assert(
        fc.property(
          sectionArbitrary,
          taxableAmountArbitrary,
          (sectionCode, taxableAmount) => {
            const threshold = tdsService.getTDSThreshold(sectionCode);
            const isApplicable = tdsService.isTDSApplicable(sectionCode, taxableAmount);

            // Property: isTDSApplicable should return true if and only if amount >= threshold
            return isApplicable === (taxableAmount >= threshold);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
