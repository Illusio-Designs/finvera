const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, is_active } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { item_name: { [Op.like]: `%${search}%` } },
          { item_code: { [Op.like]: `%${search}%` } },
          { hsn_sac_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true' || is_active === true;
      }

      const { count, rows } = await req.tenantModels.InventoryItem.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['item_name', 'ASC']],
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
      logger.error('Error listing inventory items:', error);
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await req.tenantModels.InventoryItem.findByPk(id);

      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      res.json({ data: item });
    } catch (error) {
      logger.error('Error getting inventory item:', error);
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        item_code,
        item_name,
        hsn_sac_code,
        uqc,
        gst_rate,
        quantity_on_hand = 0,
        avg_cost = 0,
        is_active = true,
      } = req.body;

      if (!item_name) {
        return res.status(400).json({ error: 'Item name is required' });
      }

      // Generate item_key from item_code or item_name
      const itemKey = (item_code || item_name).trim().toLowerCase();

      // Check if item with same key already exists
      const existing = await req.tenantModels.InventoryItem.findOne({
        where: { item_key: itemKey },
      });

      if (existing) {
        return res.status(400).json({ 
          error: 'An item with this code or name already exists' 
        });
      }

      const item = await req.tenantModels.InventoryItem.create({
        item_key: itemKey,
        item_code: item_code || null,
        item_name,
        hsn_sac_code: hsn_sac_code || null,
        uqc: uqc || null,
        gst_rate: gst_rate || null,
        quantity_on_hand: parseFloat(quantity_on_hand) || 0,
        avg_cost: parseFloat(avg_cost) || 0,
        is_active: is_active !== false,
      });

      res.status(201).json({ data: item });
    } catch (error) {
      logger.error('Error creating inventory item:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          error: 'An item with this code or name already exists' 
        });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        item_code,
        item_name,
        hsn_sac_code,
        uqc,
        gst_rate,
        quantity_on_hand,
        avg_cost,
        is_active,
      } = req.body;

      const item = await req.tenantModels.InventoryItem.findByPk(id);

      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      // If item_code or item_name is being updated, regenerate item_key
      const updateData = {};
      if (item_code !== undefined) updateData.item_code = item_code || null;
      if (item_name !== undefined) updateData.item_name = item_name;
      if (hsn_sac_code !== undefined) updateData.hsn_sac_code = hsn_sac_code || null;
      if (uqc !== undefined) updateData.uqc = uqc || null;
      if (gst_rate !== undefined) updateData.gst_rate = gst_rate || null;
      if (quantity_on_hand !== undefined) updateData.quantity_on_hand = parseFloat(quantity_on_hand) || 0;
      if (avg_cost !== undefined) updateData.avg_cost = parseFloat(avg_cost) || 0;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Regenerate item_key if item_code or item_name changed
      if (item_code !== undefined || item_name !== undefined) {
        const newItemKey = (updateData.item_code || updateData.item_name || item.item_code || item.item_name)
          .trim()
          .toLowerCase();
        
        // Check if new key conflicts with another item
        if (newItemKey !== item.item_key) {
          const existing = await req.tenantModels.InventoryItem.findOne({
            where: { item_key: newItemKey, id: { [Op.ne]: id } },
          });
          if (existing) {
            return res.status(400).json({ 
              error: 'An item with this code or name already exists' 
            });
          }
        }
        updateData.item_key = newItemKey;
      }

      await item.update(updateData);

      res.json({ data: item });
    } catch (error) {
      logger.error('Error updating inventory item:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          error: 'An item with this code or name already exists' 
        });
      }
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const item = await req.tenantModels.InventoryItem.findByPk(id);

      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      // Check if item is used in any stock movements
      const stockMovements = await req.tenantModels.StockMovement.count({
        where: { inventory_item_id: id },
      });

      if (stockMovements > 0) {
        // Soft delete by setting is_active to false
        await item.update({ is_active: false });
        return res.json({ 
          data: item,
          message: 'Item deactivated (has stock movements)' 
        });
      }

      await item.destroy();
      res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
      logger.error('Error deleting inventory item:', error);
      next(error);
    }
  },
};
