const mongoose = require("mongoose");

const BOQFileSchema = new mongoose.Schema({
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalFileName: { type: String },
  extractedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("BOQFile", BOQFileSchema);
