const { AccountGroup } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, group_type } = req.query;
      const offset = (page - 1) * limit;
      const where = { tenant_id: req.tenant_id };

      if (search) {
        where[Op.or] = [
          { group_name: { [Op.like]: `%${search}%` } },
          { group_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (group_type) {
        where.group_type = group_type;
      }

      const { count, rows } = await AccountGroup.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [{ association: 'parent', attributes: ['id', 'group_name', 'group_code'] }],
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
      const groups = await AccountGroup.findAll({
        where: { tenant_id: req.tenant_id },
        include: [{ association: 'parent', attributes: ['id', 'group_name', 'group_code'] }],
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
      const { group_name, group_code, parent_id, group_type, schedule_iii_category } = req.body;

      const group = await AccountGroup.create({
        tenant_id: req.tenant_id,
        group_name,
        group_code,
        parent_id: parent_id || null,
        group_type: group_type || 'asset',
        schedule_iii_category,
      });

      res.status(201).json({ data: group });
    } catch (error) {
      logger.error('AccountGroup create error:', error);
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const group = await AccountGroup.findOne({
        where: { id, tenant_id: req.tenant_id },
        include: [
          { association: 'parent', attributes: ['id', 'group_name', 'group_code'] },
          { association: 'children', attributes: ['id', 'group_name', 'group_code'] },
        ],
      });

      if (!group) {
        return res.status(404).json({ message: 'Account group not found' });
      }

      res.json({ data: group });
    } catch (error) {
      logger.error('AccountGroup getById error:', error);
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { group_name, group_code, parent_id, group_type, schedule_iii_category } = req.body;

      const group = await AccountGroup.findOne({
        where: { id, tenant_id: req.tenant_id },
      });

      if (!group) {
        return res.status(404).json({ message: 'Account group not found' });
      }

      await group.update({
        group_name,
        group_code,
        parent_id: parent_id || null,
        group_type,
        schedule_iii_category,
      });

      res.json({ data: group });
    } catch (error) {
      logger.error('AccountGroup update error:', error);
      next(error);
    }
  },
};

