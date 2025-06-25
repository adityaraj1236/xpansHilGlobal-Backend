const mongoose = require("mongoose");

const BOQSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, default: "Main BOQ" },
}, { timestamps: true });

BOQSchema.virtual("sections", {
  ref: "BOQSection",
  localField: "_id",
  foreignField: "boqId"
});

BOQSchema.set("toObject", { virtuals: true });
BOQSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("BOQ", BOQSchema);
