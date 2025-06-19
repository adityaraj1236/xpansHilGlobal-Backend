const PurchaseRequest = require('../models/PurchaseRequest');

exports.createPurchaseRequest = async (req, res) => {
  try {
    const { itemCode, itemName, quantity, unit, requestedBy } = req.body;

    const newRequest = new PurchaseRequest({
      itemCode,
      itemName,
      quantity,
      unit,
      requestedBy
    });

    const savedRequest = await newRequest.save();

    // Emit the socket event
    if (req.io) {
      req.io.emit('new-purchase-request', savedRequest); // Notify purchase manager in real-time
    }

    res.status(201).json(savedRequest);
  } catch (error) {
    console.error("Purchase request creation error:", error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
};
