const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res, next) => {
  try {
    // Build query based on filters
    const queryObj = {};
    
    // Filter by active status if provided
    if (req.query.isActive !== undefined) {
      queryObj.isActive = req.query.isActive === 'true';
    }
    
    // Filter by category if provided
    if (req.query.category) {
      queryObj.category = req.query.category;
    }
    
    // Search by name if provided
    if (req.query.search) {
      queryObj.name = { $regex: req.query.search, $options: 'i' };
    }

    // Get suppliers with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const suppliers = await Supplier.find(queryObj)
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Supplier.countDocuments(queryObj);
    
    res.status(200).json({
      success: true,
      count: suppliers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: suppliers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Get recent purchase orders for this supplier
    const recentOrders = await PurchaseOrder.find({ supplier: supplier._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('project', 'name')
      .select('orderNumber status totalAmount requestDate project');
    
    // Get total spending with this supplier
    const totalSpending = await PurchaseOrder.aggregate([
      { $match: { 
        supplier: supplier._id,
        status: { $in: ['Approved', 'Ordered', 'Received'] }
      }},
      { $group: { 
        _id: null, 
        total: { $sum: '$totalAmount' } 
      }}
    ]);
    
    const supplierWithStats = {
      ...supplier.toObject(),
      recentOrders,
      totalSpending: totalSpending.length > 0 ? totalSpending[0].total : 0
    };
    
    res.status(200).json({
      success: true,
      data: supplierWithStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    
    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Check if supplier has related purchase orders
    const purchaseOrders = await PurchaseOrder.countDocuments({ supplier: supplier._id });
    
    if (purchaseOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier with associated purchase orders. Please deactivate instead.'
      });
    }
    
    await supplier.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
     next(err);
  }
};

// @desc    Get supplier categories
// @route   GET /api/suppliers/categories
// @access  Private
exports.getSupplierCategories = async (req, res, next) => {
  try {
    const categories = await Supplier.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};