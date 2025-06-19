// routes/purchaseRequests.js
const express = require('express');
const router = express.Router();
const PurchaseRequest = require('../models/PurchaseRequest');
const { createPurchaseRequest } = require('../controllers/purchaseRequestController');

router.post('/', createPurchaseRequest);

module.exports = router;
