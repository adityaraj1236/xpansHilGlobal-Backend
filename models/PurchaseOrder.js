const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'],
    default: 'Pending'
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      min: 0
    },
    totalPrice: {
      type: Number,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate order number before saving
purchaseOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Find the latest order for the current month to generate sequence
    const latestOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^PO-${year}${month}-`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (latestOrder) {
      const latestSequence = parseInt(latestOrder.orderNumber.split('-')[2]);
      sequence = latestSequence + 1;
    }
    
    this.orderNumber = `PO-${year}${month}-${sequence.toString().padStart(3, '0')}`;
  }
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;