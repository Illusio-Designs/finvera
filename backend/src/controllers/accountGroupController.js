const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async list(req, res, next) {
    try {
      // AccountGroup is in master models (shared across all tenants)
      const AccountGroup = req.masterModels?.AccountGroup;
      if (!AccountGroup) {
        return res.status(500).json({ 
          success: false,
          message: 'AccountGroup model not available' 
        });
      }

      const { page = 1, limit = 20, search, group_type } = req.query;
      const offset = (page - 1) * limit;
      const where = {}; // AccountGroup is shared, no tenant_id filter

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { group_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (group_type) {
        where.nature = group_type; // Use 'nature' field instead of 'group_type'
      }

      const { count, rows } = await AccountGroup.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [{ association: 'parent', attributes: ['id', 'name', 'group_code'] }],
        order: [['group_code', 'ASC']],
      });

      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('AccountGroup list error:', error);
      next(error);
    }
  },

  async getTree(req, res, next) {
    try {
      const AccountGroup = req.masterModels?.AccountGroup;
      if (!AccountGroup) {
        return res.status(500).json({ 
          success: false,
          message: 'AccountGroup model not available' 
        });
      }

      const groups = await AccountGroup.findAll({
        where: {}, // AccountGroup is shared, no tenant_id filter
        include: [{ association: 'parent', attributes: ['id', 'name', 'group_code'] }],
        order: [['group_code', 'ASC']],
      });

      // Build tree structure
      const tree = [];
      const map = {};

      // First pass: create map
      groups.forEach((group) => {
        map[group.id] = { ...group.toJSON(), children: [] };
      });

      // Second pass: build tree
      groups.forEach((group) => {
        const node = map[group.id];
        if (group.parent_id && map[group.parent_id]) {
          map[group.parent_id].children.push(node);
        } else {
          tree.push(node);
        }
      });

      res.json({ data: tree });
    } catch (error) {
      logger.error('AccountGroup tree error:', error);
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      return res.status(403).json({
        success: false,
        message: 'Account groups are read-only (managed by system)',
      });
    } catch (error) {
      logger.error('AccountGroup create error:', error);
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const AccountGroup = req.masterModels?.AccountGroup;
      if (!AccountGroup) {
        return res.status(500).json({ 
          success: false,
          message: 'AccountGroup model not available' 
        });
      }

      const { id } = req.params;
      const group = await AccountGroup.findOne({
        where: { id }, // AccountGroup is shared, no tenant_id filter
        include: [
          { association: 'parent', attributes: ['id', 'name', 'group_code'] },
          { association: 'children', attributes: ['id', 'name', 'group_code'] },
        ],
      });

      if (!group) {
        return res.status(404).json({ 
          success: false,
          message: 'Account group not found' 
        });
      }

      res.json({ data: group });
    } catch (error) {
      logger.error('AccountGroup getById error:', error);
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      return res.status(403).json({
        success: false,
        message: 'Account groups are read-only (managed by system)',
      });
    } catch (error) {
      logger.error('AccountGroup update error:', error);
      next(error);
    }
  },
};

