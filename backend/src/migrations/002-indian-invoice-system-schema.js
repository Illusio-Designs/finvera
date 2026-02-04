/**
 * Migration for Indian Invoice System Backend
 * 
 * This migration adds:
 * 1. numbering_series table - for flexible invoice numbering
 * 2. numbering_history table - for tracking generated numbers
 * 3. Enhancements to e_invoices table - add retry_count, last_retry_at, error_message
 * 4. Enhancements to e_way_bills table - add distance, transport_mode, vehicle_no, transporter_name
 * 5. Enhancements to tds_details table - add deductee_name, certificate_date, taxable_amount
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.10
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to safely add column
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      try {
        const [tables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
        if (tables.length === 0) {
          console.log(`⚠️  Table ${tableName} does not exist, skipping column addition`);
          return false;
        }

        const tableDescription = await queryInterface.describeTable(tableName);
        if (!tableDescription[columnName]) {
          await queryInterface.addColumn(tableName, columnName, columnDefinition);
          console.log(`✓ Added column ${columnName} to ${tableName}`);
          return true;
        } else {
          console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
          return false;
        }
      } catch (error) {
        if (error.message.includes('Duplicate column name') || 
            error.message.includes('already exists') ||
            error.message.includes('Duplicate column')) {
          console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
          return false;
        }
        console.error(`❌ Error adding column ${columnName} to ${tableName}:`, error.message);
        throw error;
      }
    };

    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
        console.log(`✓ Added index ${options.name || 'unnamed'} to ${tableName}`);
        return true;
      } catch (error) {
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists') ||
            error.message.includes('Too many keys')) {
          if (error.message.includes('Too many keys')) {
            console.warn(`⚠️  Skipping index creation on ${tableName}: Too many keys (MySQL limit: 64)`);
          } else {
            console.log(`ℹ️  Index ${options.name || 'unnamed'} already exists on ${tableName}`);
          }
          return false;
        }
        console.error(`❌ Error adding index to ${tableName}:`, error.message);
        throw error;
      }
    };

    // ============================================
    // 1. NUMBERING_SERIES TABLE
    // ============================================
    console.log('Creating numbering_series table...');
    const [numberingSeriesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'numbering_series'");
    if (numberingSeriesTable.length === 0) {
      await queryInterface.createTable('numbering_series', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        tenant_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        branch_id: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Optional branch association for branch-specific numbering',
        },
        voucher_type: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Type of voucher (Sales Invoice, Purchase Invoice, etc.)',
        },
        series_name: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'User-friendly name for the series',
        },
        prefix: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Prefix for voucher numbers (e.g., INV, EXP)',
        },
        format: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Format string with tokens like {PREFIX}{YEAR}{MONTH}{SEQUENCE}',
        },
        separator: {
          type: Sequelize.STRING(5),
          defaultValue: '-',
          comment: 'Separator character between format tokens',
        },
        sequence_length: {
          type: Sequelize.INTEGER,
          defaultValue: 4,
          comment: 'Number of digits for sequence padding (e.g., 4 = 0001)',
        },
        current_sequence: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Current sequence number',
        },
        start_number: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: 'Starting sequence number',
        },
        end_number: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Optional ending sequence number',
        },
        reset_frequency: {
          type: Sequelize.ENUM('never', 'monthly', 'yearly', 'financial_year'),
          defaultValue: 'never',
          comment: 'When to reset the sequence',
        },
        last_reset_date: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last date when sequence was reset',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this is the default series for the voucher type',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether this series is active',
        },
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Add indexes for performance
      await addIndexIfNotExists('numbering_series', ['tenant_id'], { 
        name: 'idx_numbering_series_tenant_id' 
      });
      await addIndexIfNotExists('numbering_series', ['voucher_type'], { 
        name: 'idx_numbering_series_voucher_type' 
      });
      await addIndexIfNotExists('numbering_series', ['tenant_id', 'voucher_type'], { 
        name: 'idx_numbering_series_tenant_voucher_type' 
      });
      await addIndexIfNotExists('numbering_series', ['tenant_id', 'voucher_type', 'is_default'], { 
        name: 'idx_numbering_series_default' 
      });

      console.log('✓ Created table numbering_series');
    } else {
      console.log('ℹ️  Table numbering_series already exists');
    }

    // ============================================
    // 2. NUMBERING_HISTORY TABLE
    // ============================================
    console.log('Creating numbering_history table...');
    const [numberingHistoryTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'numbering_history'");
    if (numberingHistoryTable.length === 0) {
      await queryInterface.createTable('numbering_history', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        series_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'numbering_series',
            key: 'id',
          },
          onDelete: 'CASCADE',
          comment: 'Reference to numbering series',
        },
        voucher_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'vouchers',
            key: 'id',
          },
          onDelete: 'CASCADE',
          comment: 'Reference to voucher',
        },
        generated_number: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'The generated voucher number',
        },
        sequence_used: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'The sequence number used',
        },
        generated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          comment: 'Timestamp when number was generated',
        },
        tenant_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Add indexes for performance
      await addIndexIfNotExists('numbering_history', ['series_id'], { 
        name: 'idx_numbering_history_series_id' 
      });
      await addIndexIfNotExists('numbering_history', ['voucher_id'], { 
        name: 'idx_numbering_history_voucher_id',
        unique: true 
      });
      await addIndexIfNotExists('numbering_history', ['tenant_id'], { 
        name: 'idx_numbering_history_tenant_id' 
      });
      await addIndexIfNotExists('numbering_history', ['generated_number', 'tenant_id'], { 
        name: 'idx_numbering_history_number_tenant',
        unique: true 
      });

      console.log('✓ Created table numbering_history');
    } else {
      console.log('ℹ️  Table numbering_history already exists');
    }

    // ============================================
    // 3. ENHANCE E_INVOICES TABLE
    // ============================================
    console.log('Enhancing einvoices table...');
    
    // Add retry_count column
    await addColumnIfNotExists('einvoices', 'retry_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Number of retry attempts for E-Invoice generation',
    });

    // Add last_retry_at column
    await addColumnIfNotExists('einvoices', 'last_retry_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last retry attempt',
    });

    // Add error_message column
    await addColumnIfNotExists('einvoices', 'error_message', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Error message from failed E-Invoice generation',
    });

    // Update status enum to include 'pending' and 'failed'
    try {
      const [enumInfo] = await queryInterface.sequelize.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'einvoices' 
        AND COLUMN_NAME = 'status'
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (enumInfo.length > 0) {
        const currentEnum = enumInfo[0].COLUMN_TYPE;
        if (!currentEnum.includes("'pending'") || !currentEnum.includes("'failed'")) {
          await queryInterface.changeColumn('einvoices', 'status', {
            type: Sequelize.ENUM('pending', 'generated', 'cancelled', 'failed'),
            defaultValue: 'pending',
          });
          console.log('✓ Updated status enum in einvoices table');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not update status enum in einvoices:', error.message);
    }

    // Add index on status for filtering
    await addIndexIfNotExists('einvoices', ['status'], { 
      name: 'idx_einvoices_status' 
    });

    // Add unique constraint on IRN (if not exists)
    await addIndexIfNotExists('einvoices', ['irn'], { 
      name: 'idx_einvoices_irn_unique',
      unique: true,
      where: { irn: { [Sequelize.Op.ne]: null } }
    });

    console.log('✓ Enhanced einvoices table');

    // ============================================
    // 4. ENHANCE E_WAY_BILLS TABLE
    // ============================================
    console.log('Enhancing eway_bills table...');

    // Add distance column
    await addColumnIfNotExists('eway_bills', 'distance', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Distance in kilometers for E-Way Bill validity calculation',
    });

    // Add transport_mode column
    await addColumnIfNotExists('eway_bills', 'transport_mode', {
      type: Sequelize.ENUM('road', 'rail', 'air', 'ship'),
      allowNull: true,
      comment: 'Mode of transport',
    });

    // Add vehicle_no column (if not exists as vehicle_number)
    const [ewayBillsDesc] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'eway_bills' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    const columnNames = ewayBillsDesc.map(row => row.COLUMN_NAME);
    
    if (!columnNames.includes('vehicle_no') && !columnNames.includes('vehicle_number')) {
      await addColumnIfNotExists('eway_bills', 'vehicle_no', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Vehicle number',
      });
    } else if (columnNames.includes('vehicle_number') && !columnNames.includes('vehicle_no')) {
      console.log('ℹ️  Column vehicle_number exists (using that instead of vehicle_no)');
    }

    // Add transporter_name column
    await addColumnIfNotExists('eway_bills', 'transporter_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Name of the transporter',
    });

    // Update status enum to include 'active'
    try {
      const [enumInfo] = await queryInterface.sequelize.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'eway_bills' 
        AND COLUMN_NAME = 'status'
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (enumInfo.length > 0) {
        const currentEnum = enumInfo[0].COLUMN_TYPE;
        if (!currentEnum.includes("'active'")) {
          await queryInterface.changeColumn('eway_bills', 'status', {
            type: Sequelize.ENUM('active', 'generated', 'cancelled', 'expired'),
            defaultValue: 'active',
          });
          console.log('✓ Updated status enum in eway_bills table');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not update status enum in eway_bills:', error.message);
    }

    // Add index on status for filtering
    await addIndexIfNotExists('eway_bills', ['status'], { 
      name: 'idx_eway_bills_status' 
    });

    // Add unique constraint on EWB number (if not exists)
    await addIndexIfNotExists('eway_bills', ['ewb_number'], { 
      name: 'idx_eway_bills_ewb_number_unique',
      unique: true,
      where: { ewb_number: { [Sequelize.Op.ne]: null } }
    });

    console.log('✓ Enhanced eway_bills table');

    // ============================================
    // 5. ENHANCE TDS_DETAILS TABLE
    // ============================================
    console.log('Enhancing tds_details table...');

    // Add deductee_name column
    await addColumnIfNotExists('tds_details', 'deductee_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Name of the deductee',
    });

    // Add certificate_date column
    await addColumnIfNotExists('tds_details', 'certificate_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of TDS certificate issuance',
    });

    // Add taxable_amount column
    await addColumnIfNotExists('tds_details', 'taxable_amount', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Taxable amount on which TDS is calculated',
    });

    // Rename tds_section to section_code if needed
    const [tdsDetailsDesc] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'tds_details' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    const tdsColumnNames = tdsDetailsDesc.map(row => row.COLUMN_NAME);
    
    if (tdsColumnNames.includes('tds_section') && !tdsColumnNames.includes('section_code')) {
      try {
        await queryInterface.renameColumn('tds_details', 'tds_section', 'section_code');
        console.log('✓ Renamed tds_section to section_code in tds_details');
      } catch (error) {
        console.log('⚠️  Could not rename tds_section to section_code:', error.message);
      }
    }

    // Add index on voucher_id for performance (if not exists)
    await addIndexIfNotExists('tds_details', ['voucher_id'], { 
      name: 'idx_tds_details_voucher_id_fk' 
    });

    console.log('✓ Enhanced tds_details table');

    console.log('✅ All Indian Invoice System schema migrations completed successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('Rolling back Indian Invoice System schema migrations...');

    // Remove enhancements from tds_details
    try {
      await queryInterface.removeColumn('tds_details', 'deductee_name');
      await queryInterface.removeColumn('tds_details', 'certificate_date');
      await queryInterface.removeColumn('tds_details', 'taxable_amount');
      console.log('✓ Removed enhancements from tds_details');
    } catch (error) {
      console.log('⚠️  Could not remove columns from tds_details:', error.message);
    }

    // Remove enhancements from eway_bills
    try {
      await queryInterface.removeColumn('eway_bills', 'distance');
      await queryInterface.removeColumn('eway_bills', 'transport_mode');
      await queryInterface.removeColumn('eway_bills', 'vehicle_no');
      await queryInterface.removeColumn('eway_bills', 'transporter_name');
      console.log('✓ Removed enhancements from eway_bills');
    } catch (error) {
      console.log('⚠️  Could not remove columns from eway_bills:', error.message);
    }

    // Remove enhancements from einvoices
    try {
      await queryInterface.removeColumn('einvoices', 'retry_count');
      await queryInterface.removeColumn('einvoices', 'last_retry_at');
      await queryInterface.removeColumn('einvoices', 'error_message');
      console.log('✓ Removed enhancements from einvoices');
    } catch (error) {
      console.log('⚠️  Could not remove columns from einvoices:', error.message);
    }

    // Drop numbering_history table
    try {
      await queryInterface.dropTable('numbering_history');
      console.log('✓ Dropped table numbering_history');
    } catch (error) {
      console.log('⚠️  Could not drop table numbering_history:', error.message);
    }

    // Drop numbering_series table
    try {
      await queryInterface.dropTable('numbering_series');
      console.log('✓ Dropped table numbering_series');
    } catch (error) {
      console.log('⚠️  Could not drop table numbering_series:', error.message);
    }

    console.log('✅ Rollback completed');
  },
};
