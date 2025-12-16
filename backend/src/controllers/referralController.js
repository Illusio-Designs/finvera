const { ReferralCode, ReferralReward, Tenant, Salesman, Distributor } = require('../models');
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

      // Generate unique code
      const code = generateReferralCode(owner_type);

      const referralCode = await ReferralCode.create({
        code,
        owner_type,
        owner_id,
        discount_type,
        discount_value: parseFloat(discount_value) || 0,
        free_trial_days: parseInt(free_trial_days) || 0,
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
      const userId = req.user.id;
      const userRole = req.user.role;

      let ownerId;
      let ownerType;

      if (userRole === 'salesman') {
        const salesman = await Salesman.findOne({ where: { user_id: userId } });
        if (salesman) {
          ownerId = salesman.id;
          ownerType = 'salesman';
        }
      } else if (userRole === 'distributor') {
        const distributor = await Distributor.findOne({ where: { user_id: userId } });
        if (distributor) {
          ownerId = distributor.id;
          ownerType = 'distributor';
        }
      } else if (userRole === 'tenant_admin') {
        ownerId = req.user.tenant_id;
        ownerType = 'customer';
      }

      if (!ownerId) {
        return res.status(404).json({ message: 'No referral code found for your account' });
      }

      let referralCode = await ReferralCode.findOne({
        where: { owner_type: ownerType, owner_id: ownerId, is_active: true },
      });

      if (!referralCode) {
        // Create one if doesn't exist
        referralCode = await ReferralCode.create({
          code: generateReferralCode(ownerType),
          owner_type: ownerType,
          owner_id: ownerId,
          discount_type: 'percentage',
          discount_value: 20,
          free_trial_days: 30,
          is_active: true,
        });
      }

      res.json({ referralCode });
    } catch (err) {
      next(err);
    }
  },

  async listRewards(req, res, next) {
    try {
      const { referrer_type, referrer_id, status } = req.query;
      const where = {};

      if (referrer_type) where.referrer_type = referrer_type;
      if (referrer_id) where.referrer_id = referrer_id;
      if (status) where.reward_status = status;

      const rewards = await ReferralReward.findAll({
        where,
        include: [
          { model: Tenant, attributes: ['id', 'company_name'], foreignKey: 'referee_tenant_id' },
          { model: ReferralCode, attributes: ['id', 'code'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({ rewards });
    } catch (err) {
      next(err);
    }
  },

  async approveReward(req, res, next) {
    try {
      const { id } = req.params;
      const reward = await ReferralReward.findByPk(id);

      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }

      await reward.update({
        reward_status: 'approved',
        payment_date: new Date(),
      });

      res.json({ reward });
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

      const totalRewards = await ReferralReward.count({ where });
      const totalRevenue = await ReferralReward.sum('reward_amount', { where });
      const conversions = await ReferralReward.count({
        where: { ...where, reward_status: 'approved' },
      });

      const conversionRate = totalRewards > 0 ? (conversions / totalRewards) * 100 : 0;

      res.json({
        analytics: {
          totalRewards,
          totalRevenue: parseFloat(totalRevenue || 0),
          conversions,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getReferralCodeById(req, res, next) {
    try {
      const { id } = req.params;
      const referralCode = await ReferralCode.findByPk(id);

      if (!referralCode) {
        return res.status(404).json({ message: 'Referral code not found' });
      }

      res.json(referralCode);
    } catch (err) {
      next(err);
    }
  },

  async updateReferralCode(req, res, next) {
    try {
      const { id } = req.params;
      const referralCode = await ReferralCode.findByPk(id);

      if (!referralCode) {
        return res.status(404).json({ message: 'Referral code not found' });
      }

      await referralCode.update(req.body);
      res.json(referralCode);
    } catch (err) {
      next(err);
    }
  },

  async deleteReferralCode(req, res, next) {
    try {
      const { id } = req.params;
      const referralCode = await ReferralCode.findByPk(id);

      if (!referralCode) {
        return res.status(404).json({ message: 'Referral code not found' });
      }

      await referralCode.update({ is_active: false });
      res.json({ message: 'Referral code deactivated' });
    } catch (err) {
      next(err);
    }
  },

  async getReferralRewardById(req, res, next) {
    try {
      const { id } = req.params;
      const reward = await ReferralReward.findByPk(id, {
        include: [
          { model: Tenant, attributes: ['id', 'company_name'] },
          { model: ReferralCode, attributes: ['id', 'code'] },
        ],
      });

      if (!reward) {
        return res.status(404).json({ message: 'Referral reward not found' });
      }

      res.json(reward);
    } catch (err) {
      next(err);
    }
  },
};

function generateReferralCode(ownerType) {
  const prefix = ownerType === 'salesman' ? 'SM' : ownerType === 'distributor' ? 'DS' : 'CU';
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${random}`;
}

