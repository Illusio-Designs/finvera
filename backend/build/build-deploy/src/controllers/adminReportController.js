const { User, Distributor, Salesman, Commission, Payout, Target, SubscriptionPlan } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Helper function to calculate revenue from tenants
 */
function calculateRevenueFromTenants(tenants, planMap) {
  let totalRevenue = 0;
  const planRevenue = {};
  const categoryRevenue = {
    distributor: 0,
    salesman: 0,
    referral: 0,
    organic: 0,
  };

  tenants.forEach(tenant => {
    if (tenant.subscription_plan && planMap[tenant.subscription_plan]) {
      const plan = planMap[tenant.subscription_plan];
      const planPrice = plan.price;
      totalRevenue += planPrice;
      
      // By plan
      if (!planRevenue[tenant.subscription_plan]) {
        planRevenue[tenant.subscription_plan] = {
          plan_name: plan.plan_name,
          count: 0,
          revenue: 0,
        };
      }
      planRevenue[tenant.subscription_plan].count += 1;
      planRevenue[tenant.subscription_plan].revenue += planPrice;

      // By category
      const category = tenant.acquisition_category || 'organic';
      if (categoryRevenue[category] !== undefined) {
        categoryRevenue[category] += planPrice;
      }
    }
  });

  return { totalRevenue, planRevenue, categoryRevenue };
}

module.exports = {
  // ============================================
  // REVENUE REPORTS
  // ============================================

  /**
   * 1. Total Revenue Report
   */
  async getTotalRevenueReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get all active plans
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

      // Get tenants in date range
      const tenantWhere = { is_active: true };
      if (from) {
        tenantWhere.createdAt = { [Op.between]: [from, to] };
      }

      const tenants = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: ['id', 'subscription_plan', 'acquisition_category', 'createdAt'],
      });

      const revenueData = calculateRevenueFromTenants(tenants, planMap);

      // Calculate monthly breakdown (last 12 months)
      const monthlyBreakdown = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthTenants = tenants.filter(t => {
          const tenantDate = new Date(t.createdAt);
          return tenantDate >= monthStart && tenantDate <= monthEnd;
        });
        const monthRevenue = calculateRevenueFromTenants(monthTenants, planMap);
        monthlyBreakdown.push({
          month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          revenue: parseFloat(monthRevenue.totalRevenue.toFixed(2)),
          tenant_count: monthTenants.length,
        });
      }

      // Calculate total commissions
      const commissionWhere = {};
      if (from) {
        commissionWhere.createdAt = { [Op.between]: [from, to] };
      }
      const totalCommissions = await Commission.sum('amount', { where: commissionWhere }) || 0;

      const netRevenue = revenueData.totalRevenue - totalCommissions;
      const arpt = tenants.length > 0 ? revenueData.totalRevenue / tenants.length : 0;

      res.json({
        data: {
          period: {
            from: from || 'All Time',
            to: to.toISOString().split('T')[0],
          },
          summary: {
            total_revenue: parseFloat(revenueData.totalRevenue.toFixed(2)),
            total_commissions: parseFloat(totalCommissions.toFixed(2)),
            net_revenue: parseFloat(netRevenue.toFixed(2)),
            total_tenants: tenants.length,
            average_revenue_per_tenant: parseFloat(arpt.toFixed(2)),
          },
          by_plan: Object.values(revenueData.planRevenue).map(plan => ({
            plan_name: plan.plan_name,
            tenant_count: plan.count,
            revenue: parseFloat(plan.revenue.toFixed(2)),
            percentage: revenueData.totalRevenue > 0 
              ? parseFloat(((plan.revenue / revenueData.totalRevenue) * 100).toFixed(2))
              : 0,
          })),
          monthly_breakdown: monthlyBreakdown,
        },
      });
    } catch (error) {
      logger.error('Total Revenue Report error:', error);
      next(error);
    }
  },

  /**
   * 2. Revenue Comparison Report
   */
  async getRevenueComparisonReport(req, res, next) {
    try {
      const { period1_from, period1_to, period2_from, period2_to } = req.query;
      
      if (!period1_from || !period1_to || !period2_from || !period2_to) {
        return res.status(400).json({ message: 'Both period date ranges are required' });
      }

      const period1Start = new Date(period1_from);
      const period1End = new Date(period1_to);
      const period2Start = new Date(period2_from);
      const period2End = new Date(period2_to);

      // Get plans
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

      // Get tenants for each period
      const [period1Tenants, period2Tenants] = await Promise.all([
        TenantMaster.findAll({
          where: {
            is_active: true,
            createdAt: { [Op.between]: [period1Start, period1End] },
          },
          attributes: ['id', 'subscription_plan', 'acquisition_category'],
        }),
        TenantMaster.findAll({
          where: {
            is_active: true,
            createdAt: { [Op.between]: [period2Start, period2End] },
          },
          attributes: ['id', 'subscription_plan', 'acquisition_category'],
        }),
      ]);

      const period1Revenue = calculateRevenueFromTenants(period1Tenants, planMap);
      const period2Revenue = calculateRevenueFromTenants(period2Tenants, planMap);

      const difference = period2Revenue.totalRevenue - period1Revenue.totalRevenue;
      const growthPercentage = period1Revenue.totalRevenue > 0
        ? parseFloat(((difference / period1Revenue.totalRevenue) * 100).toFixed(2))
        : 0;

      res.json({
        data: {
          period1: {
            from: period1_from,
            to: period1_to,
            revenue: parseFloat(period1Revenue.totalRevenue.toFixed(2)),
            tenant_count: period1Tenants.length,
            by_plan: Object.values(period1Revenue.planRevenue).map(plan => ({
              plan_name: plan.plan_name,
              revenue: parseFloat(plan.revenue.toFixed(2)),
            })),
          },
          period2: {
            from: period2_from,
            to: period2_to,
            revenue: parseFloat(period2Revenue.totalRevenue.toFixed(2)),
            tenant_count: period2Tenants.length,
            by_plan: Object.values(period2Revenue.planRevenue).map(plan => ({
              plan_name: plan.plan_name,
              revenue: parseFloat(plan.revenue.toFixed(2)),
            })),
          },
          comparison: {
            difference: parseFloat(difference.toFixed(2)),
            growth_percentage: growthPercentage,
            is_growth: difference > 0,
          },
        },
      });
    } catch (error) {
      logger.error('Revenue Comparison Report error:', error);
      next(error);
    }
  },

  /**
   * 3. Revenue by Type/Category Report
   */
  async getRevenueByTypeReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get plans
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

      // Get tenants
      const tenantWhere = { is_active: true };
      if (from) {
        tenantWhere.createdAt = { [Op.between]: [from, to] };
      }
      const tenants = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: ['id', 'subscription_plan', 'acquisition_category'],
      });

      const revenueData = calculateRevenueFromTenants(tenants, planMap);

      // Get commissions by type
      const commissionWhere = {};
      if (from) {
        commissionWhere.createdAt = { [Op.between]: [from, to] };
      }
      const commissionsByType = await Commission.findAll({
        where: commissionWhere,
        attributes: [
          'commission_type',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['commission_type'],
        raw: true,
      });

      res.json({
        data: {
          by_acquisition_category: {
            distributor: {
              revenue: parseFloat(revenueData.categoryRevenue.distributor.toFixed(2)),
              tenant_count: tenants.filter(t => t.acquisition_category === 'distributor').length,
            },
            salesman: {
              revenue: parseFloat(revenueData.categoryRevenue.salesman.toFixed(2)),
              tenant_count: tenants.filter(t => t.acquisition_category === 'salesman').length,
            },
            referral: {
              revenue: parseFloat(revenueData.categoryRevenue.referral.toFixed(2)),
              tenant_count: tenants.filter(t => t.acquisition_category === 'referral').length,
            },
            organic: {
              revenue: parseFloat(revenueData.categoryRevenue.organic.toFixed(2)),
              tenant_count: tenants.filter(t => t.acquisition_category === 'organic').length,
            },
          },
          by_subscription_plan: Object.values(revenueData.planRevenue).map(plan => ({
            plan_name: plan.plan_name,
            revenue: parseFloat(plan.revenue.toFixed(2)),
            tenant_count: plan.count,
            percentage: revenueData.totalRevenue > 0
              ? parseFloat(((plan.revenue / revenueData.totalRevenue) * 100).toFixed(2))
              : 0,
          })),
          by_commission_type: commissionsByType.map(ct => ({
            commission_type: ct.commission_type || 'N/A',
            total_amount: parseFloat(ct.total || 0),
            count: parseInt(ct.count || 0),
          })),
          total_revenue: parseFloat(revenueData.totalRevenue.toFixed(2)),
        },
      });
    } catch (error) {
      logger.error('Revenue by Type Report error:', error);
      next(error);
    }
  },

  /**
   * 4. Revenue Trend Report
   */
  async getRevenueTrendReport(req, res, next) {
    try {
      const { period = 'monthly', from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : new Date(new Date().getFullYear(), 0, 1);
      const to = to_date ? new Date(to_date) : new Date();

      // Get plans
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

      const trends = [];
      let currentDate = new Date(from);

      if (period === 'monthly') {
        while (currentDate <= to) {
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const monthTenants = await TenantMaster.findAll({
            where: {
              is_active: true,
              createdAt: { [Op.between]: [monthStart, monthEnd] },
            },
            attributes: ['id', 'subscription_plan'],
          });

          const monthRevenue = calculateRevenueFromTenants(monthTenants, planMap);
          trends.push({
            period: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            revenue: parseFloat(monthRevenue.totalRevenue.toFixed(2)),
            tenant_count: monthTenants.length,
          });

          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
      } else if (period === 'quarterly') {
        while (currentDate <= to) {
          const quarterStart = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
          const quarterEnd = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0);
          
          const quarterTenants = await TenantMaster.findAll({
            where: {
              is_active: true,
              createdAt: { [Op.between]: [quarterStart, quarterEnd] },
            },
            attributes: ['id', 'subscription_plan'],
          });

          const quarterRevenue = calculateRevenueFromTenants(quarterTenants, planMap);
          trends.push({
            period: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`,
            revenue: parseFloat(quarterRevenue.totalRevenue.toFixed(2)),
            tenant_count: quarterTenants.length,
          });

          currentDate = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 1);
        }
      } else if (period === 'yearly') {
        while (currentDate <= to) {
          const yearStart = new Date(currentDate.getFullYear(), 0, 1);
          const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
          
          const yearTenants = await TenantMaster.findAll({
            where: {
              is_active: true,
              createdAt: { [Op.between]: [yearStart, yearEnd] },
            },
            attributes: ['id', 'subscription_plan'],
          });

          const yearRevenue = calculateRevenueFromTenants(yearTenants, planMap);
          trends.push({
            period: yearStart.getFullYear().toString(),
            revenue: parseFloat(yearRevenue.totalRevenue.toFixed(2)),
            tenant_count: yearTenants.length,
          });

          currentDate = new Date(currentDate.getFullYear() + 1, 0, 1);
        }
      }

      // Calculate growth rates
      const trendsWithGrowth = trends.map((trend, index) => {
        if (index === 0) {
          return { ...trend, growth: 0 };
        }
        const prevRevenue = trends[index - 1].revenue;
        const growth = prevRevenue > 0
          ? parseFloat((((trend.revenue - prevRevenue) / prevRevenue) * 100).toFixed(2))
          : 0;
        return { ...trend, growth };
      });

      res.json({
        data: {
          period_type: period,
          from: from.toISOString().split('T')[0],
          to: to.toISOString().split('T')[0],
          trends: trendsWithGrowth,
        },
      });
    } catch (error) {
      logger.error('Revenue Trend Report error:', error);
      next(error);
    }
  },

  // ============================================
  // COMMISSION REPORTS
  // ============================================

  /**
   * 5. Commission Summary Report
   */
  async getCommissionSummaryReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      const commissionWhere = {};
      if (from) {
        commissionWhere.createdAt = { [Op.between]: [from, to] };
      }

      // Get commissions by status
      const [totalCommissions, pendingCommissions, approvedCommissions, cancelledCommissions] = await Promise.all([
        Commission.sum('amount', { where: commissionWhere }),
        Commission.sum('amount', { where: { ...commissionWhere, status: 'pending' } }),
        Commission.sum('amount', { where: { ...commissionWhere, status: 'approved' } }),
        Commission.sum('amount', { where: { ...commissionWhere, status: 'cancelled' } }),
      ]);

      // Get commissions by type
      const commissionsByType = await Commission.findAll({
        where: commissionWhere,
        attributes: [
          'commission_type',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['commission_type'],
        raw: true,
      });

      // Monthly breakdown
      const monthlyBreakdown = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthWhere = {
          ...commissionWhere,
          createdAt: { [Op.between]: [monthStart, monthEnd] },
        };
        const monthTotal = await Commission.sum('amount', { where: monthWhere }) || 0;
        monthlyBreakdown.push({
          month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          amount: parseFloat(monthTotal.toFixed(2)),
        });
      }

      // Calculate revenue for commission ratio
      const allPlans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        attributes: ['plan_code', 'plan_name', 'base_price', 'discounted_price'],
      });
      const planMap = {};
      allPlans.forEach(plan => {
        planMap[plan.plan_code] = {
          price: parseFloat(plan.discounted_price || plan.base_price || 0),
        };
      });
      const tenantWhere = { is_active: true };
      if (from) {
        tenantWhere.createdAt = { [Op.between]: [from, to] };
      }
      const tenants = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: ['subscription_plan'],
      });
      const revenueData = calculateRevenueFromTenants(tenants, planMap);
      const commissionRatio = revenueData.totalRevenue > 0
        ? parseFloat(((totalCommissions / revenueData.totalRevenue) * 100).toFixed(2))
        : 0;

      res.json({
        data: {
          summary: {
            total_commissions: parseFloat((totalCommissions || 0).toFixed(2)),
            pending_commissions: parseFloat((pendingCommissions || 0).toFixed(2)),
            approved_commissions: parseFloat((approvedCommissions || 0).toFixed(2)),
            cancelled_commissions: parseFloat((cancelledCommissions || 0).toFixed(2)),
            commission_to_revenue_ratio: commissionRatio,
          },
          by_type: commissionsByType.map(ct => ({
            commission_type: ct.commission_type || 'N/A',
            total_amount: parseFloat(ct.total || 0),
            count: parseInt(ct.count || 0),
          })),
          monthly_breakdown: monthlyBreakdown,
        },
      });
    } catch (error) {
      logger.error('Commission Summary Report error:', error);
      next(error);
    }
  },

  /**
   * 6. Commission Distribution Report
   */
  async getCommissionDistributionReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      const commissionWhere = {};
      if (from) {
        commissionWhere.createdAt = { [Op.between]: [from, to] };
      }

      // Get distributor commissions
      const distributorCommissions = await Commission.findAll({
        where: {
          ...commissionWhere,
          distributor_id: { [Op.ne]: null },
        },
        include: [
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'], include: [{ model: User, attributes: ['name'] }] },
        ],
        order: [['amount', 'DESC']],
      });

      // Get salesman commissions
      const salesmanCommissions = await Commission.findAll({
        where: {
          ...commissionWhere,
          salesman_id: { [Op.ne]: null },
        },
        include: [
          { model: Salesman, attributes: ['id', 'salesman_code', 'full_name'], include: [{ model: User, attributes: ['name'] }] },
        ],
        order: [['amount', 'DESC']],
      });

      // Aggregate by distributor
      const distributorTotals = {};
      distributorCommissions.forEach(comm => {
        const distId = comm.distributor_id;
        if (!distributorTotals[distId]) {
          distributorTotals[distId] = {
            distributor: comm.Distributor,
            total_commission: 0,
            pending: 0,
            approved: 0,
            count: 0,
          };
        }
        distributorTotals[distId].total_commission += parseFloat(comm.amount || 0);
        distributorTotals[distId][comm.status] = (distributorTotals[distId][comm.status] || 0) + parseFloat(comm.amount || 0);
        distributorTotals[distId].count += 1;
      });

      // Aggregate by salesman
      const salesmanTotals = {};
      salesmanCommissions.forEach(comm => {
        const salesId = comm.salesman_id;
        if (!salesmanTotals[salesId]) {
          salesmanTotals[salesId] = {
            salesman: comm.Salesman,
            total_commission: 0,
            pending: 0,
            approved: 0,
            count: 0,
          };
        }
        salesmanTotals[salesId].total_commission += parseFloat(comm.amount || 0);
        salesmanTotals[salesId][comm.status] = (salesmanTotals[salesId][comm.status] || 0) + parseFloat(comm.amount || 0);
        salesmanTotals[salesId].count += 1;
      });

      res.json({
        data: {
          distributor_summary: {
            total_commissions: parseFloat(
              Object.values(distributorTotals).reduce((sum, d) => sum + d.total_commission, 0).toFixed(2)
            ),
            total_distributors: Object.keys(distributorTotals).length,
            top_earners: Object.values(distributorTotals)
              .sort((a, b) => b.total_commission - a.total_commission)
              .slice(0, 10)
              .map(d => ({
                distributor_code: d.distributor?.distributor_code,
                company_name: d.distributor?.company_name,
                name: d.distributor?.User?.name,
                total_commission: parseFloat(d.total_commission.toFixed(2)),
                pending: parseFloat((d.pending || 0).toFixed(2)),
                approved: parseFloat((d.approved || 0).toFixed(2)),
                commission_count: d.count,
              })),
          },
          salesman_summary: {
            total_commissions: parseFloat(
              Object.values(salesmanTotals).reduce((sum, s) => sum + s.total_commission, 0).toFixed(2)
            ),
            total_salesmen: Object.keys(salesmanTotals).length,
            top_earners: Object.values(salesmanTotals)
              .sort((a, b) => b.total_commission - a.total_commission)
              .slice(0, 10)
              .map(s => ({
                salesman_code: s.salesman?.salesman_code,
                full_name: s.salesman?.full_name,
                name: s.salesman?.User?.name,
                total_commission: parseFloat(s.total_commission.toFixed(2)),
                pending: parseFloat((s.pending || 0).toFixed(2)),
                approved: parseFloat((s.approved || 0).toFixed(2)),
                commission_count: s.count,
              })),
          },
          all_commissions: {
            distributors: distributorCommissions.map(c => ({
              id: c.id,
              distributor: c.Distributor ? {
                code: c.Distributor.distributor_code,
                name: c.Distributor.company_name,
              } : null,
              amount: parseFloat(c.amount),
              status: c.status,
              commission_type: c.commission_type,
              date: c.createdAt,
            })),
            salesmen: salesmanCommissions.map(c => ({
              id: c.id,
              salesman: c.Salesman ? {
                code: c.Salesman.salesman_code,
                name: c.Salesman.full_name,
              } : null,
              amount: parseFloat(c.amount),
              status: c.status,
              commission_type: c.commission_type,
              date: c.createdAt,
            })),
          },
        },
      });
    } catch (error) {
      logger.error('Commission Distribution Report error:', error);
      next(error);
    }
  },

  // ============================================
  // PERFORMANCE REPORTS
  // ============================================

  /**
   * 7. Distributor Performance Report
   */
  async getDistributorPerformanceReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get all distributors
      const distributors = await Distributor.findAll({
        include: [
          { model: User, attributes: ['id', 'name', 'email'] },
        ],
      });

      // Get plans for revenue calculation
      const allPlans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        attributes: ['plan_code', 'plan_name', 'base_price', 'discounted_price'],
      });
      const planMap = {};
      allPlans.forEach(plan => {
        planMap[plan.plan_code] = {
          price: parseFloat(plan.discounted_price || plan.base_price || 0),
        };
      });

      const performanceData = await Promise.all(
        distributors.map(async (distributor) => {
          // Get tenants
          const tenantWhere = { distributor_id: distributor.id, is_active: true };
          if (from) {
            tenantWhere.createdAt = { [Op.between]: [from, to] };
          }
          const tenants = await TenantMaster.findAll({
            where: tenantWhere,
            attributes: ['id', 'subscription_plan'],
          });

          // Calculate revenue
          const revenueData = calculateRevenueFromTenants(tenants, planMap);

          // Get commissions
          const commissionWhere = { distributor_id: distributor.id };
          if (from) {
            commissionWhere.createdAt = { [Op.between]: [from, to] };
          }
          const totalCommissions = await Commission.sum('amount', { where: commissionWhere }) || 0;

          // Get targets
          const targets = await Target.findAll({
            where: {
              distributor_id: distributor.id,
              [Op.or]: [
                { end_date: { [Op.gte]: new Date() } },
                { end_date: null },
              ],
            },
          });

          let totalTarget = 0;
          let totalAchieved = 0;
          targets.forEach(target => {
            totalTarget += parseFloat(target.target_value || 0);
            totalAchieved += parseFloat(target.achieved_value || 0);
          });

          const achievementPercentage = totalTarget > 0
            ? parseFloat(((totalAchieved / totalTarget) * 100).toFixed(2))
            : 0;

          return {
            distributor_id: distributor.id,
            distributor_code: distributor.distributor_code,
            company_name: distributor.company_name,
            name: distributor.User?.name,
            email: distributor.User?.email,
            tenants_acquired: tenants.length,
            revenue_generated: parseFloat(revenueData.totalRevenue.toFixed(2)),
            commissions_earned: parseFloat(totalCommissions.toFixed(2)),
            target_value: parseFloat(totalTarget.toFixed(2)),
            achieved_value: parseFloat(totalAchieved.toFixed(2)),
            achievement_percentage: achievementPercentage,
            is_active: distributor.is_active,
          };
        })
      );

      // Sort by revenue (top performers first)
      performanceData.sort((a, b) => b.revenue_generated - a.revenue_generated);

      res.json({
        data: {
          total_distributors: distributors.length,
          performance: performanceData,
          top_performers: performanceData.slice(0, 10),
        },
      });
    } catch (error) {
      logger.error('Distributor Performance Report error:', error);
      next(error);
    }
  },

  /**
   * 8. Salesman Performance Report
   */
  async getSalesmanPerformanceReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get all salesmen
      const salesmen = await Salesman.findAll({
        include: [
          { model: User, attributes: ['id', 'name', 'email'] },
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
        ],
      });

      // Get plans for revenue calculation
      const allPlans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        attributes: ['plan_code', 'plan_name', 'base_price', 'discounted_price'],
      });
      const planMap = {};
      allPlans.forEach(plan => {
        planMap[plan.plan_code] = {
          price: parseFloat(plan.discounted_price || plan.base_price || 0),
        };
      });

      const performanceData = await Promise.all(
        salesmen.map(async (salesman) => {
          // Get tenants
          const tenantWhere = { salesman_id: salesman.id, is_active: true };
          if (from) {
            tenantWhere.createdAt = { [Op.between]: [from, to] };
          }
          const tenants = await TenantMaster.findAll({
            where: tenantWhere,
            attributes: ['id', 'subscription_plan'],
          });

          // Calculate revenue
          const revenueData = calculateRevenueFromTenants(tenants, planMap);

          // Get commissions
          const commissionWhere = { salesman_id: salesman.id };
          if (from) {
            commissionWhere.createdAt = { [Op.between]: [from, to] };
          }
          const totalCommissions = await Commission.sum('amount', { where: commissionWhere }) || 0;

          // Get targets
          const targets = await Target.findAll({
            where: {
              salesman_id: salesman.id,
              [Op.or]: [
                { end_date: { [Op.gte]: new Date() } },
                { end_date: null },
              ],
            },
          });

          let totalTarget = 0;
          let totalAchieved = 0;
          targets.forEach(target => {
            totalTarget += parseFloat(target.target_value || 0);
            totalAchieved += parseFloat(target.achieved_value || 0);
          });

          const achievementPercentage = totalTarget > 0
            ? parseFloat(((totalAchieved / totalTarget) * 100).toFixed(2))
            : 0;

          return {
            salesman_id: salesman.id,
            salesman_code: salesman.salesman_code,
            full_name: salesman.full_name,
            name: salesman.User?.name,
            email: salesman.User?.email,
            distributor: salesman.Distributor ? {
              code: salesman.Distributor.distributor_code,
              company_name: salesman.Distributor.company_name,
            } : null,
            tenants_acquired: tenants.length,
            revenue_generated: parseFloat(revenueData.totalRevenue.toFixed(2)),
            commissions_earned: parseFloat(totalCommissions.toFixed(2)),
            target_value: parseFloat(totalTarget.toFixed(2)),
            achieved_value: parseFloat(totalAchieved.toFixed(2)),
            achievement_percentage: achievementPercentage,
            is_active: salesman.is_active,
          };
        })
      );

      // Sort by revenue (top performers first)
      performanceData.sort((a, b) => b.revenue_generated - a.revenue_generated);

      res.json({
        data: {
          total_salesmen: salesmen.length,
          performance: performanceData,
          top_performers: performanceData.slice(0, 10),
        },
      });
    } catch (error) {
      logger.error('Salesman Performance Report error:', error);
      next(error);
    }
  },

  /**
   * 9. Target Achievement Report
   */
  async getTargetAchievementReport(req, res, next) {
    try {
      const { type, period } = req.query; // type: 'revenue' | 'subscription', period: 'monthly' | 'quarterly' | 'yearly'

      const now = new Date();
      const where = {
        [Op.or]: [
          { end_date: { [Op.gte]: now } },
          { end_date: null },
        ],
      };

      if (type) {
        where.target_type = type;
      }

      const targets = await Target.findAll({
        where,
        include: [
          {
            model: Distributor,
            attributes: ['id', 'distributor_code', 'company_name'],
            include: [{ model: User, attributes: ['name'], required: false }],
            required: false,
          },
          {
            model: Salesman,
            attributes: ['id', 'salesman_code', 'full_name'],
            include: [{ model: User, attributes: ['name'], required: false }],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const targetData = targets.map(target => {
        const achievementPercentage = target.target_value > 0
          ? parseFloat(((target.achieved_value / target.target_value) * 100).toFixed(2))
          : 0;

        let owner = null;
        if (target.distributor_id && target.Distributor) {
          owner = {
            type: 'distributor',
            code: target.Distributor.distributor_code,
            name: target.Distributor.company_name || target.Distributor.User?.name,
          };
        } else if (target.salesman_id && target.Salesman) {
          owner = {
            type: 'salesman',
            code: target.Salesman.salesman_code,
            name: target.Salesman.full_name || target.Salesman.User?.name,
          };
        }

        return {
          id: target.id,
          owner,
          target_type: target.target_type,
          target_period: target.target_period,
          target_value: parseFloat(target.target_value),
          achieved_value: parseFloat(target.achieved_value),
          left_to_achieve: parseFloat((target.target_value - target.achieved_value).toFixed(2)),
          achievement_percentage: achievementPercentage,
          status: achievementPercentage >= 100 ? 'exceeded' : achievementPercentage >= 80 ? 'on_track' : 'behind',
          start_date: target.start_date,
          end_date: target.end_date,
        };
      });

      // Group by period if specified
      let groupedData = targetData;
      if (period) {
        const groups = {};
        targetData.forEach(target => {
          const key = target.target_period || 'other';
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(target);
        });
        groupedData = groups;
      }

      res.json({
        data: {
          total_targets: targets.length,
          summary: {
            total_target_value: parseFloat(
              targetData.reduce((sum, t) => sum + t.target_value, 0).toFixed(2)
            ),
            total_achieved_value: parseFloat(
              targetData.reduce((sum, t) => sum + t.achieved_value, 0).toFixed(2)
            ),
            overall_achievement_percentage: targetData.reduce((sum, t) => sum + t.target_value, 0) > 0
              ? parseFloat((
                  (targetData.reduce((sum, t) => sum + t.achieved_value, 0) /
                   targetData.reduce((sum, t) => sum + t.target_value, 0)) * 100
                ).toFixed(2))
              : 0,
          },
          targets: groupedData,
        },
      });
    } catch (error) {
      logger.error('Target Achievement Report error:', error);
      next(error);
    }
  },

  // ============================================
  // CATEGORIZATION REPORTS
  // ============================================

  /**
   * 10. Distributor Categorization Report
   */
  async getDistributorCategorizationReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get all distributors with performance data
      const distributors = await Distributor.findAll({
        include: [{ model: User, attributes: ['name', 'email'] }],
      });

      // Get plans
      const allPlans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        attributes: ['plan_code', 'base_price', 'discounted_price'],
      });
      const planMap = {};
      allPlans.forEach(plan => {
        planMap[plan.plan_code] = {
          price: parseFloat(plan.discounted_price || plan.base_price || 0),
        };
      });

      const distributorData = await Promise.all(
        distributors.map(async (dist) => {
          const tenantWhere = { distributor_id: dist.id, is_active: true };
          if (from) {
            tenantWhere.createdAt = { [Op.between]: [from, to] };
          }
          const tenants = await TenantMaster.findAll({
            where: tenantWhere,
            attributes: ['subscription_plan'],
          });
          const revenueData = calculateRevenueFromTenants(tenants, planMap);
          const commissions = await Commission.sum('amount', {
            where: { distributor_id: dist.id },
          }) || 0;

          return {
            distributor_id: dist.id,
            distributor_code: dist.distributor_code,
            company_name: dist.company_name,
            name: dist.User?.name,
            revenue: parseFloat(revenueData.totalRevenue.toFixed(2)),
            tenant_count: tenants.length,
            commissions: parseFloat(commissions.toFixed(2)),
          };
        })
      );

      // Sort by revenue
      distributorData.sort((a, b) => b.revenue - a.revenue);

      // Categorize into tiers (Top 20%, Middle 60%, Bottom 20%)
      const total = distributorData.length;
      const top20Count = Math.ceil(total * 0.2);
      const bottom20Count = Math.floor(total * 0.2);

      const topPerformers = distributorData.slice(0, top20Count);
      const averagePerformers = distributorData.slice(top20Count, total - bottom20Count);
      const lowPerformers = distributorData.slice(total - bottom20Count);

      // Revenue ranges
      const revenueRanges = {
        high: { min: 100000, label: 'High (₹1L+)', count: 0, revenue: 0 },
        medium: { min: 50000, max: 100000, label: 'Medium (₹50K-₹1L)', count: 0, revenue: 0 },
        low: { max: 50000, label: 'Low (<₹50K)', count: 0, revenue: 0 },
      };

      distributorData.forEach(dist => {
        if (dist.revenue >= revenueRanges.high.min) {
          revenueRanges.high.count++;
          revenueRanges.high.revenue += dist.revenue;
        } else if (dist.revenue >= revenueRanges.medium.min) {
          revenueRanges.medium.count++;
          revenueRanges.medium.revenue += dist.revenue;
        } else {
          revenueRanges.low.count++;
          revenueRanges.low.revenue += dist.revenue;
        }
      });

      res.json({
        data: {
          by_performance_tier: {
            top_performers: {
              count: topPerformers.length,
              percentage: total > 0 ? parseFloat(((topPerformers.length / total) * 100).toFixed(2)) : 0,
              total_revenue: parseFloat(topPerformers.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)),
              distributors: topPerformers,
            },
            average_performers: {
              count: averagePerformers.length,
              percentage: total > 0 ? parseFloat(((averagePerformers.length / total) * 100).toFixed(2)) : 0,
              total_revenue: parseFloat(averagePerformers.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)),
              distributors: averagePerformers,
            },
            low_performers: {
              count: lowPerformers.length,
              percentage: total > 0 ? parseFloat(((lowPerformers.length / total) * 100).toFixed(2)) : 0,
              total_revenue: parseFloat(lowPerformers.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)),
              distributors: lowPerformers,
            },
          },
          by_revenue_range: {
            high: {
              ...revenueRanges.high,
              revenue: parseFloat(revenueRanges.high.revenue.toFixed(2)),
            },
            medium: {
              ...revenueRanges.medium,
              revenue: parseFloat(revenueRanges.medium.revenue.toFixed(2)),
            },
            low: {
              ...revenueRanges.low,
              revenue: parseFloat(revenueRanges.low.revenue.toFixed(2)),
            },
          },
          by_tenant_count: {
            high: {
              label: 'High (10+ tenants)',
              count: distributorData.filter(d => d.tenant_count >= 10).length,
            },
            medium: {
              label: 'Medium (5-9 tenants)',
              count: distributorData.filter(d => d.tenant_count >= 5 && d.tenant_count < 10).length,
            },
            low: {
              label: 'Low (<5 tenants)',
              count: distributorData.filter(d => d.tenant_count < 5).length,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Distributor Categorization Report error:', error);
      next(error);
    }
  },

  /**
   * 11. Salesman Categorization Report
   */
  async getSalesmanCategorizationReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get all salesmen with performance data
      const salesmen = await Salesman.findAll({
        include: [
          { model: User, attributes: ['name', 'email'] },
          { model: Distributor, attributes: ['distributor_code', 'company_name'] },
        ],
      });

      // Get plans
      const allPlans = await SubscriptionPlan.findAll({
        where: { is_active: true },
        attributes: ['plan_code', 'base_price', 'discounted_price'],
      });
      const planMap = {};
      allPlans.forEach(plan => {
        planMap[plan.plan_code] = {
          price: parseFloat(plan.discounted_price || plan.base_price || 0),
        };
      });

      const salesmanData = await Promise.all(
        salesmen.map(async (sales) => {
          const tenantWhere = { salesman_id: sales.id, is_active: true };
          if (from) {
            tenantWhere.createdAt = { [Op.between]: [from, to] };
          }
          const tenants = await TenantMaster.findAll({
            where: tenantWhere,
            attributes: ['subscription_plan'],
          });
          const revenueData = calculateRevenueFromTenants(tenants, planMap);
          const commissions = await Commission.sum('amount', {
            where: { salesman_id: sales.id },
          }) || 0;

          return {
            salesman_id: sales.id,
            salesman_code: sales.salesman_code,
            full_name: sales.full_name,
            name: sales.User?.name,
            distributor: sales.Distributor ? {
              code: sales.Distributor.distributor_code,
              company_name: sales.Distributor.company_name,
            } : null,
            revenue: parseFloat(revenueData.totalRevenue.toFixed(2)),
            tenant_count: tenants.length,
            commissions: parseFloat(commissions.toFixed(2)),
          };
        })
      );

      // Sort by revenue
      salesmanData.sort((a, b) => b.revenue - a.revenue);

      // Categorize into tiers
      const total = salesmanData.length;
      const top20Count = Math.ceil(total * 0.2);
      const bottom20Count = Math.floor(total * 0.2);

      const topPerformers = salesmanData.slice(0, top20Count);
      const averagePerformers = salesmanData.slice(top20Count, total - bottom20Count);
      const lowPerformers = salesmanData.slice(total - bottom20Count);

      // Revenue ranges
      const revenueRanges = {
        high: { min: 50000, label: 'High (₹50K+)', count: 0, revenue: 0 },
        medium: { min: 25000, max: 50000, label: 'Medium (₹25K-₹50K)', count: 0, revenue: 0 },
        low: { max: 25000, label: 'Low (<₹25K)', count: 0, revenue: 0 },
      };

      salesmanData.forEach(sales => {
        if (sales.revenue >= revenueRanges.high.min) {
          revenueRanges.high.count++;
          revenueRanges.high.revenue += sales.revenue;
        } else if (sales.revenue >= revenueRanges.medium.min) {
          revenueRanges.medium.count++;
          revenueRanges.medium.revenue += sales.revenue;
        } else {
          revenueRanges.low.count++;
          revenueRanges.low.revenue += sales.revenue;
        }
      });

      // Group by distributor
      const byDistributor = {};
      salesmanData.forEach(sales => {
        const distCode = sales.distributor?.code || 'No Distributor';
        if (!byDistributor[distCode]) {
          byDistributor[distCode] = {
            distributor_code: distCode,
            distributor_name: sales.distributor?.company_name || 'N/A',
            salesman_count: 0,
            total_revenue: 0,
            salesmen: [],
          };
        }
        byDistributor[distCode].salesman_count++;
        byDistributor[distCode].total_revenue += sales.revenue;
        byDistributor[distCode].salesmen.push(sales);
      });

      res.json({
        data: {
          by_performance_tier: {
            top_performers: {
              count: topPerformers.length,
              percentage: total > 0 ? parseFloat(((topPerformers.length / total) * 100).toFixed(2)) : 0,
              total_revenue: parseFloat(topPerformers.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)),
              salesmen: topPerformers,
            },
            average_performers: {
              count: averagePerformers.length,
              percentage: total > 0 ? parseFloat(((averagePerformers.length / total) * 100).toFixed(2)) : 0,
              total_revenue: parseFloat(averagePerformers.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)),
              salesmen: averagePerformers,
            },
            low_performers: {
              count: lowPerformers.length,
              percentage: total > 0 ? parseFloat(((lowPerformers.length / total) * 100).toFixed(2)) : 0,
              total_revenue: parseFloat(lowPerformers.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)),
              salesmen: lowPerformers,
            },
          },
          by_revenue_range: {
            high: {
              ...revenueRanges.high,
              revenue: parseFloat(revenueRanges.high.revenue.toFixed(2)),
            },
            medium: {
              ...revenueRanges.medium,
              revenue: parseFloat(revenueRanges.medium.revenue.toFixed(2)),
            },
            low: {
              ...revenueRanges.low,
              revenue: parseFloat(revenueRanges.low.revenue.toFixed(2)),
            },
          },
          by_distributor: Object.values(byDistributor).map(dist => ({
            ...dist,
            total_revenue: parseFloat(dist.total_revenue.toFixed(2)),
          })),
        },
      });
    } catch (error) {
      logger.error('Salesman Categorization Report error:', error);
      next(error);
    }
  },

  /**
   * 12. Tenant Acquisition Report
   */
  async getTenantAcquisitionReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      const tenantWhere = {};
      if (from) {
        tenantWhere.createdAt = { [Op.between]: [from, to] };
      }

      // By acquisition category
      const byCategory = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: [
          'acquisition_category',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['acquisition_category'],
        raw: true,
      });

      // By subscription plan
      const byPlan = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: [
          'subscription_plan',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['subscription_plan'],
        raw: true,
      });

      // By status
      const byStatus = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: [
          'is_active',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['is_active'],
        raw: true,
      });

      // Monthly breakdown
      const monthlyBreakdown = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthCount = await TenantMaster.count({
          where: {
            ...tenantWhere,
            createdAt: { [Op.between]: [monthStart, monthEnd] },
          },
        });
        monthlyBreakdown.push({
          month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          count: monthCount,
        });
      }

      const totalTenants = await TenantMaster.count({ where: tenantWhere });

      res.json({
        data: {
          total_tenants: totalTenants,
          by_acquisition_category: byCategory.map(cat => ({
            category: cat.acquisition_category || 'organic',
            count: parseInt(cat.count || 0),
            percentage: totalTenants > 0
              ? parseFloat(((cat.count / totalTenants) * 100).toFixed(2))
              : 0,
          })),
          by_subscription_plan: byPlan.map(plan => ({
            plan: plan.subscription_plan || 'N/A',
            count: parseInt(plan.count || 0),
            percentage: totalTenants > 0
              ? parseFloat(((plan.count / totalTenants) * 100).toFixed(2))
              : 0,
          })),
          by_status: byStatus.map(status => ({
            status: status.is_active ? 'active' : 'inactive',
            count: parseInt(status.count || 0),
            percentage: totalTenants > 0
              ? parseFloat(((status.count / totalTenants) * 100).toFixed(2))
              : 0,
          })),
          monthly_breakdown: monthlyBreakdown,
        },
      });
    } catch (error) {
      logger.error('Tenant Acquisition Report error:', error);
      next(error);
    }
  },

  // ============================================
  // SUMMARY REPORTS
  // ============================================

  /**
   * 13. Executive Summary Report
   */
  async getExecutiveSummaryReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get all key metrics
      const [
        totalTenants,
        activeTenants,
        totalDistributors,
        totalSalesmen,
        allTenants,
        totalCommissions,
        totalPayouts,
      ] = await Promise.all([
        TenantMaster.count({ where: from ? { createdAt: { [Op.gte]: from } } : {} }),
        TenantMaster.count({ where: { is_active: true } }),
        Distributor.count(),
        Salesman.count(),
        TenantMaster.findAll({
          where: from ? { createdAt: { [Op.gte]: from }, is_active: true } : { is_active: true },
          attributes: ['id', 'subscription_plan', 'acquisition_category'],
        }),
        Commission.sum('amount', { where: from ? { createdAt: { [Op.gte]: from } } : {} }),
        Payout.sum('total_amount', { where: from ? { createdAt: { [Op.gte]: from } } : {} }),
      ]);

      // Get plans
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

      const revenueData = calculateRevenueFromTenants(allTenants, planMap);

      // Get top 10 distributors
      const distributors = await Distributor.findAll({
        include: [{ model: User, attributes: ['name'] }],
      });
      const distributorPerformance = await Promise.all(
        distributors.map(async (dist) => {
          const tenants = await TenantMaster.count({
            where: { distributor_id: dist.id, is_active: true },
          });
          const revenue = await TenantMaster.findAll({
            where: { distributor_id: dist.id, is_active: true },
            attributes: ['subscription_plan'],
          });
          const distRevenue = calculateRevenueFromTenants(revenue, planMap);
          return {
            distributor_code: dist.distributor_code,
            company_name: dist.company_name,
            name: dist.User?.name,
            tenants: tenants,
            revenue: parseFloat(distRevenue.totalRevenue.toFixed(2)),
          };
        })
      );
      distributorPerformance.sort((a, b) => b.revenue - a.revenue);

      // Get top 10 salesmen
      const salesmen = await Salesman.findAll({
        include: [{ model: User, attributes: ['name'] }],
      });
      const salesmanPerformance = await Promise.all(
        salesmen.map(async (sales) => {
          const tenants = await TenantMaster.count({
            where: { salesman_id: sales.id, is_active: true },
          });
          const revenue = await TenantMaster.findAll({
            where: { salesman_id: sales.id, is_active: true },
            attributes: ['subscription_plan'],
          });
          const salesRevenue = calculateRevenueFromTenants(revenue, planMap);
          return {
            salesman_code: sales.salesman_code,
            full_name: sales.full_name,
            name: sales.User?.name,
            tenants: tenants,
            revenue: parseFloat(salesRevenue.totalRevenue.toFixed(2)),
          };
        })
      );
      salesmanPerformance.sort((a, b) => b.revenue - a.revenue);

      res.json({
        data: {
          period: {
            from: from ? from.toISOString().split('T')[0] : 'All Time',
            to: to.toISOString().split('T')[0],
          },
          key_metrics: {
            total_revenue: parseFloat(revenueData.totalRevenue.toFixed(2)),
            total_commissions: parseFloat((totalCommissions || 0).toFixed(2)),
            net_revenue: parseFloat((revenueData.totalRevenue - (totalCommissions || 0)).toFixed(2)),
            total_tenants: totalTenants,
            active_tenants: activeTenants,
            total_distributors: totalDistributors,
            total_salesmen: totalSalesmen,
            total_payouts: parseFloat((totalPayouts || 0).toFixed(2)),
          },
          top_performers: {
            top_10_distributors: distributorPerformance.slice(0, 10),
            top_10_salesmen: salesmanPerformance.slice(0, 10),
          },
          revenue_by_category: {
            distributor: parseFloat(revenueData.categoryRevenue.distributor.toFixed(2)),
            salesman: parseFloat(revenueData.categoryRevenue.salesman.toFixed(2)),
            referral: parseFloat(revenueData.categoryRevenue.referral.toFixed(2)),
            organic: parseFloat(revenueData.categoryRevenue.organic.toFixed(2)),
          },
        },
      });
    } catch (error) {
      logger.error('Executive Summary Report error:', error);
      next(error);
    }
  },

  /**
   * 14. Financial Summary Report
   */
  async getFinancialSummaryReport(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : null;
      const to = to_date ? new Date(to_date) : new Date();

      // Get revenue
      const tenantWhere = { is_active: true };
      if (from) {
        tenantWhere.createdAt = { [Op.between]: [from, to] };
      }
      const tenants = await TenantMaster.findAll({
        where: tenantWhere,
        attributes: ['id', 'subscription_plan'],
      });

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

      const revenueData = calculateRevenueFromTenants(tenants, planMap);

      // Get commissions and payouts
      const commissionWhere = {};
      const payoutWhere = {};
      if (from) {
        commissionWhere.createdAt = { [Op.between]: [from, to] };
        payoutWhere.createdAt = { [Op.between]: [from, to] };
      }

      const [totalCommissions, totalPayouts, pendingCommissions] = await Promise.all([
        Commission.sum('amount', { where: commissionWhere }),
        Payout.sum('total_amount', { where: payoutWhere }),
        Commission.sum('amount', { where: { ...commissionWhere, status: 'pending' } }),
      ]);

      const netProfit = revenueData.totalRevenue - (totalCommissions || 0);
      const profitMargin = revenueData.totalRevenue > 0
        ? parseFloat(((netProfit / revenueData.totalRevenue) * 100).toFixed(2))
        : 0;

      // Revenue by plan
      const revenueByPlan = Object.values(revenueData.planRevenue).map(plan => ({
        plan_name: plan.plan_name,
        revenue: parseFloat(plan.revenue.toFixed(2)),
        tenant_count: plan.count,
        percentage: revenueData.totalRevenue > 0
          ? parseFloat(((plan.revenue / revenueData.totalRevenue) * 100).toFixed(2))
          : 0,
      }));

      res.json({
        data: {
          period: {
            from: from ? from.toISOString().split('T')[0] : 'All Time',
            to: to.toISOString().split('T')[0],
          },
          revenue: {
            total: parseFloat(revenueData.totalRevenue.toFixed(2)),
            by_plan: revenueByPlan,
          },
          expenses: {
            total_commissions: parseFloat((totalCommissions || 0).toFixed(2)),
            total_payouts: parseFloat((totalPayouts || 0).toFixed(2)),
            pending_commissions: parseFloat((pendingCommissions || 0).toFixed(2)),
          },
          financial_health: {
            net_profit: parseFloat(netProfit.toFixed(2)),
            profit_margin: profitMargin,
            pending_liabilities: parseFloat((pendingCommissions || 0).toFixed(2)),
            cash_flow: parseFloat((netProfit - (totalPayouts || 0)).toFixed(2)),
          },
        },
      });
    } catch (error) {
      logger.error('Financial Summary Report error:', error);
      next(error);
    }
  },
};
