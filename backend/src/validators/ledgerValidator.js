/**
 * Ledger Validation Module
 * Phase 1: Foundation Layer - Validation Rules
 */

const logger = require('../utils/logger');

class LedgerValidator {
  /**
   * Validate ledger creation/update data
   */
  static async validateLedgerData(data, tenantModels, masterModels, isUpdate = false, existingLedger = null) {
    const errors = [];

    // Basic validations
    if (!data.ledger_name || data.ledger_name.trim() === '') {
      errors.push('Ledger name is required');
    }

    if (!isUpdate && !data.account_group_id) {
      errors.push('Account group is required');
    }

    // Get account group details
    let accountGroup = null;
    const groupId = data.account_group_id || existingLedger?.account_group_id;
    if (groupId) {
      accountGroup = await masterModels.AccountGroup.findByPk(groupId);
      if (!accountGroup) {
        errors.push('Invalid account group');
      }
    }

    // Opening balance validation
    if (data.opening_balance !== undefined && data.opening_balance < 0) {
      errors.push('Opening balance cannot be negative');
    }

    // Balance type must match group nature
    if (accountGroup && data.balance_type) {
      const groupNature = accountGroup.nature?.toLowerCase();
      const balanceType = data.balance_type?.toLowerCase();
      
      // Validate balance type matches group nature
      if (groupNature === 'asset' || groupNature === 'expense') {
        if (balanceType !== 'debit') {
          errors.push(`Balance type must be 'debit' for ${groupNature} accounts`);
        }
      } else if (groupNature === 'liability' || groupNature === 'income') {
        if (balanceType !== 'credit') {
          errors.push(`Balance type must be 'credit' for ${groupNature} accounts`);
        }
      }
    }

    // TDS Validations
    if (data.is_tds_applicable === true) {
      // TDS only allowed for Sundry Creditors
      if (accountGroup && !accountGroup.name?.toLowerCase().includes('sundry creditor')) {
        errors.push('TDS is only applicable for Sundry Creditors (vendor ledgers)');
      }

      // PAN mandatory for TDS
      if (!data.pan_no || data.pan_no.trim() === '') {
        errors.push('PAN number is mandatory when TDS is applicable');
      }

      // TDS section required
      if (!data.tds_section_code || data.tds_section_code.trim() === '') {
        errors.push('TDS section code is required when TDS is applicable');
      }

      // Deductor type required
      if (!data.tds_deductor_type) {
        errors.push('TDS deductor type (Individual/Company) is required when TDS is applicable');
      }

      // Validate TDS section based on account group
      if (data.tds_section_code && accountGroup) {
        // For Purchase ledgers (Sundry Creditors), only 194Q is allowed
        if (accountGroup.name?.toLowerCase().includes('sundry creditor')) {
          if (data.tds_section_code !== '194Q') {
            errors.push('Only TDS Section 194Q (Purchase of Goods) is allowed for Purchase/Sundry Creditor ledgers. For other TDS sections (194C, 194J, 194H, etc.), use Expense ledgers with Journal/Expense vouchers.');
          }
        }
        
        // Validate TDS section exists
        const tdsSection = await masterModels.TDSSectionMaster.findOne({
          where: { section_code: data.tds_section_code, is_active: true },
        });
        if (!tdsSection) {
          errors.push('Invalid or inactive TDS section code');
        }
      }
    }

    // TCS Validations
    if (data.is_tcs_applicable === true) {
      // TCS only allowed for Sundry Debtors
      if (accountGroup && !accountGroup.name?.toLowerCase().includes('sundry debtor')) {
        errors.push('TCS is only applicable for Sundry Debtors (customer ledgers)');
      }

      // PAN mandatory for TCS
      if (!data.pan_no || data.pan_no.trim() === '') {
        errors.push('PAN number is mandatory when TCS is applicable');
      }

      // TCS section required
      if (!data.tcs_section_code || data.tcs_section_code.trim() === '') {
        errors.push('TCS section code is required when TCS is applicable');
      }

      // Validate TCS section exists
      if (data.tcs_section_code) {
        const tcsSection = await masterModels.TCSSection.findOne({
          where: { section_code: data.tcs_section_code, is_active: true },
        });
        if (!tcsSection) {
          errors.push('Invalid or inactive TCS section code');
        }
      }
    }

    // PAN format validation
    if (data.pan_no && data.pan_no.trim() !== '') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(data.pan_no.toUpperCase())) {
        errors.push('Invalid PAN format. Expected format: ABCDE1234F');
      }
    }

    // GSTIN validation for Debtors/Creditors
    if (accountGroup && (accountGroup.name?.toLowerCase().includes('sundry debtor') || 
                         accountGroup.name?.toLowerCase().includes('sundry creditor'))) {
      if (data.gstin && data.gstin.trim() !== '') {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(data.gstin.toUpperCase())) {
          errors.push('Invalid GSTIN format. Expected 15 characters: StateCode + PAN + Entity + Z + Checksum');
        }
      }
    }

    // Prevent changing TDS/TCS applicability if ledger has transactions
    if (isUpdate && existingLedger) {
      const hasTransactions = await this.checkLedgerHasTransactions(existingLedger.id, tenantModels);
      
      if (hasTransactions) {
        if (data.is_tds_applicable !== undefined && data.is_tds_applicable !== existingLedger.is_tds_applicable) {
          errors.push('Cannot change TDS applicability after transactions exist. Statutory data cannot be modified historically.');
        }
        
        if (data.is_tcs_applicable !== undefined && data.is_tcs_applicable !== existingLedger.is_tcs_applicable) {
          errors.push('Cannot change TCS applicability after transactions exist. Statutory data cannot be modified historically.');
        }

        // Prevent group change
        if (data.account_group_id && data.account_group_id !== existingLedger.account_group_id) {
          errors.push('Cannot change account group after transactions exist. This would corrupt balance sheet.');
        }
      }
    }

    return errors;
  }

  /**
   * Validate system-generated ledger protection
   */
  static validateSystemLedgerProtection(ledger, operation) {
    const errors = [];

    if (ledger.is_system_generated === true) {
      switch (operation) {
        case 'update_name':
          errors.push('Cannot edit name of system-generated ledger');
          break;
        case 'update_group':
          errors.push('Cannot change group of system-generated ledger');
          break;
        case 'delete':
          errors.push('Cannot delete system-generated ledger. This is a statutory ledger managed by the system.');
          break;
        case 'manual_posting':
          errors.push('Cannot manually post to system-generated ledger. Only system can create entries.');
          break;
      }
    }

    return errors;
  }

  /**
   * Check if ledger has any transactions
   */
  static async checkLedgerHasTransactions(ledgerId, tenantModels) {
    try {
      const count = await tenantModels.VoucherLedgerEntry.count({
        where: { ledger_id: ledgerId },
        limit: 1,
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking ledger transactions:', error);
      return false;
    }
  }

  /**
   * Validate ledger uniqueness
   */
  static async validateUniqueness(ledgerName, tenantModels, excludeId = null) {
    const where = { ledger_name: ledgerName };
    if (excludeId) {
      where.id = { [require('sequelize').Op.ne]: excludeId };
    }

    const existing = await tenantModels.Ledger.findOne({ where });
    if (existing) {
      return ['Ledger name must be unique within tenant'];
    }
    return [];
  }

  /**
   * Filter system-generated ledgers from dropdown
   */
  static filterSystemLedgers(ledgers) {
    return ledgers.filter(ledger => ledger.is_system_generated !== true);
  }
}

module.exports = LedgerValidator;
