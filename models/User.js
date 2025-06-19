const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Organization = require("./Organization");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["client", "admin", "vendor", "hr", "sitesupervisor", "projectmanager"],
      default: "client",
    },

    // ✅ ADD THIS FIELD
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true, // or true if every user must belong to an organization
    },
  },
  { timestamps: true }
);

// Virtuals for purchase order relationships
UserSchema.virtual("requestedOrders", {
  ref: "PurchaseOrder",
  localField: "_id",
  foreignField: "requestedBy",
});

UserSchema.virtual("approvedOrders", {
  ref: "PurchaseOrder",
  localField: "_id",
  foreignField: "approvedBy",
});

module.exports = mongoose.model("User", UserSchema);
