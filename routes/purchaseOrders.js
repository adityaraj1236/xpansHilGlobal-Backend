const express = require('express');
const router = express.Router();
const { 
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  getPurchaseOrdersByProject,
  getPurchaseOrdersByStatus
} = require('../controllers/purchaseOrderController');

// Get all purchase orders
router.get('/', getAllPurchaseOrders);

// Get purchase orders by project
router.get('/project/:projectId', getPurchaseOrdersByProject);

// Get purchase orders by status
router.get('/status/:status', getPurchaseOrdersByStatus);

// Get a specific purchase order
router.get('/:id', getPurchaseOrderById);

// Create a new purchase order
router.post('/', createPurchaseOrder);

// Update a purchase order
router.put('/:id', updatePurchaseOrder);

// Approve a purchase order
router.put('/:id/approve', approvePurchaseOrder);

// Delete a purchase order
router.delete('/:id', deletePurchaseOrder);

module.exports = router;