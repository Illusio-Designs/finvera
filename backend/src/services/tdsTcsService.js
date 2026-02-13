/**
 * TDS/TCS Service
 * Phase 1: Foundation Layer - Auto-creation and Management
 */

const logger = require('../utils/logger');

class TDSTCSService {
  /**
   * Auto-create statutory ledgers when TDS is enabled
   */
  static async createTDSLedgers(tenantModels, masterModels, tenantId) {
    try {
      // Find "Duties & Taxes" group
      const dutiesTaxGroup = await masterModels.AccountGroup.findOne({
        where: { name: 'Duties & Taxes' },
      });

      if (!dutiesTaxGroup) {
        throw new Error('Duties & Taxes account group not found');
      }

      // Find "Current Assets" group for TDS Receivable
      const currentAssetsGroup = await masterModels.AccountGroup.findOne({
        where: { name: 'Current Assets' },
      });

      const ledgersToCreate = [
        {
          ledger_name: 'TDS Payable',
          system_code: 'TDS_PAYABLE',
          account_group_id: dutiesTaxGroup.id,
          description: 'System-generated ledger for TDS payable to government',
        },
      ];

      // Optionally create TDS Receivable
      if (currentAssetsGroup) {
        ledgersToCreate.push({
          ledger_name: 'TDS Receivable',
          system_code: 'TDS_RECEIVABLE',
          account_group_id: currentAssetsGroup.id,
          description: 'System-generated ledger for TDS receivable',
        });
      }

      const createdLedgers = [];

      for (const ledgerData of ledgersToCreate) {
        // Check if already exists
        const existing = await tenantModels.Ledger.findOne({
          where: { system_code: ledgerData.system_code },
        });

        if (!existing) {
          // Generate ledger code
          const groupCode = dutiesTaxGroup.group_code || 'TAX';
          const ledgerCode = await this.generateLedgerCode(tenantModels, groupCode);

          const ledger = await tenantModels.Ledger.create({
            ...ledgerData,
            ledger_code: ledgerCode,
            is_system_generated: true,
            opening_balance: 0,
            balance_type: 'credit',
            opening_balance_type: 'Cr',
            currency: 'INR',
            tenant_id: tenantId,
          });

          createdLedgers.push(ledger);
          logger.info(`✅ Created TDS ledger: ${ledgerData.ledger_name}`);
        } else {
          logger.info(`ℹ️ TDS ledger already exists: ${ledgerData.ledger_name}`);
        }
      }

      return createdLedgers;
    } catch (error) {
      logger.error('Error creating TDS ledgers:', error);
      throw error;
    }
  }

  /**
   * Auto-create statutory ledgers when TCS is enabled
   */
  static async createTCSLedgers(tenantModels, masterModels, tenantId) {
    try {
      // Find "Duties & Taxes" group
      const dutiesTaxGroup = await masterModels.AccountGroup.findOne({
        where: { name: 'Duties & Taxes' },
      });

      if (!dutiesTaxGroup) {
        throw new Error('Duties & Taxes account group not found');
      }

      const ledgerData = {
        ledger_name: 'TCS Payable',
        system_code: 'TCS_PAYABLE',
        account_group_id: dutiesTaxGroup.id,
        description: 'System-generated ledger for TCS payable to government',
      };

      // Check if already exists
      const existing = await tenantModels.Ledger.findOne({
        where: { system_code: ledgerData.system_code },
      });

      if (!existing) {
        // Generate ledger code
        const groupCode = dutiesTaxGroup.group_code || 'TAX';
        const ledgerCode = await this.generateLedgerCode(tenantModels, groupCode);

        const ledger = await tenantModels.Ledger.create({
          ...ledgerData,
          ledger_code: ledgerCode,
          is_system_generated: true,
          opening_balance: 0,
          balance_type: 'credit',
          opening_balance_type: 'Cr',
          currency: 'INR',
          tenant_id: tenantId,
        });

        logger.info(`✅ Created TCS ledger: ${ledgerData.ledger_name}`);
        return [ledger];
      } else {
        logger.info(`ℹ️ TCS ledger already exists: ${ledgerData.ledger_name}`);
        return [];
      }
    } catch (error) {
      logger.error('Error creating TCS ledgers:', error);
      throw error;
    }
  }

  /**
   * Generate unique ledger code
   */
  static async generateLedgerCode(tenantModels, groupCode) {
    const { Op } = require('sequelize');
    
    const existingLedgers = await tenantModels.Ledger.findAll({
      where: {
        ledger_code: {
          [Op.like]: `${groupCode}-%`,
        },
      },
      order: [['ledger_code', 'DESC']],
      limit: 1,
      attributes: ['ledger_code'],
    });

    let sequence = 1;
    if (existingLedgers.length > 0) {
      const lastCode = existingLedgers[0].ledger_code;
      const lastSequence = parseInt(lastCode.split('-')[1] || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${groupCode}-${String(sequence).padStart(3, '0')}`;
  }

  /**
   * Get TDS/TCS configuration for company
   */
  static async getCompanyTDSTCSConfig(masterModels, companyId) {
    try {
      const company = await masterModels.Company.findByPk(companyId);
      if (!company) {
        return { is_tds_enabled: false, is_tcs_enabled: false };
      }

      return {
        is_tds_enabled: company.is_tds_enabled || false,
        is_tcs_enabled: company.is_tcs_enabled || false,
      };
    } catch (error) {
      logger.error('Error getting TDS/TCS config:', error);
      return { is_tds_enabled: false, is_tcs_enabled: false };
    }
  }

  /**
   * Get TDS sections list
   */
  static async getTDSSections(masterModels) {
    try {
      const sections = await masterModels.TDSSection.findAll({
        where: { is_active: true },
        order: [['section_code', 'ASC']],
      });
      return sections;
    } catch (error) {
      logger.error('Error fetching TDS sections:', error);
      return [];
    }
  }

  /**
   * Get TCS sections list
   */
  static async getTCSSections(masterModels) {
    try {
      const sections = await masterModels.TCSSection.findAll({
        where: { is_active: true },
        order: [['section_code', 'ASC']],
      });
      return sections;
    } catch (error) {
      logger.error('Error fetching TCS sections:', error);
      return [];
    }
  }
}

module.exports = TDSTCSService;
