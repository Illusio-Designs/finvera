const { ReferralCode } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

module.exports = {
  async listCodes(req, res, next) {
    try {
      const { owner_type, owner_id, is_active } = req.query;
      const where = {};

      if (owner_type) where.owner_type = owner_type;
      if (owner_id) where.owner_id = owner_id;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      const codes = await ReferralCode.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      res.json({ codes });
    } catch (err) {
      next(err);
    }
  },

  async createCode(req, res, next) {
    try {
      const {
        owner_type,
        owner_id,
        discount_type,
        discount_value,
        free_trial_days,
        max_uses,
        valid_from,
        valid_until,
      } = req.body;

      // Generate unique code with retry mechanism
      let code;
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        code = generateReferralCode(owner_type);
        const existing = await ReferralCode.findOne({ where: { code } });
        if (!existing) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: 'Failed to generate unique referral code' });
      }

      const referralCode = await ReferralCode.create({
        code,
        owner_type,
        owner_id,
        discount_type,
        discount_value: parseFloat(discount_value) || 10.0,
        free_trial_days: parseInt(free_trial_days) || 30,
        max_uses: parseInt(max_uses) || null,
        valid_from: valid_from ? new Date(valid_from) : new Date(),
        valid_until: valid_until ? new Date(valid_until) : null,
      });

      res.status(201).json({ referralCode });
    } catch (err) {
      next(err);
    }
  },

  async verifyCode(req, res, next) {
    try {
      const { code } = req.body;

      const referralCode = await ReferralCode.findOne({
        where: {
          code,
          is_active: true,
          [Op.or]: [
            { valid_until: null },
            { valid_until: { [Op.gte]: new Date() } },
          ],
        },
      });

      if (!referralCode) {
        return res.status(404).json({ message: 'Invalid or expired referral code' });
      }

      if (referralCode.max_uses && referralCode.current_uses >= referralCode.max_uses) {
        return res.status(400).json({ message: 'Referral code usage limit reached' });
      }

      res.json({
        valid: true,
        code: referralCode.code,
        discount_type: referralCode.discount_type,
        discount_value: referralCode.discount_value,
        free_trial_days: referralCode.free_trial_days,
      });
    } catch (err) {
      next(err);
    }
  },

  async getMyCode(req, res, next) {
    try {
      const userId = req.user?.id || req.user_id;
      const userRole = req.user?.role || req.role;
      const tenantId = req.tenant_id || req.user?.tenant_id;

      let ownerId;
      let ownerType;

      // Determine owner type and ID based on user role
      if (userRole === 'salesman') {
        const { Salesman } = require('../models');
        const salesman = await Salesman.findOne({ where: { user_id: userId } });
        if (salesman) {
          ownerId = salesman.id;
          ownerType = 'salesman';
        }
      } else if (userRole === 'distributor') {
        const { Distributor } = require('../models');
        const distributor = await Distributor.findOne({ where: { user_id: userId } });
        if (distributor) {
          ownerId = distributor.id;
          ownerType = 'distributor';
        }
      } else if (userRole === 'tenant_admin' || userRole === 'user') {
        // For tenant users, use tenant_id as owner_id
        ownerId = tenantId;
        ownerType = 'customer';
      }

      if (!ownerId) {
        return res.status(404).json({ message: 'No referral code available for your account type' });
      }

      // Check if user already has a referral code
      let referralCode = await ReferralCode.findOne({
        where: { owner_type: ownerType, owner_id: ownerId, is_active: true },
      });

      if (!referralCode) {
        // Generate unique code with retry mechanism
        let code;
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          code = generateReferralCode(ownerType);
          const existing = await ReferralCode.findOne({ where: { code } });
          if (!existing) break;
          attempts++;
        }

        if (attempts >= maxAttempts) {
          return res.status(500).json({ message: 'Failed to generate unique referral code' });
        }

        // Create new referral code with standard 10% discount
        referralCode = await ReferralCode.create({
          code,
          owner_type: ownerType,
          owner_id: ownerId,
          discount_type: 'percentage',
          discount_value: 10.0, // Standard 10% discount
          free_trial_days: 30,   // Standard 30 days trial
          is_active: true,
        });
      }

      // Return referral code with usage stats
      res.json({ 
        referralCode: {
          ...referralCode.toJSON(),
          total_uses: referralCode.current_uses || 0,
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const where = {};

      if (startDate && endDate) {
        where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      // Get basic referral code statistics
      const totalCodes = await ReferralCode.count({ where });
      const activeCodes = await ReferralCode.count({ 
        where: { ...where, is_active: true } 
      });
      const totalUses = await ReferralCode.sum('current_uses', { where }) || 0;

      res.json({
        analytics: {
          totalCodes,
          activeCodes,
          totalUses,
          averageUsesPerCode: totalCodes > 0 ? (totalUses / totalCodes).toFixed(2) : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

function generateReferralCode(ownerType) {
  const prefix = ownerType === 'salesman' ? 'SM' : ownerType === 'distributor' ? 'DS' : 'FV';
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${random}`;
}

