const mongoose = require("mongoose");

const Organization = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true  // Ensures only one admin per organization
  },
  address: {
  street: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  updatedAt: { type: Date, default: Date.now }
},
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }]
}, { timestamps: true });

module.exports = mongoose.model("Organization", Organization);
