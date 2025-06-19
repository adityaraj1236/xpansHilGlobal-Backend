const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const mongoose = require('mongoose');

// Get all inventory items
const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inventory by project
const getInventoryByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const inventory = await Inventory.find({ project: projectId }).populate('project', 'name');
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = {};
    
    if (projectId) {
      query.project = projectId;
    }
    
    // Find items where quantity is less than or equal to threshold
    const inventory = await Inventory.find({
      ...query,
      $expr: { $lte: ['$quantity', '$threshold'] }
    }).populate('project', 'name');
    
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific inventory item
const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate('project', 'name');
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new inventory item
const createInventory = async (req, res) => {
  try {
    const inventory = new Inventory(req.body);
    const newInventory = await inventory.save();
    res.status(201).json(newInventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an inventory item
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Add lastUpdated timestamp
    updates.lastUpdated = new Date();
    
    const inventory = await Inventory.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('project', 'name');
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an inventory item
const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add inventory movement (in/out)
const addInventoryMovement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      itemId, 
      projectId, 
      type, 
      quantity, 
      source, 
      destination, 
      receiver,
      handledBy, 
      notes 
    } = req.body;
    
    // Create the movement record
    const movement = new InventoryMovement({
      item: itemId,
      project: projectId,
      type,
      quantity,
      date: new Date(),
      source,
      destination: destination || '',
      receiver: receiver || '',
      handledBy,
      notes: notes || ''
    });
    
    await movement.save({ session });
    
    // Update the inventory quantity
    const inventory = await Inventory.findById(itemId).session(session);
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    
    // Update quantity based on movement type
    if (type === 'in') {
      inventory.quantity += quantity;
    } else if (type === 'out') {
      // Check if there's enough quantity
      if (inventory.quantity < quantity) {
        throw new Error('Not enough quantity available');
      }
      inventory.quantity -= quantity;
    }
    
    // Update lastUpdated timestamp
    inventory.lastUpdated = new Date();
    
    await inventory.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Return the updated inventory and movement
    const updatedInventory = await Inventory.findById(itemId).populate('project', 'name');
    
    res.status(201).json({
      message: 'Inventory movement recorded successfully',
      movement,
      inventory: updatedInventory
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

// Get inventory movements
const getInventoryMovements = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = { item: itemId };
    
    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate);
      formattedStartDate.setHours(0, 0, 0, 0);
      
      const formattedEndDate = new Date(endDate);
      formattedEndDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: formattedStartDate,
        $lte: formattedEndDate
      };
    }
    
    const movements = await InventoryMovement.find(query)
      .populate('item', 'name unit')
      .populate('project', 'name')
      .populate('handledBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryByProject,
  getLowStockItems,
  addInventoryMovement,
  getInventoryMovements
};