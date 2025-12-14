const { User, Distributor, Salesman, Commission, Payout } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async dashboard(req, res, next) {
    try {
      const [
        totalTenants,
        totalDistributors,
        totalSalesmen,
        activeTenants,
        totalCommissions,
        totalPayouts,
      ] = await Promise.all([
        TenantMaster.count(),
        Distributor.count(),
        Salesman.count(),
        TenantMaster.count({ where: { is_active: true } }),
        Commission.sum('amount'),
        Payout.sum('total_amount'),
      ]);

      res.json({
        data: {
          total_tenants: totalTenants,
          active_tenants: activeTenants,
          total_distributors: totalDistributors,
          total_salesmen: totalSalesmen,
          total_commissions: parseFloat(totalCommissions || 0),
          total_payouts: parseFloat(totalPayouts || 0),
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
            attributes: ['id', 'email', 'full_name', 'role', 'is_active'],
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
      } = req.body;

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
      });

      // Create admin user if email and password provided
      if (email && password) {
        const bcrypt = require('bcryptjs');
        const password_hash = await bcrypt.hash(password, 10);
        await User.create({
          email,
          password_hash,
          tenant_id: tenant.id,
          role: 'tenant_admin',
        });
      }

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
};

