/**
 * Tests for Composition Dealer Support
 * 
 * Validates that when a company is marked as a composition dealer,
 * sales vouchers automatically default to Bill of Supply.
 */

const VoucherService = require('../voucherService');
const NumberingService = require('../numberingService');
const GSTCalculationService = require('../gstCalculationService');

describe('Composition Dealer Support', () => {
  let mockCtx;
  let mockCompany;
  let mockTenantModels;
  let mockMasterModels;

  beforeEach(() => {
    // Mock company (composition dealer)
    mockCompany = {
      id: 'company-001',
      company_name: 'Test Composition Dealer',
      gstin: '27AABCT1234A1Z5',
      is_composition_dealer: true,
      state: 'Maharashtra'
    };

    // Mock tenant models
    mockTenantModels = {
      Voucher: {
        create: jest.fn().mockResolvedValue({
          id: 'voucher-001',
          voucher_number: 'BOS-2024-0001',
          voucher_type: 'bill_of_supply',
          status: 'draft'
        })
      },
      VoucherItem: {
        bulkCreate: jest.fn().mockResolvedValue([])
      },
      VoucherLedgerEntry: {
        bulkCreate: jest.fn().mockResolvedValue([])
      },
      Ledger: {
        findByPk: jest.fn().mockResolvedValue({
          id: 'ledger-001',
          ledger_name: 'Customer A',
          gstin: null
        }),
        findOne: jest.fn().mockResolvedValue({
          id: 'ledger-sales-001',
          ledger_name: 'Sales',
          ledger_code: 'SALES'
        }),
        create: jest.fn().mockResolvedValue({
          id: 'ledger-new-001',
          ledger_name: 'New Ledger',
          ledger_code: 'NEW'
        })
      },
      sequelize: {
        transaction: jest.fn().mockResolvedValue({
          commit: jest.fn(),
          rollback: jest.fn()
        })
      }
    };

    // Mock master models
    mockMasterModels = {
      AccountGroup: {
        findOne: jest.fn().mockResolvedValue({
          id: 'group-001',
          group_code: 'SALES'
        })
      }
    };

    // Mock context
    mockCtx = {
      tenantModels: mockTenantModels,
      masterModels: mockMasterModels,
      company: mockCompany,
      tenant_id: 'tenant-001'
    };

    // Mock NumberingService
    NumberingService.context = { tenantModels: mockTenantModels };
    NumberingService.generateVoucherNumber = jest.fn().mockResolvedValue({
      voucherNumber: 'BOS-2024-0001',
      seriesId: 'series-001',
      sequence: 1
    });

    // Mock GSTCalculationService
    GSTCalculationService.calculateVoucherGST = jest.fn().mockReturnValue({
      subtotal: 10000,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      roundOff: 0,
      grandTotal: 10000,
      itemBreakdowns: []
    });
  });

  describe('Voucher Type Defaulting', () => {
    it('should default sales voucher to Bill of Supply for composition dealer', async () => {
      const voucherData = {
        voucher_type: 'sales',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Exempt Item',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 1000,
            gst_rate: 0
          }
        ]
      };

      // Mock getVoucher to return the created voucher
      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'BOS-2024-0001',
        voucher_type: 'bill_of_supply',
        status: 'draft'
      });

      const result = await VoucherService.createVoucher(mockCtx, voucherData);

      // Verify voucher type was changed to bill_of_supply
      expect(result.voucher_type).toBe('bill_of_supply');
      expect(NumberingService.generateVoucherNumber).toHaveBeenCalledWith(
        'tenant-001',
        'bill_of_supply',
        undefined,
        undefined,
        'company-001'
      );
    });

    it('should default sales_invoice to Bill of Supply for composition dealer', async () => {
      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Exempt Item',
            hsn_sac_code: '1001',
            quantity: 5,
            rate: 2000,
            gst_rate: 0
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'BOS-2024-0001',
        voucher_type: 'bill_of_supply',
        status: 'draft'
      });

      const result = await VoucherService.createVoucher(mockCtx, voucherData);

      expect(result.voucher_type).toBe('bill_of_supply');
    });

    it('should default tax_invoice to Bill of Supply for composition dealer', async () => {
      const voucherData = {
        voucher_type: 'tax_invoice',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Exempt Item',
            hsn_sac_code: '1001',
            quantity: 3,
            rate: 3000,
            gst_rate: 0
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'BOS-2024-0001',
        voucher_type: 'bill_of_supply',
        status: 'draft'
      });

      const result = await VoucherService.createVoucher(mockCtx, voucherData);

      expect(result.voucher_type).toBe('bill_of_supply');
    });

    it('should NOT change voucher type for non-composition dealer', async () => {
      // Change company to non-composition dealer
      mockCtx.company.is_composition_dealer = false;

      // Mock party ledger WITH GSTIN to prevent retail invoice classification
      mockTenantModels.Ledger.findByPk.mockResolvedValue({
        id: 'ledger-001',
        ledger_name: 'Customer A',
        gstin: '27AABCU9603R1ZM', // Has GSTIN - prevents retail classification
        state: 'Maharashtra'
      });

      const voucherData = {
        voucher_type: 'sales',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Taxable Item',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      // Mock for regular sales invoice
      GSTCalculationService.calculateVoucherGST = jest.fn().mockReturnValue({
        subtotal: 10000,
        totalCGST: 900,
        totalSGST: 900,
        totalIGST: 0,
        totalCess: 0,
        roundOff: 0,
        grandTotal: 11800,
        itemBreakdowns: []
      });

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'INV-2024-0001',
        voucher_type: 'sales',
        status: 'draft'
      });

      NumberingService.generateVoucherNumber = jest.fn().mockResolvedValue({
        voucherNumber: 'INV-2024-0001',
        seriesId: 'series-002',
        sequence: 1
      });

      const result = await VoucherService.createVoucher(mockCtx, voucherData);

      // Verify voucher type remained as sales (because customer has GSTIN)
      expect(result.voucher_type).toBe('sales');
      expect(NumberingService.generateVoucherNumber).toHaveBeenCalledWith(
        'tenant-001',
        'sales',
        undefined,
        undefined,
        'company-001'
      );
    });

    it('should NOT change purchase voucher type for composition dealer', async () => {
      const voucherData = {
        voucher_type: 'purchase',
        voucher_date: new Date(),
        party_ledger_id: 'supplier-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Purchase Item',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'PUR-2024-0001',
        voucher_type: 'purchase',
        status: 'draft'
      });

      NumberingService.generateVoucherNumber = jest.fn().mockResolvedValue({
        voucherNumber: 'PUR-2024-0001',
        seriesId: 'series-003',
        sequence: 1
      });

      const result = await VoucherService.createVoucher(mockCtx, voucherData);

      // Purchase vouchers should not be affected
      expect(result.voucher_type).toBe('purchase');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing company context gracefully', async () => {
      // Remove company from context
      mockCtx.company = null;

      const voucherData = {
        voucher_type: 'sales',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Item',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'INV-2024-0001',
        voucher_type: 'sales',
        status: 'draft'
      });

      NumberingService.generateVoucherNumber = jest.fn().mockResolvedValue({
        voucherNumber: 'INV-2024-0001',
        seriesId: 'series-002',
        sequence: 1
      });

      // Should not throw error, just proceed with original voucher type
      const result = await VoucherService.createVoucher(mockCtx, voucherData);
      expect(result.voucher_type).toBe('sales');
    });

    it('should handle undefined is_composition_dealer flag', async () => {
      // Remove is_composition_dealer flag
      delete mockCtx.company.is_composition_dealer;

      const voucherData = {
        voucher_type: 'sales',
        voucher_date: new Date(),
        party_ledger_id: 'customer-001',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Item',
            hsn_sac_code: '1001',
            quantity: 10,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-001',
        voucher_number: 'INV-2024-0001',
        voucher_type: 'sales',
        status: 'draft'
      });

      NumberingService.generateVoucherNumber = jest.fn().mockResolvedValue({
        voucherNumber: 'INV-2024-0001',
        seriesId: 'series-002',
        sequence: 1
      });

      // Should treat as non-composition dealer
      const result = await VoucherService.createVoucher(mockCtx, voucherData);
      expect(result.voucher_type).toBe('sales');
    });
  });
});
