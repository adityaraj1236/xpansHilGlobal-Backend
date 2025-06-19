const express = require('express');
const router = express.Router();
const { 
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryByProject,
  getLowStockItems,
  addInventoryMovement,
  getInventoryMovements
} = require('../controllers/inventoryController');

// Get all inventory items
router.get('/get-inventories', getAllInventory);

// Get inventory by project
router.get('/project/:projectId', getInventoryByProject);

// Get low stock items
router.get('/low-stock', getLowStockItems);

// Get a specific inventory item
router.get('/:id', getInventoryById);

// Create a new inventory item
router.post('/', createInventory);

// Update an inventory item
router.put('/:id', updateInventory);

// Delete an inventory item
router.delete('/:id', deleteInventory);

// Add inventory movement (in/out)
router.post('/movement', addInventoryMovement);

// Get inventory movements
router.get('/movements/:itemId', getInventoryMovements);

module.exports = router;