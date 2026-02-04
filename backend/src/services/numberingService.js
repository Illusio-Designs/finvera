const { Op } = require('sequelize');

/**
 * NumberingService - Advanced invoice numbering system
 * 
 * Provides flexible, GST-compliant voucher numbering with:
 * - Multiple numbering series per voucher type
 * - Format token replacement (PREFIX, YEAR, MONTH, SEQUENCE, etc.)
 * - Automatic sequence reset based on frequency
 * - Database-level locking to prevent race conditions
 * - Complete audit trail of generated numbers
 */
class NumberingService {
  constructor() {
    this.tokenReplacers = {
      PREFIX: (series) => series.prefix,
      YEAR: () => new Date().getFullYear().toString(),
      YY: () => new Date().getFullYear().toString().slice(-2),
      MONTH: () => (new Date().getMonth() + 1).toString().padStart(2, '0'),
      MM: () => (new Date().getMonth() + 1).toString().padStart(2, '0'),
      SEQUENCE: (series, sequence) => sequence.toString().padStart(series.sequence_length, '0'),
      BRANCH: (series) => series.branch_id ? series.branch_id.slice(-4) : '0000',
      COMPANY: () => 'COMP', // Placeholder - can be enhanced with actual company code
      SEPARATOR: (series) => series.separator || '-'
    };
  }

  /**
   * Generate next voucher number for a series
   * Uses database-level locking to prevent race conditions
   * 
   * @param {string} tenantId - Tenant ID
   * @param {string} voucherType - Type of voucher (Sales Invoice, Purchase Invoice, etc.)
   * @param {string} seriesId - Optional specific series ID
   * @param {string} branchId - Optional branch ID
   * @returns {Promise<{voucherNumber: string, seriesId: string, sequence: number}>}
   */
  async generateVoucherNumber(tenantId, voucherType, seriesId = null, branchId = null) {
    if (!tenantId || !voucherType) {
      throw new Error('tenantId and voucherType are required');
    }

    // Get tenant models - this will be injected by the calling context
    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      let series;
      
      if (seriesId) {
        // Use specific series
        series = await tenantModels.NumberingSeries.findOne({
          where: {
            id: seriesId,
            tenant_id: tenantId,
            is_active: true
          },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        
        if (!series) {
          throw new Error(`Numbering series not found: ${seriesId}`);
        }
      } else {
        // Use default series for voucher type
        series = await tenantModels.NumberingSeries.findOne({
          where: {
            tenant_id: tenantId,
            voucher_type: voucherType,
            is_default: true,
            is_active: true,
            ...(branchId && { branch_id: branchId })
          },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        
        if (!series) {
          throw new Error(`No default numbering series found for voucher type: ${voucherType}`);
        }
      }

      // Check if sequence reset is needed
      await this.checkAndResetSequence(series, transaction);

      // Get next sequence number
      const nextSequence = await this.getNextSequence(series, transaction);
      
      // Format the voucher number
      const voucherNumber = this.formatVoucherNumber(series, nextSequence);
      
      // Validate GST compliance
      this.validateGSTCompliance(voucherNumber);

      // Update current sequence
      await this.updateCurrentSequence(series, nextSequence, transaction);

      await transaction.commit();

      return {
        voucherNumber,
        seriesId: series.id,
        sequence: nextSequence
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Format voucher number based on series configuration
   * Replaces tokens with actual values
   * 
   * @param {Object} series - Numbering series configuration
   * @param {number} sequence - Sequence number to use
   * @returns {string} Formatted voucher number
   */
  formatVoucherNumber(series, sequence) {
    let formatted = series.format;
    
    // Replace all tokens
    for (const [token, replacer] of Object.entries(this.tokenReplacers)) {
      const regex = new RegExp(token, 'g');
      formatted = formatted.replace(regex, replacer(series, sequence));
    }
    
    return formatted;
  }

  /**
   * Check if sequence reset is needed based on reset frequency
   * 
   * @param {Object} series - Numbering series
   * @param {Object} transaction - Database transaction
   */
  async checkAndResetSequence(series, transaction) {
    if (series.reset_frequency === 'never') {
      return;
    }

    const now = new Date();
    const lastReset = series.last_reset_date ? new Date(series.last_reset_date) : null;
    let shouldReset = false;

    switch (series.reset_frequency) {
      case 'monthly':
        shouldReset = !lastReset || 
          (now.getFullYear() !== lastReset.getFullYear() || 
           now.getMonth() !== lastReset.getMonth());
        break;
        
      case 'yearly':
        shouldReset = !lastReset || now.getFullYear() !== lastReset.getFullYear();
        break;
        
      case 'financial_year':
        const currentFY = this.getFinancialYear(now);
        const lastResetFY = lastReset ? this.getFinancialYear(lastReset) : null;
        shouldReset = !lastResetFY || currentFY !== lastResetFY;
        break;
    }

    if (shouldReset) {
      await series.update({
        current_sequence: series.start_number - 1, // Will be incremented to start_number
        last_reset_date: now
      }, { transaction });
    }
  }

  /**
   * Get next sequence number with transaction support
   * 
   * @param {Object} series - Numbering series
   * @param {Object} transaction - Database transaction
   * @returns {Promise<number>} Next sequence number
   */
  async getNextSequence(series, transaction) {
    const nextSequence = series.current_sequence + 1;
    
    // Check if we've reached the end number
    if (series.end_number && nextSequence > series.end_number) {
      throw new Error(`Sequence exhausted for series ${series.series_name}. Maximum number ${series.end_number} reached.`);
    }
    
    return nextSequence;
  }

  /**
   * Update current sequence in the series
   * 
   * @param {Object} series - Numbering series
   * @param {number} sequence - New sequence number
   * @param {Object} transaction - Database transaction
   */
  async updateCurrentSequence(series, sequence, transaction) {
    await series.update({
      current_sequence: sequence
    }, { transaction });
  }

  /**
   * Get financial year for a given date (April 1 to March 31)
   * 
   * @param {Date} date - Date to get financial year for
   * @returns {string} Financial year (e.g., "2024-25")
   */
  getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    
    if (month >= 3) { // April onwards (month 3 = April)
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { // January to March
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }

  /**
   * Record generated voucher number in history
   * This should be called after voucher creation
   * 
   * @param {string} seriesId - Series ID
   * @param {string} voucherId - Voucher ID
   * @param {string} generatedNumber - Generated voucher number
   * @param {number} sequence - Sequence used
   * @param {string} tenantId - Tenant ID
   */
  async recordNumberingHistory(seriesId, voucherId, generatedNumber, sequence, tenantId) {
    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    await tenantModels.NumberingHistory.create({
      series_id: seriesId,
      voucher_id: voucherId,
      generated_number: generatedNumber,
      sequence_used: sequence,
      tenant_id: tenantId
    });
  }

  /**
   * Create a new numbering series with validation
   * 
   * @param {string} tenantId - Tenant ID
   * @param {Object} seriesConfig - Series configuration
   * @returns {Promise<Object>} Created numbering series
   */
  async createNumberingSeries(tenantId, seriesConfig) {
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    // Validate required fields
    const {
      voucher_type,
      series_name,
      prefix,
      format,
      sequence_length = 4,
      start_number = 1,
      end_number = null,
      reset_frequency = 'never',
      is_default = false,
      branch_id = null,
      separator = '-'
    } = seriesConfig;

    if (!voucher_type || !series_name || !prefix || !format) {
      throw new Error('voucher_type, series_name, prefix, and format are required');
    }

    // Validate format contains required tokens
    this.validateFormat(format);
    
    // Validate prefix
    this.validatePrefix(prefix);

    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      // If this is set as default, unset other defaults for the same voucher type
      if (is_default) {
        await tenantModels.NumberingSeries.update(
          { is_default: false },
          {
            where: {
              tenant_id: tenantId,
              voucher_type: voucher_type,
              ...(branch_id && { branch_id })
            },
            transaction
          }
        );
      }

      // Create the series
      const series = await tenantModels.NumberingSeries.create({
        tenant_id: tenantId,
        branch_id,
        voucher_type,
        series_name,
        prefix,
        format,
        separator,
        sequence_length,
        current_sequence: start_number - 1, // Will be incremented to start_number on first use
        start_number,
        end_number,
        reset_frequency,
        is_default,
        is_active: true
      }, { transaction });

      await transaction.commit();
      return series;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update existing numbering series
   * 
   * @param {string} seriesId - Series ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated numbering series
   */
  async updateNumberingSeries(seriesId, updates) {
    if (!seriesId) {
      throw new Error('seriesId is required');
    }

    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      const series = await tenantModels.NumberingSeries.findByPk(seriesId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!series) {
        throw new Error(`Numbering series not found: ${seriesId}`);
      }

      // Validate updates if format or prefix is being changed
      if (updates.format) {
        this.validateFormat(updates.format);
      }
      if (updates.prefix) {
        this.validatePrefix(updates.prefix);
      }

      // If setting as default, unset other defaults for the same voucher type
      if (updates.is_default === true) {
        await tenantModels.NumberingSeries.update(
          { is_default: false },
          {
            where: {
              tenant_id: series.tenant_id,
              voucher_type: series.voucher_type,
              id: { [Op.ne]: seriesId },
              ...(series.branch_id && { branch_id: series.branch_id })
            },
            transaction
          }
        );
      }

      // Update the series
      await series.update(updates, { transaction });

      await transaction.commit();
      return series;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Set a series as default for its voucher type
   * 
   * @param {string} seriesId - Series ID to set as default
   * @returns {Promise<Object>} Updated series
   */
  async setDefaultSeries(seriesId) {
    if (!seriesId) {
      throw new Error('seriesId is required');
    }

    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      const series = await tenantModels.NumberingSeries.findByPk(seriesId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!series) {
        throw new Error(`Numbering series not found: ${seriesId}`);
      }

      // Unset other defaults for the same voucher type
      await tenantModels.NumberingSeries.update(
        { is_default: false },
        {
          where: {
            tenant_id: series.tenant_id,
            voucher_type: series.voucher_type,
            id: { [Op.ne]: seriesId },
            ...(series.branch_id && { branch_id: series.branch_id })
          },
          transaction
        }
      );

      // Set this series as default
      await series.update({ is_default: true }, { transaction });

      await transaction.commit();
      return series;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Preview next number without consuming it
   * 
   * @param {string} seriesId - Series ID
   * @returns {Promise<string>} Preview of next voucher number
   */
  async previewNextNumber(seriesId) {
    if (!seriesId) {
      throw new Error('seriesId is required');
    }

    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    const series = await tenantModels.NumberingSeries.findByPk(seriesId);
    if (!series) {
      throw new Error(`Numbering series not found: ${seriesId}`);
    }

    // Create a temporary copy to check reset without modifying the original
    const tempSeries = { ...series.dataValues };
    
    // Check if reset would be needed (without actually resetting)
    if (tempSeries.reset_frequency !== 'never') {
      const now = new Date();
      const lastReset = tempSeries.last_reset_date ? new Date(tempSeries.last_reset_date) : null;
      let shouldReset = false;

      switch (tempSeries.reset_frequency) {
        case 'monthly':
          shouldReset = !lastReset || 
            (now.getFullYear() !== lastReset.getFullYear() || 
             now.getMonth() !== lastReset.getMonth());
          break;
          
        case 'yearly':
          shouldReset = !lastReset || now.getFullYear() !== lastReset.getFullYear();
          break;
          
        case 'financial_year':
          const currentFY = this.getFinancialYear(now);
          const lastResetFY = lastReset ? this.getFinancialYear(lastReset) : null;
          shouldReset = !lastResetFY || currentFY !== lastResetFY;
          break;
      }

      if (shouldReset) {
        tempSeries.current_sequence = tempSeries.start_number - 1;
      }
    }

    const nextSequence = tempSeries.current_sequence + 1;
    
    // Check if we've reached the end number
    if (tempSeries.end_number && nextSequence > tempSeries.end_number) {
      throw new Error(`Sequence exhausted for series ${tempSeries.series_name}. Maximum number ${tempSeries.end_number} reached.`);
    }

    return this.formatVoucherNumber(tempSeries, nextSequence);
  }

  /**
   * Get numbering series helper method
   * 
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of numbering series
   */
  async getNumberingSeries(tenantId, filters = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const { tenantModels } = this.context || {};
    if (!tenantModels) {
      throw new Error('Tenant models not available in context');
    }

    const where = {
      tenant_id: tenantId,
      ...filters
    };

    return await tenantModels.NumberingSeries.findAll({
      where,
      order: [['voucher_type', 'ASC'], ['series_name', 'ASC']]
    });
  }

  /**
   * Validate GST compliance for voucher numbers
   * Ensures generated numbers don't exceed 16 character limit
   * 
   * @param {string} voucherNumber - Generated voucher number
   * @throws {Error} If voucher number exceeds GST limit
   */
  validateGSTCompliance(voucherNumber) {
    if (!voucherNumber) {
      throw new Error('Voucher number is required for GST compliance validation');
    }

    if (voucherNumber.length > 16) {
      throw new Error(`Voucher number exceeds 16 character GST limit: ${voucherNumber} (${voucherNumber.length} characters)`);
    }

    // Additional GST compliance checks
    // Voucher numbers should only contain alphanumeric characters, hyphens, and forward slashes
    const gstCompliantPattern = /^[A-Za-z0-9\-\/]+$/;
    if (!gstCompliantPattern.test(voucherNumber)) {
      throw new Error(`Voucher number contains invalid characters for GST compliance: ${voucherNumber}`);
    }
  }

  /**
   * Validate format contains required tokens
   * 
   * @param {string} format - Format string to validate
   * @throws {Error} If format doesn't contain required tokens
   */
  validateFormat(format) {
    if (!format) {
      throw new Error('Format is required');
    }

    if (!format.includes('PREFIX')) {
      throw new Error('Format must contain PREFIX token');
    }

    if (!format.includes('SEQUENCE')) {
      throw new Error('Format must contain SEQUENCE token');
    }

    // Validate that format won't exceed GST limit with reasonable values
    // Test with maximum values to ensure compliance
    const testSeries = {
      prefix: 'ABCDEFGH', // 8 chars (max reasonable)
      sequence_length: 6, // 6 digits
      separator: '-'
    };
    
    const testNumber = this.formatVoucherNumber({
      ...testSeries,
      format: format
    }, 999999); // Max sequence for 6 digits

    if (testNumber.length > 16) {
      throw new Error(`Format may generate voucher numbers exceeding 16 character GST limit. Test number: ${testNumber} (${testNumber.length} characters)`);
    }
  }

  /**
   * Validate prefix is alphanumeric only (uppercase)
   * 
   * @param {string} prefix - Prefix to validate
   * @throws {Error} If prefix contains invalid characters
   */
  validatePrefix(prefix) {
    if (!prefix) {
      throw new Error('Prefix is required');
    }

    if (prefix.length > 10) {
      throw new Error('Prefix cannot exceed 10 characters');
    }

    // Prefix should be uppercase alphanumeric only
    const prefixPattern = /^[A-Z0-9]+$/;
    if (!prefixPattern.test(prefix)) {
      throw new Error('Prefix must contain only uppercase letters and numbers');
    }
  }

  /**
   * Set context for database operations
   * This should be called before using the service
   * 
   * @param {Object} context - Context containing tenantModels
   */
  setContext(context) {
    this.context = context;
  }
}

module.exports = new NumberingService();