const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Run migration to add missing columns to ledgers table
 * This is called automatically if columns are missing
 */
async function runLedgerMigration(sequelize) {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('ledgers');
    
    const migration = require('../migrations/20251218-add-ledger-fields');
    await migration.up(queryInterface, Sequelize);
    
    logger.info('Ledger migration completed successfully');
    return true;
  } catch (error) {
    // If columns already exist, that's fine
    if (error.message && (error.message.includes('Duplicate column') || error.message.includes('already exists'))) {
      logger.debug('Ledger columns already exist, skipping migration');
      return true;
    }
    logger.warn('Ledger migration failed (non-critical):', error.message);
    return false;
  }
}

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, account_group_id } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { ledger_name: { [Op.like]: `%${search}%` } },
          { ledger_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (account_group_id) {
        where.account_group_id = account_group_id;
      }

      // Try to get ledgers - handle case where country column might not exist
      let count, rows;
      try {
        const result = await req.tenantModels.Ledger.findAndCountAll({
          where,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['ledger_code', 'ASC']],
        });
        count = result.count;
        rows = result.rows;
      } catch (error) {
        // If error is about missing column (like 'country'), retry with explicit attributes
        if (error.message && error.message.includes("Unknown column")) {
          logger.warn('Ledger list: Column missing, retrying with explicit attributes', error.message);
          const result = await req.tenantModels.Ledger.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['ledger_code', 'ASC']],
            attributes: {
              exclude: ['country'], // Exclude potentially missing columns
            },
          });
          count = result.count;
          rows = result.rows;
        } else {
          throw error;
        }
      }

      // Enrich account group details from master DB
      const groupIds = [...new Set(rows.map((r) => r.account_group_id).filter(Boolean))];
      const groups = await req.masterModels.AccountGroup.findAll({ where: { id: groupIds } });
      const groupMap = new Map(groups.map((g) => [g.id, g]));
      const data = rows.map((l) => ({
        ...l.toJSON(),
        account_group: groupMap.get(l.account_group_id)
          ? {
              id: groupMap.get(l.account_group_id).id,
              group_name: groupMap.get(l.account_group_id).name,
              group_code: groupMap.get(l.account_group_id).group_code,
              nature: groupMap.get(l.account_group_id).nature,
            }
          : null,
      }));

      res.json({
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('Ledger list error:', error);
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      // Debug logging
      logger.info('Ledger create request:', {
        tenant_id: req.tenant_id,
        tenant: req.tenant?.id,
        company_tenant_id: req.company?.tenant_id,
        user_id: req.user_id,
        body_keys: Object.keys(req.body)
      });

      // Run migration automatically if needed (adds missing columns)
      // This ensures the database has all required columns
      await runLedgerMigration(req.tenantDb);
      const {
        ledger_name,
        account_group_id,
        opening_balance = 0,
        opening_balance_date,
        balance_type = 'debit',
        currency = 'INR',
        description,
        // Standard fields
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        country,
        phone,
        email,
        // Shipping locations (array)
        shipping_locations,
        ...dynamicFields
      } = req.body;

      if (!ledger_name || !account_group_id) {
        return res.status(400).json({
          success: false,
          message: 'ledger_name and account_group_id are required',
        });
      }

      // Get account group to generate ledger code
      const accountGroup = await req.masterModels.AccountGroup.findByPk(account_group_id);
      if (!accountGroup) {
        return res.status(404).json({
          success: false,
          message: 'Account group not found',
        });
      }

      // Auto-generate ledger code
      // Format: {GROUP_CODE}-{SEQUENCE}
      // Example: CA-001, BANK-002, etc.
      const groupCode = accountGroup.group_code || 'LED';
      
      // Find the highest sequence number for this group
      // Exclude potentially missing columns like 'country'
      let existingLedgers;
      try {
        existingLedgers = await req.tenantModels.Ledger.findAll({
          where: {
            ledger_code: {
              [Op.like]: `${groupCode}-%`,
            },
          },
          order: [['ledger_code', 'DESC']],
          limit: 1,
          attributes: {
            exclude: ['country'], // Exclude potentially missing columns
          },
        });
      } catch (error) {
        // If error is about missing column, retry with minimal attributes
        if (error.message && error.message.includes("Unknown column")) {
          logger.warn('Ledger create: Column missing, retrying with minimal attributes', error.message);
          existingLedgers = await req.tenantModels.Ledger.findAll({
            where: {
              ledger_code: {
                [Op.like]: `${groupCode}-%`,
              },
            },
            order: [['ledger_code', 'DESC']],
            limit: 1,
            attributes: ['id', 'ledger_code'], // Only select needed fields
          });
        } else {
          throw error;
        }
      }

      let sequence = 1;
      if (existingLedgers.length > 0) {
        const lastCode = existingLedgers[0].ledger_code;
        const lastSequence = parseInt(lastCode.split('-')[1] || '0', 10);
        sequence = lastSequence + 1;
      }

      const ledger_code = `${groupCode}-${String(sequence).padStart(3, '0')}`;

      // After migration runs, we can use all fields
      // Separate standard fields from dynamic fields
      const standardFields = {
        ledger_name,
        ledger_code,
        account_group_id,
        opening_balance: parseFloat(opening_balance) || 0,
        opening_balance_date: opening_balance_date || null,
        opening_balance_type: balance_type === 'debit' ? 'Dr' : 'Cr',
        balance_type,
        currency: currency || 'INR',
        description: description || null,
        gstin: gstin || null,
        pan: pan || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        country: country || null,
        phone: phone || null,
        email: email || null,
        tenant_id: req.tenant_id, // Add tenant_id from middleware
      };
      
      // Store shipping_locations and dynamic fields in additional_fields JSON column
      const additionalFields = {};
      
      // Add shipping_locations if provided
      if (shipping_locations && Array.isArray(shipping_locations) && shipping_locations.length > 0) {
        additionalFields.shipping_locations = shipping_locations;
      }
      
      // Add other dynamic fields
      Object.keys(dynamicFields).forEach((key) => {
        if (dynamicFields[key] !== null && dynamicFields[key] !== undefined && dynamicFields[key] !== '') {
          additionalFields[key] = dynamicFields[key];
        }
      });

      // Ensure tenant_id is set - get from multiple sources
      const tenantId = req.tenant_id || req.tenant?.id || req.company?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required but not found in request context',
        });
      }

      // Create ledger with all fields (migration should have added missing columns)
      const ledger = await req.tenantModels.Ledger.create({
        ...standardFields,
        tenant_id: tenantId, // Ensure tenant_id is explicitly set
        additional_fields: Object.keys(additionalFields).length > 0 ? additionalFields : null,
      });

      res.status(201).json({ data: ledger });
    } catch (error) {
      logger.error('Ledger create error:', error);
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      // Try to run migration first to ensure columns exist
      await runLedgerMigration(req.tenantDb);
      
      // Try to get ledger - handle missing columns gracefully
      let ledger;
      try {
        ledger = await req.tenantModels.Ledger.findByPk(id);
      } catch (error) {
        // If error is about missing column, try with explicit attributes
        if (error.message && error.message.includes("Unknown column")) {
          logger.warn('Ledger getById: Column missing, retrying with explicit attributes', error.message);
          ledger = await req.tenantModels.Ledger.findByPk(id, {
            attributes: {
              exclude: ['country', 'opening_balance_date', 'currency', 'description', 'additional_fields'], // Exclude potentially missing columns
            },
          });
        } else {
          throw error;
        }
      }

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      const group = ledger.account_group_id
        ? await req.masterModels.AccountGroup.findByPk(ledger.account_group_id)
        : null;

      const ledgerData = ledger.toJSON();
      
      // Merge additional_fields into main object for easier access
      if (ledgerData.additional_fields && typeof ledgerData.additional_fields === 'object') {
        Object.assign(ledgerData, ledgerData.additional_fields);
      }

      res.json({
        data: {
          ...ledgerData,
          account_group: group
            ? { id: group.id, group_name: group.name, group_code: group.group_code, nature: group.nature }
            : null,
        },
      });
    } catch (error) {
      logger.error('Ledger getById error:', error);
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        ledger_name,
        account_group_id,
        opening_balance,
        opening_balance_date,
        balance_type,
        currency,
        description,
        // Standard fields
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        country,
        phone,
        email,
        // Shipping locations (array)
        shipping_locations,
        is_active,
        ...dynamicFields
      } = req.body;

      const ledger = await req.tenantModels.Ledger.findByPk(id);

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      const updateData = {};
      if (ledger_name) updateData.ledger_name = ledger_name;
      if (account_group_id) updateData.account_group_id = account_group_id;
      if (opening_balance !== undefined) updateData.opening_balance = parseFloat(opening_balance);
      if (opening_balance_date !== undefined) updateData.opening_balance_date = opening_balance_date;
      if (balance_type) {
        updateData.balance_type = balance_type;
        updateData.opening_balance_type = balance_type === 'debit' ? 'Dr' : 'Cr';
      }
      if (currency !== undefined) updateData.currency = currency;
      if (description !== undefined) updateData.description = description;
      if (gstin !== undefined) updateData.gstin = gstin;
      if (pan !== undefined) updateData.pan = pan;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (pincode !== undefined) updateData.pincode = pincode;
      if (country !== undefined) updateData.country = country;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Handle shipping_locations and dynamic fields in additional_fields JSON
      const additionalFields = {};
      
      // Get existing additional_fields if any
      if (ledger.additional_fields && typeof ledger.additional_fields === 'object') {
        Object.assign(additionalFields, ledger.additional_fields);
      }
      
      // Update shipping_locations if provided
      if (shipping_locations !== undefined) {
        if (Array.isArray(shipping_locations) && shipping_locations.length > 0) {
          additionalFields.shipping_locations = shipping_locations;
        } else {
          delete additionalFields.shipping_locations;
        }
      }
      
      // Add other dynamic fields
      Object.keys(dynamicFields).forEach((key) => {
        if (dynamicFields[key] !== null && dynamicFields[key] !== undefined && dynamicFields[key] !== '') {
          additionalFields[key] = dynamicFields[key];
        }
      });
      
      if (Object.keys(additionalFields).length > 0) {
        updateData.additional_fields = additionalFields;
      } else {
        updateData.additional_fields = null;
      }

      await ledger.update(updateData);

      res.json({ data: ledger });
    } catch (error) {
      logger.error('Ledger update error:', error);
      next(error);
    }
  },

  async getBalance(req, res, next) {
    try {
      const { id } = req.params;
      const { from_date, to_date } = req.query;

      const ledger = await req.tenantModels.Ledger.findByPk(id);

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      // Calculate balance from voucher ledger entries
      const where = {
        ledger_id: id,
      };

      // If date range provided, join with Voucher to filter by date
      let queryOptions = {
        where,
        attributes: [
          // Use actual column names from the model
          [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.debit_amount')), 'total_debit'],
          [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.credit_amount')), 'total_credit'],
        ],
        raw: true,
      };

      if (from_date || to_date) {
        const Voucher = req.tenantModels.Voucher;
        queryOptions.include = [
          {
            model: Voucher,
            attributes: [],
            where: {},
            required: true,
          },
        ];
        if (from_date) {
          queryOptions.include[0].where.voucher_date = { [Op.gte]: from_date };
        }
        if (to_date) {
          if (queryOptions.include[0].where.voucher_date) {
            queryOptions.include[0].where.voucher_date[Op.lte] = to_date;
          } else {
            queryOptions.include[0].where.voucher_date = { [Op.lte]: to_date };
          }
        }
      }

      const entries = await req.tenantModels.VoucherLedgerEntry.findAll(queryOptions);

      const totalDebit = parseFloat(entries[0]?.total_debit || 0);
      const totalCredit = parseFloat(entries[0]?.total_credit || 0);
      const openingBalance = parseFloat(ledger.opening_balance || 0);

      let currentBalance = openingBalance;
      if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
        currentBalance = openingBalance + totalDebit - totalCredit;
      } else {
        currentBalance = openingBalance + totalCredit - totalDebit;
      }

      res.json({
        data: {
          ledger_id: id,
          opening_balance: openingBalance,
          total_debit: totalDebit,
          total_credit: totalCredit,
          current_balance: Math.abs(currentBalance),
          balance_type: currentBalance >= 0 ? 'debit' : 'credit',
        },
      });
    } catch (error) {
      logger.error('Ledger getBalance error:', error);
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const ledger = await req.tenantModels.Ledger.findByPk(id);

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      // Check if ledger is used in any vouchers
      const voucherEntries = await req.tenantModels.VoucherLedgerEntry.findOne({
        where: { ledger_id: id },
      });

      if (voucherEntries) {
        return res.status(400).json({
          message: 'Cannot delete ledger. It is being used in vouchers.',
        });
      }

      await ledger.destroy();

      res.json({ message: 'Ledger deleted successfully' });
    } catch (error) {
      logger.error('Ledger delete error:', error);
      next(error);
    }
  },
};

