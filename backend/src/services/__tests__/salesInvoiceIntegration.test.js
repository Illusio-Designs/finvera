/**
 * Integration Test: Complete Sales Invoice Flow
 * 
 * Tests the complete flow of creating a sales invoice with:
 * - Advanced numbering
 * - E-Invoice generation
 * - E-Way Bill generation
 * - Proper data persistence
 * - Ledger entries
 * - Different numbering series
 * 
 * Validates: Requirements 1.1-1.10, 2.1-2.10, 3.1-3.10
 */

const VoucherService = require('../voucherService');
const NumberingService = require('../numberingService');
const EInvoiceService = require('../eInvoiceService');
const EWayBillService = require('../eWayBillService');
const GSTCalculationService = require('../gstCalculationService');

describe('Integration Test: Complete Sales Invoice Flow', () => {
  let mockCtx;
  let mockTenantModels;
  let mockMasterModels;
  let createdVoucherId;

  beforeEach(() => {
    // Reset created voucher ID
    createdVoucherId = null;

    // Mock tenant models
    mockTenantModels = {
      Voucher: {
        create: jest.fn().mockImplementation((data) => {
          createdVoucherId = 'voucher-integration-001';
          return Promise.resolve({
            id: createdVoucherId,
            ...data,
            status: 'draft',
            save: jest.fn().mockResolvedValue(true)
          });
        }),
        findByPk: jest.fn().mockImplementation((id) => {
          if (id === createdVoucherId) {
            return Promise.resolve({
              id: createdVoucherId,
              voucher_number: 'SI-2024-0001',
              voucher_type: 'sales_invoice',
              total_amount: 118000,
              status: 'posted',
              tenant_id: 'tenant-integration-001',
              voucher_items: [
                {
                  item_description: 'Test Product',
                  quantity: 100,
                  rate: 1000,
                  taxable_amount: 100000,
                  gst_rate: 18,
                  cgst_amount: 9000,
                  sgst_amount: 9000,
                  total_amount: 118000
                }
              ],
              partyLedger: {
                ledger_name: 'Test Customer',
                gstin: '27AABCU9603R1ZM',
                state: 'Maharashtra'
              }
            });
          }
          return Promise.resolve(null);
        })
      },
      VoucherItem: {
        bulkCreate: jest.fn().mockResolvedValue([])
      },
      VoucherLedgerEntry: {
        bulkCreate: jest.fn().mockResolvedValue([
          { ledger_id: 'ledger-customer', debit_amount: 118000, credit_amount: 0 },
          { ledger_id: 'ledger-sales', debit_amount: 0, credit_amount: 100000 },
          { ledger_id: 'ledger-cgst', debit_amount: 0, credit_amount: 9000 },
          { ledger_id: 'ledger-sgst', debit_amount: 0, credit_amount: 9000 }
        ])
      },
      Ledger: {
        findByPk: jest.fn().mockResolvedValue({
          id: 'ledger-customer',
          ledger_name: 'Test Customer',
          gstin: '27AABCU9603R1ZM',
          state: 'Maharashtra'
        }),
        findOne: jest.fn().mockResolvedValue({
          id: 'ledger-sales',
          ledger_name: 'Sales',
          ledger_code: 'SALES'
        }),
        create: jest.fn().mockResolvedValue({
          id: 'ledger-new',
          ledger_name: 'New Ledger'
        })
      },
      NumberingSeries: {
        findOne: jest.fn().mockResolvedValue({
          id: 'series-001',
          tenant_id: 'tenant-integration-001',
          voucher_type: 'sales_invoice',
          prefix: 'SI',
          format: 'PREFIX-YEAR-SEQUENCE',
          separator: '-',
          sequence_length: 4,
          current_sequence: 0,
          start_number: 1,
          is_default: true,
          is_active: true,
          update: jest.fn().mockResolvedValue(true)
        })
      },
      NumberingHistory: {
        create: jest.fn().mockResolvedValue({
          id: 'history-001',
          series_id: 'series-001',
          voucher_id: createdVoucherId,
          generated_number: 'SI-2024-0001',
          sequence_used: 1
        })
      },
      EInvoice: {
        create: jest.fn().mockResolvedValue({
          id: 'einvoice-001',
          voucher_id: createdVoucherId,
          irn: 'test-irn-123456789',
          ack_no: 'ACK123456',
          ack_date: new Date(),
          signed_invoice: 'signed-invoice-data',
          signed_qr_code: 'qr-code-data',
          status: 'generated',
          tenant_id: 'tenant-integration-001'
        }),
        findOne: jest.fn().mockResolvedValue(null)
      },
      EWayBill: {
        create: jest.fn().mockResolvedValue({
          id: 'ewaybill-001',
          voucher_id: createdVoucherId,
          ewb_no: '123456789012',
          ewb_date: new Date(),
          valid_upto: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'active',
          vehicle_no: 'MH01AB1234',
          transporter_id: '27AABCT1234A1Z5',
          transport_mode: 'road',
          distance: 200,
          tenant_id: 'tenant-integration-001'
        }),
        findOne: jest.fn().mockResolvedValue(null)
      },
      sequelize: {
        transaction: jest.fn().mockResolvedValue({
          commit: jest.fn(),
          rollback: jest.fn(),
          LOCK: { UPDATE: 'UPDATE' }
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
      tenant_id: 'tenant-integration-001',
      company: {
        id: 'company-001',
        company_name: 'Test Company',
        gstin: '27AABCT1234A1Z5',
        state: 'Maharashtra'
      }
    };

    // Set context for services
    NumberingService.setContext({ tenantModels: mockTenantModels });
  });

  describe('Complete Sales Invoice Flow', () => {
    it('should create sales invoice with advanced numbering', async () => {
      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date('2025-05-15'),
        party_ledger_id: 'ledger-customer',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Test Product',
            hsn_sac_code: '1001',
            quantity: 100,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      // Mock getVoucher to return the created voucher
      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: createdVoucherId,
        voucher_number: 'SI-2024-0001',
        voucher_type: 'sales_invoice',
        total_amount: 118000,
        status: 'draft'
      });

      const result = await VoucherService.createVoucher(mockCtx, voucherData);

      // Verify voucher was created
      expect(result).toBeDefined();
      expect(result.voucher_number).toBe('SI-2024-0001');
      expect(result.voucher_type).toBe('sales_invoice');

      // Verify numbering service was called
      expect(mockTenantModels.NumberingSeries.findOne).toHaveBeenCalled();
      expect(mockTenantModels.NumberingHistory.create).toHaveBeenCalled();

      // Verify voucher was created in database
      expect(mockTenantModels.Voucher.create).toHaveBeenCalled();
      expect(mockTenantModels.VoucherItem.bulkCreate).toHaveBeenCalled();
    });

    it('should generate E-Invoice for the sales invoice', async () => {
      // First create the voucher
      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date('2025-05-15'),
        party_ledger_id: 'ledger-customer',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Test Product',
            hsn_sac_code: '1001',
            quantity: 100,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-integration-001',
        voucher_number: 'SI-2024-0001',
        voucher_type: 'sales_invoice',
        total_amount: 118000,
        status: 'posted'
      });

      await VoucherService.createVoucher(mockCtx, voucherData);

      // Now generate E-Invoice
      // Mock IRP client
      const mockIRPClient = {
        generateEInvoice: jest.fn().mockResolvedValue({
          irn: 'test-irn-123456789',
          ackNo: 'ACK123456',
          ackDate: new Date().toISOString(),
          signedInvoice: 'signed-invoice-data',
          signedQRCode: 'qr-code-data'
        })
      };

      EInvoiceService.irpClient = mockIRPClient;

      const eInvoiceResult = await EInvoiceService.generateEInvoice(mockCtx, 'voucher-integration-001');

      // Verify E-Invoice was created
      expect(eInvoiceResult).toBeDefined();
      expect(eInvoiceResult.irn).toBe('test-irn-123456789');
      expect(eInvoiceResult.status).toBe('generated');

      // Verify E-Invoice was stored in database
      expect(mockTenantModels.EInvoice.create).toHaveBeenCalled();
      const eInvoiceCreateArgs = mockTenantModels.EInvoice.create.mock.calls[0][0];
      expect(eInvoiceCreateArgs.voucher_id).toBe('voucher-integration-001');
      expect(eInvoiceCreateArgs.tenant_id).toBe('tenant-integration-001');
    });

    it('should generate E-Way Bill for the sales invoice', async () => {
      // First create the voucher
      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date('2025-05-15'),
        party_ledger_id: 'ledger-customer',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Test Product',
            hsn_sac_code: '1001',
            quantity: 100,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-integration-001',
        voucher_number: 'SI-2024-0001',
        voucher_type: 'sales_invoice',
        total_amount: 118000,
        status: 'posted'
      });

      await VoucherService.createVoucher(mockCtx, voucherData);

      // Now generate E-Way Bill
      const transportDetails = {
        transporter_id: '27AABCT1234A1Z5',
        transporter_name: 'Test Transporter',
        transport_mode: 'road',
        vehicle_no: 'MH01AB1234',
        distance: 200
      };

      // Mock E-Way Bill client
      const mockEWBClient = {
        generateEWayBill: jest.fn().mockResolvedValue({
          ewbNo: '123456789012',
          ewbDate: new Date().toISOString(),
          validUpto: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      };

      EWayBillService.ewbClient = mockEWBClient;

      const eWayBillResult = await EWayBillService.generateEWayBill(
        mockCtx,
        'voucher-integration-001',
        transportDetails
      );

      // Verify E-Way Bill was created
      expect(eWayBillResult).toBeDefined();
      expect(eWayBillResult.ewb_no).toBe('123456789012');
      expect(eWayBillResult.status).toBe('active');

      // Verify E-Way Bill was stored in database
      expect(mockTenantModels.EWayBill.create).toHaveBeenCalled();
      const eWayBillCreateArgs = mockTenantModels.EWayBill.create.mock.calls[0][0];
      expect(eWayBillCreateArgs.voucher_id).toBe('voucher-integration-001');
      expect(eWayBillCreateArgs.tenant_id).toBe('tenant-integration-001');
    });

    it('should verify all data persisted correctly', async () => {
      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date('2025-05-15'),
        party_ledger_id: 'ledger-customer',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Test Product',
            hsn_sac_code: '1001',
            quantity: 100,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-integration-001',
        voucher_number: 'SI-2024-0001',
        voucher_type: 'sales_invoice',
        total_amount: 118000,
        status: 'draft'
      });

      await VoucherService.createVoucher(mockCtx, voucherData);

      // Verify voucher data
      expect(mockTenantModels.Voucher.create).toHaveBeenCalled();
      const voucherCreateArgs = mockTenantModels.Voucher.create.mock.calls[0][0];
      expect(voucherCreateArgs.voucher_type).toBe('sales_invoice');
      expect(voucherCreateArgs.tenant_id).toBe('tenant-integration-001');

      // Verify voucher items
      expect(mockTenantModels.VoucherItem.bulkCreate).toHaveBeenCalled();

      // Verify numbering history
      expect(mockTenantModels.NumberingHistory.create).toHaveBeenCalled();
      const historyCreateArgs = mockTenantModels.NumberingHistory.create.mock.calls[0][0];
      expect(historyCreateArgs.voucher_id).toBe('voucher-integration-001');
      expect(historyCreateArgs.generated_number).toBe('SI-2024-0001');
    });

    it('should verify ledger entries created properly', async () => {
      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date('2025-05-15'),
        party_ledger_id: 'ledger-customer',
        place_of_supply: 'Maharashtra',
        items: [
          {
            item_description: 'Test Product',
            hsn_sac_code: '1001',
            quantity: 100,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-integration-001',
        voucher_number: 'SI-2024-0001',
        voucher_type: 'sales_invoice',
        total_amount: 118000,
        status: 'draft'
      });

      await VoucherService.createVoucher(mockCtx, voucherData);

      // Verify ledger entries were created
      expect(mockTenantModels.VoucherLedgerEntry.bulkCreate).toHaveBeenCalled();
      const ledgerEntries = mockTenantModels.VoucherLedgerEntry.bulkCreate.mock.calls[0][0];

      // Should have entries for: Customer (debit), Sales (credit), CGST (credit), SGST (credit)
      expect(ledgerEntries.length).toBeGreaterThanOrEqual(4);

      // Verify debit and credit balance
      const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
      const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
      expect(totalDebit).toBe(totalCredit); // Double-entry bookkeeping
    });

    it('should work with different numbering series', async () => {
      // Mock a different numbering series
      mockTenantModels.NumberingSeries.findOne = jest.fn().mockResolvedValue({
        id: 'series-002',
        tenant_id: 'tenant-integration-001',
        voucher_type: 'sales_invoice',
        prefix: 'SALES',
        format: 'PREFIX-YY-MM-SEQUENCE',
        separator: '-',
        sequence_length: 4,
        current_sequence: 0,
        start_number: 1,
        is_default: false,
        is_active: true,
        update: jest.fn().mockResolvedValue(true)
      });

      const voucherData = {
        voucher_type: 'sales_invoice',
        voucher_date: new Date('2025-05-15'),
        party_ledger_id: 'ledger-customer',
        place_of_supply: 'Maharashtra',
        series_id: 'series-002', // Specify different series
        items: [
          {
            item_description: 'Test Product',
            hsn_sac_code: '1001',
            quantity: 100,
            rate: 1000,
            gst_rate: 18
          }
        ]
      };

      VoucherService.getVoucher = jest.fn().mockResolvedValue({
        id: 'voucher-integration-001',
        voucher_number: 'SALES-24-01-0001',
        voucher_type: 'sales_invoice',
        total_amount: 118000,
        status: 'draft'
      });

      await VoucherService.createVoucher(mockCtx, voucherData);

      // Verify different series was used
      expect(mockTenantModels.NumberingSeries.findOne).toHaveBeenCalled();
      const findOneArgs = mockTenantModels.NumberingSeries.findOne.mock.calls[0][0];
      expect(findOneArgs.where.id).toBe('series-002');
    });
  });
});
