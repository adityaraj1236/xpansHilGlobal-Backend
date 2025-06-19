const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    required: true
  },
  unitOfMeasure: {
    type: String,
    trim: true,
    required: true
  },
  price: {
    type: Number,
    min: 0
  },
  currentStock: {
    type: Number,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 0
  },
  maxStockLevel: {
    type: Number
  },
  location: {
    type: String,
    trim: true
  },
  supplierInfo: [{
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    price: {
      type: Number,
      min: 0
    },
    leadTime: {
      type: Number, // in days
      min: 0
    },
    isPreferred: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Method to update stock levels
inventorySchema.methods.updateStock = function(quantity, isAddition = true) {
  if (isAddition) {
    this.currentStock += quantity;
  } else {
    this.currentStock = Math.max(0, this.currentStock - quantity);
  }
  return this.save();
};

// Virtual field to check if item is below minimum stock level
inventorySchema.virtual('isLowStock').get(function() {
  return this.currentStock <= this.minStockLevel;
});

// Make virtual fields show up in JSON responses
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;