
const express = require('express');
const attributeController = require('../controllers/attributeController');
const { requireAuth } = require('../middleware/auth'); // Assuming you want these endpoints protected

const router = express.Router();

// Protect all routes in this file
router.use(requireAuth);

// -- Attribute Types --

// GET /api/attributes - List all attributes and their values for the tenant
router.get('/', attributeController.listAttributes);

// POST /api/attributes - Create a new attribute type (e.g., 'Color')
router.post('/', attributeController.createAttribute);

// PUT /api/attributes/:id - Update an attribute type's name
router.put('/:id', attributeController.updateAttribute);

// DELETE /api/attributes/:id - Delete an attribute type and all its associated values
router.delete('/:id', attributeController.deleteAttribute);


// -- Attribute Values --

// POST /api/attributes/:attributeId/values - Add a new value (e.g., 'Red') to an attribute
router.post('/:attributeId/values', attributeController.addAttributeValue);

// DELETE /api/attributes/values/:valueId - Remove a specific value from an attribute
router.delete('/values/:valueId', attributeController.removeAttributeValue);


module.exports = router;
