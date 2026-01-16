
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Finds or creates an inventory item with a robust, multi-layered lookup.
 * It prioritizes unique identifiers in the following order:
 * 1. inventory_item_id (direct lookup)
 * 2. barcode
 * 3. item_code (SKU)
 * 4. A combination of item_name and other attributes (for variants)
 * 5. item_key (legacy fallback)
 *
 * This approach ensures accurate inventory tracking and prevents the creation
 * of duplicate items.
 */
async function findOrCreateInventoryItem(tenantModels, itemData, transaction) {
  const { inventory_item_id, barcode, item_code, item_name, variant_attributes } = itemData;

  // 1. Direct ID lookup
  if (inventory_item_id) {
    const item = await tenantModels.InventoryItem.findByPk(inventory_item_id, { transaction });
    if (item) return { item, created: false };
  }

  // 2. Barcode lookup
  if (barcode) {
    const item = await tenantModels.InventoryItem.findOne({ where: { barcode }, transaction });
    if (item) return { item, created: false };
  }

  // 3. Item code (SKU) lookup
  if (item_code) {
    const item = await tenantModels.InventoryItem.findOne({ where: { item_code }, transaction });
    if (item) return { item, created: false };
  }

  // 4. Variant lookup
  if (variant_attributes && item_name) {
    const item = await tenantModels.InventoryItem.findOne({
      where: {
        item_name,
        variant_attributes: {
          [Op.eq]: variant_attributes,
        },
      },
      transaction,
    });
    if (item) return { item, created: false };
  }

  // 5. Legacy item_key lookup (and creation)
  const itemKey = (item_code || item_name || '').trim().toLowerCase();
  if (itemKey) {
    const [item, created] = await tenantModels.InventoryItem.findOrCreate({
      where: { item_key: itemKey },
      defaults: {
        ...itemData,
        item_key: itemKey,
        item_name: item_name || item_code,
        quantity_on_hand: 0,
        avg_cost: 0,
        is_active: true,
      },
      transaction,
    });
    if (created) {
      logger.info(`Auto-created inventory item: ${item.item_name} (ID: ${item.id})`);
    }
    return { item, created };
  }

  throw new Error('Could not find or create inventory item: Invalid item data provided');
}

module.exports = {
  findOrCreateInventoryItem,
};
