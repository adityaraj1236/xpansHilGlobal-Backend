const mongoose = require("mongoose");

const BOQSectionSchema = new mongoose.Schema({
  boqId: { type: mongoose.Schema.Types.ObjectId, ref: "BOQ", required: true },
  title: { type: String, required: true },  // FOUNDATION, SUBSTRUCTURE
}, { timestamps: true });

module.exports = mongoose.model("BOQSection", BOQSectionSchema);
