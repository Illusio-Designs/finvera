/**
 * Setup Script: Create default numbering series for Proforma Invoice
 * 
 * This script creates a default numbering series for Proforma Invoice vouchers
 * with the format: PI-YYYY-SEQUENCE
 * 
 * Usage: node backend/src/scripts/setup-proforma-invoice-numbering.js <tenant_id>
 * 
 * Requirements: 9.5
 */

const { getTenantConnection } = require('../config/tenantConnectionManager');
const logger = require('../utils/logger');

async function setupProformaInvoiceNumbering(tenantId) {
  let tenantConnection;
  
  try {
    logger.info(`Setting up Proforma Invoice numbering series for tenant: ${tenantId}`);
    
    // Get tenant connection
    tenantConnection = await getTenantConnection(tenantId);
    const tenantModels = require('../services/tenantModels')(tenantConnection);
    
    // Check if Proforma Invoice numbering series already exists
    const existingSeries = await tenantModels.NumberingSeries.findOne({
      where: {
        tenant_id: tenantId,
        voucher_type: 'proforma_invoice',
        is_default: true,
      },
    });
    
    if (existingSeries) {
      logger.info('Proforma Invoice numbering series already exists');
      logger.info(`Series: ${existingSeries.series_name} (${existingSeries.format})`);
      return existingSeries;
    }
    
    // Create default Proforma Invoice numbering series
    const numberingSeries = await tenantModels.NumberingSeries.create({
      tenant_id: tenantId,
      voucher_type: 'proforma_invoice',
      series_name: 'Proforma Invoice Default',
      prefix: 'PI',
      format: 'PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE',
      separator: '-',
      sequence_length: 4,
      current_sequence: 0,
      start_number: 1,
      end_number: null,
      reset_frequency: 'yearly',
      last_reset_date: null,
      is_default: true,
      is_active: true,
    });
    
    logger.info('✅ Successfully created Proforma Invoice numbering series');
    logger.info(`Series ID: ${numberingSeries.id}`);
    logger.info(`Format: ${numberingSeries.format}`);
    logger.info(`Example: PI-2024-0001`);
    
    return numberingSeries;
    
  } catch (error) {
    logger.error('❌ Error setting up Proforma Invoice numbering series:', error);
    throw error;
  } finally {
    if (tenantConnection) {
      await tenantConnection.close();
    }
  }
}

// Run script if called directly
if (require.main === module) {
  const tenantId = process.argv[2];
  
  if (!tenantId) {
    console.error('Usage: node setup-proforma-invoice-numbering.js <tenant_id>');
    process.exit(1);
  }
  
  setupProformaInvoiceNumbering(tenantId)
    .then(() => {
      logger.info('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupProformaInvoiceNumbering };
