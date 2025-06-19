// models/PurchaseRequest.js
const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema({
  itemCode: String,
  itemName: String,
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // assuming you have User model
  },
  quantity: Number,
  unit: String,
  status: {
    type: String,
    default: 'pending' // other statuses: 'approved', 'rejected', 'ordered'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
