/**
 * Consolidated Seeder for Tenant Databases
 * 
 * This file contains all seeders for tenant-specific databases.
 * These seeders run on each tenant's individual database.
 * 
 * IMPORTANT: This seeder runs on each tenant database separately
 * 
 * NOTE: User creation is handled by tenantProvisioningService.seedDefaultData()
 * This seeder only creates default ledgers and other reference data
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ============================================
    // DEFAULT LEDGERS
    // ============================================
    
    // Get account groups from master database (they're shared across all tenants)
    const masterModels = require('../models/masterModels');
    
    try {
      // Fetch account groups
      const accountGroups = await masterModels.AccountGroup.findAll({
        where: { is_system: true },
      });
      
      console.log(`[SEEDER] Found ${accountGroups.length} system account groups`);
      
      // Create a map of group codes to IDs
      const groupMap = new Map();
      accountGroups.forEach((group) => {
        groupMap.set(group.group_code, group.id);
      });

      const defaultLedgers = [];

      // Helper function to add ledger if group exists
      const addLedger = (code, name, groupCode, balanceType) => {
        const groupId = groupMap.get(groupCode);
        if (groupId) {
          defaultLedgers.push({
            id: Sequelize.literal('(UUID())'),
            ledger_code: code,
            ledger_name: name,
            account_group_id: groupId,
            opening_balance: 0,
            opening_balance_type: balanceType,
            balance_type: balanceType === 'Dr' ? 'debit' : 'credit',
            current_balance: 0,
            tenant_id: '',  // Empty string for tenant_id
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          console.warn(`[SEEDER] Account group '${groupCode}' not found, skipping ledger '${name}'`);
        }
      };

      // Cash Ledgers
      addLedger('CASH-001', 'Cash on Hand', 'CASH', 'Dr');
      
      // Bank Ledgers
      addLedger('BANK-001', 'Bank Account', 'BANK', 'Dr');
      
      // Sales Ledgers
      addLedger('SAL-001', 'Sales', 'SAL', 'Cr');
      
      // Purchase Ledgers
      addLedger('PUR-001', 'Purchase', 'PUR', 'Dr');
      
      // Capital Account
      addLedger('CAP-001', 'Capital Account', 'CAP', 'Cr');
      
      // Stock in Hand
      addLedger('INV-001', 'Stock in Hand', 'INV', 'Dr');

      // GST Ledgers - Separate Input (Asset) and Output (Liability)
      // Input GST = Debit balance (Asset - Input Tax Credit that can be claimed)
      // Input GST is an asset because it represents tax paid that will be recovered
      addLedger('CGST-INPUT', 'Input CGST', 'CA', 'Dr');  // Current Assets
      addLedger('SGST-INPUT', 'Input SGST', 'CA', 'Dr');  // Current Assets
      addLedger('IGST-INPUT', 'Input IGST', 'CA', 'Dr');  // Current Assets
      
      // Output GST = Credit balance (Liability - Tax collected from customers)
      // Output GST is a liability because it represents tax collected that must be paid to government
      addLedger('CGST-OUTPUT', 'Output CGST', 'DT', 'Cr');  // Duties & Taxes
      addLedger('SGST-OUTPUT', 'Output SGST', 'DT', 'Cr');  // Duties & Taxes
      addLedger('IGST-OUTPUT', 'Output IGST', 'DT', 'Cr');  // Duties & Taxes

      // Insert default ledgers (check for existing first to avoid duplicates)
      if (defaultLedgers.length > 0) {
        let insertedCount = 0;
        let skippedCount = 0;
        
        for (const ledger of defaultLedgers) {
          try {
            // Check if ledger already exists by code or name
            const [existing] = await queryInterface.sequelize.query(
              `SELECT id FROM ledgers WHERE ledger_code = ? OR ledger_name = ? LIMIT 1`,
              { replacements: [ledger.ledger_code, ledger.ledger_name] }
            );
            
            if (existing.length === 0) {
              await queryInterface.bulkInsert('ledgers', [ledger]);
              insertedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.warn(`⚠️  Could not insert ledger ${ledger.ledger_name}:`, error.message);
          }
        }
        
        console.log(`✓ Seeded ${insertedCount} default ledgers (${skippedCount} already existed)`);
      } else {
        console.warn('⚠️  No default ledgers were created - account groups may be missing');
      }

    } catch (error) {
      console.error('❌ Error seeding default ledgers:', error.message);
      console.error('Stack:', error.stack);
      // Don't throw - allow provisioning to continue even if seeding fails
    }

    // ============================================
    // DEFAULT NUMBERING SERIES
    // ============================================
    
    try {
      // Check if numbering_series table exists
      const [numberingSeriesTables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'numbering_series'");
      
      if (numberingSeriesTables.length > 0) {
        const defaultNumberingSeries = [
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',  // Empty string for tenant_id
            voucher_type: 'sales_invoice',
            series_name: 'Sales Invoice Series',
            prefix: 'SI',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'tax_invoice',
            series_name: 'Tax Invoice Series',
            prefix: 'TI',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'bill_of_supply',
            series_name: 'Bill of Supply Series',
            prefix: 'BS',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'retail_invoice',
            series_name: 'Retail Invoice Series',
            prefix: 'RI',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'export_invoice',
            series_name: 'Export Invoice Series',
            prefix: 'EI',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'delivery_challan',
            series_name: 'Delivery Challan Series',
            prefix: 'DC',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'proforma_invoice',
            series_name: 'Proforma Invoice Series',
            prefix: 'PI',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: Sequelize.literal('(UUID())'),
            tenant_id: '',
            voucher_type: 'purchase_invoice',
            series_name: 'Purchase Invoice Series',
            prefix: 'PI',
            format: 'PREFIXSEPARATORYEARSEPARATORSEQUENCE',
            separator: '-',
            sequence_length: 3,
            current_sequence: 1,
            start_number: 1,
            end_number: null,
            reset_frequency: 'yearly',
            last_reset_date: null,
            is_default: true,
            is_active: true,
            createdAt: now,
            updatedAt: now,
          },
        ];

        // Insert numbering series (check for existing first to avoid duplicates)
        let insertedCount = 0;
        let skippedCount = 0;
        
        for (const series of defaultNumberingSeries) {
          try {
            // Check if series already exists by voucher_type and prefix
            const [existing] = await queryInterface.sequelize.query(
              `SELECT id FROM numbering_series WHERE voucher_type = ? AND prefix = ? LIMIT 1`,
              { replacements: [series.voucher_type, series.prefix] }
            );
            
            if (existing.length === 0) {
              await queryInterface.bulkInsert('numbering_series', [series]);
              insertedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.warn(`⚠️  Could not insert numbering series ${series.series_name}:`, error.message);
          }
        }
        
        console.log(`✓ Seeded ${insertedCount} default numbering series (${skippedCount} already existed)`);
      } else {
        console.warn('⚠️  numbering_series table does not exist, skipping numbering series seeding');
      }
    } catch (error) {
      console.error('❌ Error seeding default numbering series:', error.message);
      // Don't throw - allow provisioning to continue even if seeding fails
    }

    console.log('✓ Tenant seeder completed');
  },

  async down(queryInterface, Sequelize) {
    // Remove default ledgers
    await queryInterface.bulkDelete('ledgers', { is_default: true }, {});
    
    // Remove default numbering series
    await queryInterface.bulkDelete('numbering_series', { is_default: true }, {});
  },
};
