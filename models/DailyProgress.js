const mongoose = require('mongoose');

const DailyProgressSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },

  precentageCompleted: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },

  boqQuantityDone: {
    type: Number,
    required: true,
  },

  boqUnit: {
    type: String,
    required: true
  },

  dailyTarget: {
    type: Number  // optional field for expected quantity
  },

  remarks: {
    type: String
  },

  imageUrl: {
    type: String, // Cloudinary image URL
    required: true
  },

  timestamp: {
    type: Date,
    required: true // explicitly record submission time
  },

  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, { _id: false });

module.exports = DailyProgressSchema;
