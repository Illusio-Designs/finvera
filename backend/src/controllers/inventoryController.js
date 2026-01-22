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
        barcode,
        hsn_sac_code,
        uqc,
        gst_rate,
        quantity_on_hand = 0,
        avg_cost = 0,
        is_active = true,
        generate_barcode = false,
        barcode_type = 'EAN13', // EAN13, EAN8, CUSTOM
        barcode_prefix = 'PRD',
      } = req.body;

      if (!item_name) {
        return res.status(400).json({ error: 'Item name is required' });
      }

      // Generate item_key from item_code or item_name
      const itemKey = String(item_code || item_name).trim().toLowerCase();

      // Check if item with same key already exists
      const existing = await req.tenantModels.InventoryItem.findOne({
        where: { item_key: itemKey },
      });

      if (existing) {
        return res.status(400).json({ 
          error: 'An item with this code or name already exists' 
        });
      }

      // Check if barcode already exists
      if (barcode) {
        const existingBarcode = await req.tenantModels.InventoryItem.findOne({
          where: { barcode },
        });
        if (existingBarcode) {
          return res.status(400).json({ 
            error: 'An item with this barcode already exists' 
          });
        }
      }

      // Generate barcode if requested
      let generatedBarcode = barcode;
      if (generate_barcode && !barcode) {
        const barcodeGenerator = require('../utils/barcodeGenerator');
        
        switch (barcode_type) {
          case 'EAN13':
            generatedBarcode = barcodeGenerator.generateEAN13('890'); // 890 is India prefix
            break;
          case 'EAN8':
            generatedBarcode = barcodeGenerator.generateEAN8();
            break;
          case 'CUSTOM':
            const nextSeq = await barcodeGenerator.getNextSequence(req.tenantModels, barcode_prefix);
            generatedBarcode = barcodeGenerator.generateCustomBarcode(barcode_prefix, nextSeq, 13);
            break;
          default:
            generatedBarcode = null;
        }

        // Ensure generated barcode is unique
        if (generatedBarcode) {
          const existingGenerated = await req.tenantModels.InventoryItem.findOne({
            where: { barcode: generatedBarcode },
          });
          if (existingGenerated) {
            return res.status(400).json({ 
              error: 'Generated barcode already exists. Please try again.' 
            });
          }
        }
      }

      const item = await req.tenantModels.InventoryItem.create({
        item_key: itemKey,
        item_code: item_code || null,
        item_name,
        barcode: generatedBarcode || null,
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
          error: 'An item with this code, name, or barcode already exists' 
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
        const newItemKey = String(updateData.item_code || updateData.item_name || item.item_code || item.item_name)
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

  async generateBarcode(req, res, next) {
    try {
      const { id } = req.params;
      const { barcode_type = 'EAN13', barcode_prefix = 'PRD' } = req.body;

      const item = await req.tenantModels.InventoryItem.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      if (item.barcode) {
        return res.status(400).json({ 
          error: 'Item already has a barcode',
          current_barcode: item.barcode 
        });
      }

      const barcodeGenerator = require('../utils/barcodeGenerator');
      let generatedBarcode;

      switch (barcode_type) {
        case 'EAN13':
          generatedBarcode = barcodeGenerator.generateEAN13('890'); // 890 is India prefix
          break;
        case 'EAN8':
          generatedBarcode = barcodeGenerator.generateEAN8();
          break;
        case 'CUSTOM':
          const nextSeq = await barcodeGenerator.getNextSequence(req.tenantModels, barcode_prefix);
          generatedBarcode = barcodeGenerator.generateCustomBarcode(barcode_prefix, nextSeq, 13);
          break;
        default:
          return res.status(400).json({ error: 'Invalid barcode type' });
      }

      // Ensure generated barcode is unique
      const existingBarcode = await req.tenantModels.InventoryItem.findOne({
        where: { barcode: generatedBarcode },
      });

      if (existingBarcode) {
        return res.status(400).json({ 
          error: 'Generated barcode already exists. Please try again.' 
        });
      }

      await item.update({ barcode: generatedBarcode });

      res.json({ 
        data: item,
        message: 'Barcode generated successfully',
        barcode: generatedBarcode 
      });
    } catch (error) {
      logger.error('Error generating barcode:', error);
      next(error);
    }
  },

  async bulkGenerateBarcodes(req, res, next) {
    try {
      const { item_ids, barcode_type = 'EAN13', barcode_prefix = 'PRD' } = req.body;

      if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        return res.status(400).json({ error: 'Item IDs array is required' });
      }

      const barcodeGenerator = require('../utils/barcodeGenerator');
      const results = [];
      const errors = [];

      for (const itemId of item_ids) {
        try {
          const item = await req.tenantModels.InventoryItem.findByPk(itemId);
          
          if (!item) {
            errors.push({ item_id: itemId, error: 'Item not found' });
            continue;
          }

          if (item.barcode) {
            errors.push({ item_id: itemId, error: 'Item already has a barcode' });
            continue;
          }

          let generatedBarcode;
          switch (barcode_type) {
            case 'EAN13':
              generatedBarcode = barcodeGenerator.generateEAN13('890');
              break;
            case 'EAN8':
              generatedBarcode = barcodeGenerator.generateEAN8();
              break;
            case 'CUSTOM':
              const nextSeq = await barcodeGenerator.getNextSequence(req.tenantModels, barcode_prefix);
              generatedBarcode = barcodeGenerator.generateCustomBarcode(barcode_prefix, nextSeq, 13);
              break;
            default:
              errors.push({ item_id: itemId, error: 'Invalid barcode type' });
              continue;
          }

          // Check uniqueness
          const existingBarcode = await req.tenantModels.InventoryItem.findOne({
            where: { barcode: generatedBarcode },
          });

          if (existingBarcode) {
            errors.push({ item_id: itemId, error: 'Generated barcode already exists' });
            continue;
          }

          await item.update({ barcode: generatedBarcode });
          results.push({ 
            item_id: itemId, 
            item_name: item.item_name,
            barcode: generatedBarcode 
          });
        } catch (error) {
          errors.push({ item_id: itemId, error: error.message });
        }
      }

      res.json({ 
        success: results.length,
        failed: errors.length,
        results,
        errors 
      });
    } catch (error) {
      logger.error('Error bulk generating barcodes:', error);
      next(error);
    }
  },

  async setOpeningStockByWarehouse(req, res, next) {
    try {
      const { id } = req.params; // inventory_item_id
      const { warehouse_id, quantity, avg_cost } = req.body;

      if (!warehouse_id) {
        return res.status(400).json({ error: 'Warehouse ID is required' });
      }

      const item = await req.tenantModels.InventoryItem.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      const warehouse = await req.tenantModels.Warehouse.findByPk(warehouse_id);
      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      const qty = parseFloat(quantity) || 0;
      const cost = parseFloat(avg_cost) || 0;

      // Find or create warehouse stock record
      const [warehouseStock] = await req.tenantModels.WarehouseStock.findOrCreate({
        where: {
          inventory_item_id: id,
          warehouse_id: warehouse_id,
        },
        defaults: {
          inventory_item_id: id,
          warehouse_id: warehouse_id,
          tenant_id: req.user.tenant_id, // Add missing tenant_id
          quantity: qty,
          avg_cost: cost,
        },
      });

      // Update if already exists
      if (warehouseStock.quantity !== qty || warehouseStock.avg_cost !== cost) {
        warehouseStock.quantity = qty;
        warehouseStock.avg_cost = cost;
        await warehouseStock.save();
      }

      // Create stock movement entry for opening stock
      await req.tenantModels.StockMovement.create({
        inventory_item_id: id,
        warehouse_id: warehouse_id,
        tenant_id: req.user.tenant_id, // Add missing tenant_id
        voucher_id: null,
        movement_type: 'IN',
        quantity: qty,
        rate: cost,
        amount: qty * cost,
        narration: `Opening Stock - ${warehouse.warehouse_name}`,
      });

      // Recalculate aggregate quantity_on_hand and avg_cost for the item
      const allWarehouseStocks = await req.tenantModels.WarehouseStock.findAll({
        where: { inventory_item_id: id },
      });

      let totalQty = 0;
      let totalValue = 0;
      allWarehouseStocks.forEach((ws) => {
        totalQty += parseFloat(ws.quantity) || 0;
        totalValue += (parseFloat(ws.quantity) || 0) * (parseFloat(ws.avg_cost) || 0);
      });

      const aggregateAvgCost = totalQty > 0 ? totalValue / totalQty : 0;
      await item.update({
        quantity_on_hand: totalQty,
        avg_cost: aggregateAvgCost,
      });

      res.json({
        data: warehouseStock,
        message: 'Opening stock set successfully',
      });
    } catch (error) {
      logger.error('Error setting opening stock by warehouse:', error);
      next(error);
    }
  },

  async getStockByWarehouse(req, res, next) {
    try {
      const { id } = req.params; // inventory_item_id
      const { warehouse_id } = req.query;

      const item = await req.tenantModels.InventoryItem.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      const where = { inventory_item_id: id };
      if (warehouse_id) {
        where.warehouse_id = warehouse_id;
      }

      const warehouseStocks = await req.tenantModels.WarehouseStock.findAll({
        where,
        include: [
          {
            model: req.tenantModels.Warehouse,
            as: 'warehouse', // Use the alias defined in the association
            attributes: ['id', 'warehouse_name', 'warehouse_code'],
            required: false, // Left join - don't fail if warehouse doesn't exist
          },
        ],
      });

      const data = warehouseStocks.map((ws) => ({
        warehouse_id: ws.warehouse_id,
        warehouse_name: ws.warehouse?.warehouse_name,
        warehouse_code: ws.warehouse?.warehouse_code,
        quantity: parseFloat(ws.quantity) || 0,
        avg_cost: parseFloat(ws.avg_cost) || 0,
        stock_value: (parseFloat(ws.quantity) || 0) * (parseFloat(ws.avg_cost) || 0),
      }));

      // If warehouse_id is specified, return single object or null if not found; otherwise return array
      if (warehouse_id) {
        if (data.length === 1) {
          res.json({ data: data[0] });
        } else {
          // No warehouse stock found for this warehouse - return default structure
          res.json({ 
            data: {
              warehouse_id: warehouse_id,
              warehouse_name: null,
              warehouse_code: null,
              quantity: 0,
              avg_cost: 0,
              stock_value: 0,
            }
          });
        }
      } else {
        res.json({ data });
      }
    } catch (error) {
      logger.error('Error getting stock by warehouse:', error);
      next(error);
    }
  },
};
