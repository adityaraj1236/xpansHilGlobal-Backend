const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const mongoose = require('mongoose');

// Get all purchase orders
const getAllPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.item', 'name unit')
      .sort({ createdAt: -1 });
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get purchase orders by project
const getPurchaseOrdersByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const purchaseOrders = await PurchaseOrder.find({ project: projectId })
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.item', 'name unit')
      .sort({ createdAt: -1 });
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get purchase orders by status
const getPurchaseOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const purchaseOrders = await PurchaseOrder.find({ status })
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.item', 'name unit')
      .sort({ createdAt: -1 });
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific purchase order
const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.item', 'name unit');
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new purchase order
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      project,
      supplier,
      expectedDeliveryDate,
      items,
      notes,
      requestedBy
    } = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      item.totalPrice = item.quantity * (item.unitPrice || 0);
      totalAmount += item.totalPrice;
    }
    
    const purchaseOrder = new PurchaseOrder({
      project,
      supplier,
      requestDate: new Date(),
      expectedDeliveryDate,
      status: 'Pending',
      items,
      totalAmount,
      notes: notes || '',
      requestedBy
    });
    
    const newPurchaseOrder = await purchaseOrder.save();
    
    const populatedPurchaseOrder = await PurchaseOrder.findById(newPurchaseOrder._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('items.item', 'name unit');
    
    res.status(201).json(populatedPurchaseOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a purchase order
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Recalculate total amount if items are being updated
    if (updates.items) {
      let totalAmount = 0;
      for (const item of updates.items) {
        item.totalPrice = item.quantity * (item.unitPrice || 0);
        totalAmount += item.totalPrice;
      }
      updates.totalAmount = totalAmount;
    }
    
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.item', 'name unit');
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Approve a purchase order
const approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    if (purchaseOrder.status !== 'Pending') {
      return res.status(400).json({ message: 'Purchase order is not in pending status' });
    }
    
    purchaseOrder.status = 'Approved';
    purchaseOrder.approvalDate = new Date();
    purchaseOrder.approvedBy = approvedBy;
    
    const updatedPurchaseOrder = await purchaseOrder.save();
    
    const populatedPurchaseOrder = await PurchaseOrder.findById(updatedPurchaseOrder._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.item', 'name unit');
    
    res.status(200).json(populatedPurchaseOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reject a purchase order
const rejectPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, rejectionReason } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    if (purchaseOrder.status !== 'Pending') {
      return res.status(400).json({ message: 'Purchase order is not in pending status' });
    }
    
    purchaseOrder.status = 'Rejected';
    purchaseOrder.rejectionDate = new Date();
    purchaseOrder.rejectedBy = rejectedBy;
    purchaseOrder.rejectionReason = rejectionReason || '';
    
    const updatedPurchaseOrder = await purchaseOrder.save();
    
    const populatedPurchaseOrder = await PurchaseOrder.findById(updatedPurchaseOrder._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('rejectedBy', 'name')
      .populate('items.item', 'name unit');
    
    res.status(200).json(populatedPurchaseOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark purchase order as received
const receivePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { receivedBy, partialItems } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id).session(session);
    
    if (!purchaseOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    if (purchaseOrder.status !== 'Approved' && purchaseOrder.status !== 'Partially Received') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Purchase order must be approved or partially received' });
    }
    
    // If partialItems is provided, update only those items
    if (partialItems && partialItems.length > 0) {
      let allItemsReceived = true;
      let anyItemReceived = false;
      
      // Update received quantities
      for (const item of purchaseOrder.items) {
        const partialItem = partialItems.find(pi => pi.itemId.toString() === item.item.toString());
        
        if (partialItem) {
          // Cannot receive more than ordered
          if (item.receivedQuantity + partialItem.receivedQuantity > item.quantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
              message: `Cannot receive more than ordered quantity for item ${item.item}`
            });
          }
          
          item.receivedQuantity += partialItem.receivedQuantity;
          anyItemReceived = true;
          
          // Update inventory
          await updateInventory(
            item.item, 
            partialItem.receivedQuantity, 
            purchaseOrder.project, 
            purchaseOrder._id,
            'Purchase Order Receipt',
            session
          );
        }
        
        // Check if any items are still not fully received
        if (item.receivedQuantity < item.quantity) {
          allItemsReceived = false;
        }
      }
      
      if (!anyItemReceived) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'No valid items to receive' });
      }
      
      purchaseOrder.status = allItemsReceived ? 'Received' : 'Partially Received';
    } else {
      // Mark all items as fully received
      for (const item of purchaseOrder.items) {
        const remainingQuantity = item.quantity - (item.receivedQuantity || 0);
        
        if (remainingQuantity > 0) {
          item.receivedQuantity = item.quantity;
          
          // Update inventory
          await updateInventory(
            item.item, 
            remainingQuantity, 
            purchaseOrder.project, 
            purchaseOrder._id,
            'Purchase Order Receipt',
            session
          );
        }
      }
      
      purchaseOrder.status = 'Received';
    }
    
    purchaseOrder.receiptDate = new Date();
    purchaseOrder.receivedBy = receivedBy;
    
    const updatedPurchaseOrder = await purchaseOrder.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    const populatedPurchaseOrder = await PurchaseOrder.findById(updatedPurchaseOrder._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('receivedBy', 'name')
      .populate('items.item', 'name unit');
    
    res.status(200).json(populatedPurchaseOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

// Helper function to update inventory
const updateInventory = async (itemId, quantity, projectId, poId, movementType, session) => {
  // Find existing inventory record or create new one
  let inventory = await Inventory.findOne({ 
    item: itemId,
    project: projectId
  }).session(session);
  
  if (!inventory) {
    inventory = new Inventory({
      item: itemId,
      project: projectId,
      quantity: 0
    });
  }
  
  // Update quantity
  inventory.quantity += quantity;
  await inventory.save({ session });
  
  // Create inventory movement record
  const movement = new InventoryMovement({
    item: itemId,
    project: projectId,
    quantity,
    type: movementType,
    referenceDocument: poId,
    referenceModel: 'PurchaseOrder',
    date: new Date()
  });
  
  await movement.save({ session });
};

// Delete a purchase order (only if still in Pending status)
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    if (purchaseOrder.status !== 'Pending') {
      return res.status(400).json({ 
        message: 'Cannot delete purchase order that is not in pending status' 
      });
    }
    
    await PurchaseOrder.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get purchase order statistics
const getPurchaseOrderStats = async (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    
    let matchCriteria = {};
    
    if (startDate && endDate) {
      matchCriteria.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (projectId) {
      matchCriteria.project = mongoose.Types.ObjectId(projectId);
    }
    
    const stats = await PurchaseOrder.aggregate([
      { $match: matchCriteria },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const totalStats = await PurchaseOrder.aggregate([
      { $match: matchCriteria },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }}
    ]);
    
    res.status(200).json({
      statusBreakdown: stats,
      total: totalStats[0] || { count: 0, totalAmount: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrdersByProject,
  getPurchaseOrdersByStatus,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  receivePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats
};