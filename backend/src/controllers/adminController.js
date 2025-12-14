const { User, Distributor, Salesman, Commission, Payout, Target, SubscriptionPlan } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async dashboard(req, res, next) {
    try {
      // Calculate date ranges for revenue
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentYearStart = new Date(now.getFullYear(), 0, 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        totalTenants,
        totalDistributors,
        totalSalesmen,
        activeTenants,
        totalCommissions,
        totalPayouts,
        categoryStats,
        distributorCommissions,
        salesmanCommissions,
        allTenants,
        monthlyRevenue,
        yearlyRevenue,
        lastMonthRevenue,
      ] = await Promise.all([
        TenantMaster.count(),
        Distributor.count(),
        Salesman.count(),
        TenantMaster.count({ where: { is_active: true } }),
        Commission.sum('amount'),
        Payout.sum('total_amount'),
        TenantMaster.findAll({
          attributes: [
            'acquisition_category',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          ],
          group: ['acquisition_category'],
          raw: true,
        }),
        Commission.sum('amount', { where: { distributor_id: { [Op.ne]: null } } }),
        Commission.sum('amount', { where: { salesman_id: { [Op.ne]: null } } }),
        TenantMaster.findAll({
          attributes: ['id', 'subscription_plan', 'subscription_start', 'createdAt'],
          where: { is_active: true },
        }),
        // Revenue for current month
        TenantMaster.findAll({
          attributes: ['subscription_plan'],
          where: {
            is_active: true,
            createdAt: { [Op.gte]: currentMonthStart },
          },
        }),
        // Revenue for current year
        TenantMaster.findAll({
          attributes: ['subscription_plan'],
          where: {
            is_active: true,
            createdAt: { [Op.gte]: currentYearStart },
          },
        }),
        // Revenue for last month
        TenantMaster.findAll({
          attributes: ['subscription_plan'],
          where: {
            is_active: true,
            createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] },
          },
        }),
      ]);

      // Process category statistics
      const categoryBreakdown = {
        distributor: 0,
        salesman: 0,
        referral: 0,
        organic: 0,
      };

      categoryStats.forEach((stat) => {
        const category = stat.acquisition_category || 'organic';
        categoryBreakdown[category] = parseInt(stat.count || 0);
      });

      const totalByCategory = Object.values(categoryBreakdown).reduce((sum, val) => sum + val, 0);
      const categoryRatios = {};
      Object.keys(categoryBreakdown).forEach((category) => {
        categoryRatios[category] = totalByCategory > 0 
          ? parseFloat(((categoryBreakdown[category] / totalByCategory) * 100).toFixed(2))
          : 0;
      });

      // Get all active plans once for efficient lookup
      const allPlans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        attributes: ['plan_code', 'plan_name', 'base_price', 'discounted_price'],
      });
      const planMap = {};
      allPlans.forEach(plan => {
        planMap[plan.plan_code] = {
          plan_name: plan.plan_name,
          price: parseFloat(plan.discounted_price || plan.base_price || 0),
        };
      });

      // Calculate revenue from subscriptions (optimized)
      const calculateRevenue = (tenants) => {
        let totalRevenue = 0;
        const planRevenue = {};

        tenants.forEach(tenant => {
          if (tenant.subscription_plan && planMap[tenant.subscription_plan]) {
            const plan = planMap[tenant.subscription_plan];
            const planPrice = plan.price;
            totalRevenue += planPrice;
            
            if (!planRevenue[tenant.subscription_plan]) {
              planRevenue[tenant.subscription_plan] = {
                plan_name: plan.plan_name,
                count: 0,
                revenue: 0,
              };
            }
            planRevenue[tenant.subscription_plan].count += 1;
            planRevenue[tenant.subscription_plan].revenue += planPrice;
          }
        });

        return { totalRevenue, planRevenue };
      };

      const totalRevenueData = calculateRevenue(allTenants);
      const monthlyRevenueData = calculateRevenue(monthlyRevenue);
      const yearlyRevenueData = calculateRevenue(yearlyRevenue);
      const lastMonthRevenueData = calculateRevenue(lastMonthRevenue);

      // Calculate net revenue (total revenue - commissions paid)
      const netRevenue = totalRevenueData.totalRevenue - parseFloat(totalCommissions || 0);
      const revenueGrowth = lastMonthRevenueData.totalRevenue > 0
        ? parseFloat((((monthlyRevenueData.totalRevenue - lastMonthRevenueData.totalRevenue) / lastMonthRevenueData.totalRevenue) * 100).toFixed(2))
        : 0;

      res.json({
        data: {
          total_tenants: totalTenants,
          active_tenants: activeTenants,
          total_distributors: totalDistributors,
          total_salesmen: totalSalesmen,
          total_commissions: parseFloat(totalCommissions || 0),
          total_payouts: parseFloat(totalPayouts || 0),
          commissions: {
            total: parseFloat(totalCommissions || 0),
            distributor: parseFloat(distributorCommissions || 0),
            salesman: parseFloat(salesmanCommissions || 0),
          },
          revenue: {
            total: parseFloat(totalRevenueData.totalRevenue.toFixed(2)),
            monthly: parseFloat(monthlyRevenueData.totalRevenue.toFixed(2)),
            yearly: parseFloat(yearlyRevenueData.totalRevenue.toFixed(2)),
            last_month: parseFloat(lastMonthRevenueData.totalRevenue.toFixed(2)),
            growth: revenueGrowth,
            net: parseFloat(netRevenue.toFixed(2)),
            by_plan: Object.values(totalRevenueData.planRevenue).map(plan => ({
              plan_name: plan.plan_name,
              count: plan.count,
              revenue: parseFloat(plan.revenue.toFixed(2)),
            })),
          },
          tenant_categories: {
            breakdown: categoryBreakdown,
            ratios: categoryRatios,
          },
        },
      });
    } catch (error) {
      logger.error('Admin dashboard error:', error);
      next(error);
    }
  },

  async listTenants(req, res, next) {
    try {
      const { page = 1, limit = 20, search, is_active } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { company_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      const { count, rows } = await TenantMaster.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        attributes: [
          'id',
          'company_name',
          'subdomain',
          'email',
          'subscription_plan',
          'is_active',
          'is_suspended',
          'db_provisioned',
          'createdAt',
          'updatedAt'
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('Admin listTenants error:', error);
      next(error);
    }
  },

  async getTenant(req, res, next) {
    try {
      const { id } = req.params;
      const tenant = await TenantMaster.findByPk(id, {
        include: [
          {
            association: 'Users',
            attributes: ['id', 'email', 'name', 'role', 'is_active'],
          },
        ],
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      res.json({ data: tenant });
    } catch (error) {
      logger.error('Admin getTenant error:', error);
      next(error);
    }
  },

  async createTenant(req, res, next) {
    try {
      const {
        company_name,
        email,
        password,
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        subscription_plan,
        distributor_id,
        salesman_id,
      } = req.body;

      // Get distributor_id or salesman_id from logged-in user if not provided
      let finalDistributorId = distributor_id;
      let finalSalesmanId = salesman_id;
      const userId = req.user_id;
      const userRole = req.role;

      // Determine acquisition category and get distributor_id/salesman_id
      let acquisitionCategory = 'organic'; // Default: direct from website
      
      // If logged-in user is a distributor or salesman, get their ID
      if (!finalDistributorId && !finalSalesmanId && userId) {
        if (userRole === 'distributor') {
          const distributor = await Distributor.findOne({ where: { user_id: userId } });
          if (distributor) {
            finalDistributorId = distributor.id;
            acquisitionCategory = 'distributor';
          }
        } else if (userRole === 'salesman') {
          const salesman = await Salesman.findOne({ where: { user_id: userId } });
          if (salesman) {
            finalSalesmanId = salesman.id;
            acquisitionCategory = 'salesman';
            // Also get distributor_id from salesman
            if (salesman.distributor_id) {
              finalDistributorId = salesman.distributor_id;
            }
          }
        }
      }

      // Check if tenant came from referral code
      const { referral_code } = req.body;
      if (referral_code && !finalDistributorId && !finalSalesmanId) {
        acquisitionCategory = 'referral';
      }

      // If distributor_id or salesman_id is provided in body, set category accordingly
      if (distributor_id && !acquisitionCategory) {
        acquisitionCategory = 'distributor';
      } else if (salesman_id && !acquisitionCategory) {
        acquisitionCategory = 'salesman';
      }

      // Application-level uniqueness validation (since we removed unique constraints to avoid MySQL limit)
      if (email) {
        const existingEmail = await TenantMaster.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(409).json({ message: 'Email already exists' });
        }
      }

      // Generate subdomain if not provided (for uniqueness check)
      // Note: subdomain uniqueness should be checked if subdomain field exists in req.body
      // For now, we'll let the database handle it or add validation if needed

      const tenant = await TenantMaster.create({
        company_name,
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        subscription_plan,
        distributor_id: finalDistributorId,
        salesman_id: finalSalesmanId,
        referral_code,
        acquisition_category: acquisitionCategory,
      });

      // Create admin user if email and password provided
      if (email && password) {
        const bcrypt = require('bcryptjs');
        const password_hash = await bcrypt.hash(password, 10);
        await User.create({
          email,
          password: password_hash,
          name: company_name || email,
          tenant_id: tenant.id,
          role: 'tenant_admin',
        });
      }

      // Automatically create commissions if subscription plan is provided
      if (subscription_plan && (finalDistributorId || finalSalesmanId)) {
        try {
          const commissionService = require('../services/commissionService');
          await commissionService.calculateAndCreateCommissions(
            tenant.id,
            subscription_plan,
            'subscription'
          );
          logger.info(`Commissions created for tenant ${tenant.id}`);
        } catch (error) {
          logger.warn('Failed to create commission for tenant:', error.message);
          // Don't fail tenant creation if commission creation fails
        }
      }

      // Automatically update achieved targets after tenant creation
      await module.exports.updateTargetAchievement(finalDistributorId, finalSalesmanId, tenant);

      res.status(201).json({ data: tenant });
    } catch (error) {
      logger.error('Admin createTenant error:', error);
      next(error);
    }
  },

  async updateTenant(req, res, next) {
    try {
      const { id } = req.params;
      const {
        company_name,
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        subscription_plan,
        is_active,
      } = req.body;

      const tenant = await Tenant.findByPk(id);

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      await tenant.update({
        company_name,
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        subscription_plan,
        is_active,
      });

      res.json({ data: tenant });
    } catch (error) {
      logger.error('Admin updateTenant error:', error);
      next(error);
    }
  },

  async deleteTenant(req, res, next) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findByPk(id);

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      await tenant.destroy();

      res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
      logger.error('Admin deleteTenant error:', error);
      next(error);
    }
  },

  /**
   * Update target achievement when tenant is created or commission is generated
   * This function is called automatically after tenant creation
   * Can also be used by other controllers (e.g., commissionController)
   */
  updateTargetAchievement: async function(distributorId, salesmanId, tenant) {
    try {
      const now = new Date();
      const where = {
        [Op.or]: [
          { end_date: { [Op.gte]: now } },
          { end_date: null },
        ],
      };

      // Find targets for distributor or salesman
      if (distributorId) {
        where.distributor_id = distributorId;
      } else if (salesmanId) {
        where.salesman_id = salesmanId;
      } else {
        return; // No distributor or salesman, skip target update
      }

      // Get all active targets
      const targets = await Target.findAll({ where });

      for (const target of targets) {
        const startDate = target.start_date ? new Date(target.start_date) : null;
        const endDate = target.end_date ? new Date(target.end_date) : null;
        
        let achievedValue = 0;

        if (target.target_type === 'subscription') {
          // Count tenants created within target period
          const tenantWhere = {};
          if (distributorId) {
            tenantWhere.distributor_id = distributorId;
          } else if (salesmanId) {
            tenantWhere.salesman_id = salesmanId;
          }

          if (startDate && endDate) {
            tenantWhere.createdAt = { [Op.between]: [startDate, endDate] };
          }

          achievedValue = await TenantMaster.count({ where: tenantWhere });

        } else if (target.target_type === 'revenue') {
          // Sum commission amounts within target period
          const commissionWhere = {};
          if (distributorId) {
            commissionWhere.distributor_id = distributorId;
          } else if (salesmanId) {
            commissionWhere.salesman_id = salesmanId;
          }

          if (startDate && endDate) {
            commissionWhere[Op.or] = [
              { commission_date: { [Op.between]: [startDate, endDate] } },
              { createdAt: { [Op.between]: [startDate, endDate] } },
            ];
          }

          const commissions = await Commission.findAll({ where: commissionWhere });
          achievedValue = commissions.reduce((sum, c) => {
            return sum + parseFloat(c.amount || 0);
          }, 0);
        }

        // Update target with calculated achieved value
        await target.update({ achieved_value: parseFloat(achievedValue.toFixed(2)) });
      }

      logger.info(`Updated target achievement for ${targets.length} targets`);
    } catch (error) {
      logger.error('Error updating target achievement:', error);
      // Don't throw error - target update failure shouldn't block tenant creation
    }
  },
};


