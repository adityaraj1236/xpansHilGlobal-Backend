const mongoose = require("mongoose");

const QuantityBlock = {
  qty: { type: Number, default: 0 },
  unit: { type: String },
  rate: { type: Number, default: 0 }
};

const BOQItemSchema = new mongoose.Schema({
  boqId: { type: mongoose.Schema.Types.ObjectId, ref: "BOQ", required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "BOQSection", required: true },
  itemCode: { type: String },
  description: { type: String, required: true },
  boq: QuantityBlock,
  drawing: QuantityBlock,
  work: QuantityBlock,
}, { timestamps: true });

BOQItemSchema.virtual("subtasks", {
  ref: "BOQSubTask",
  localField: "_id",
  foreignField: "itemId",
});


BOQItemSchema.virtual("balanceQty").get(function () {
  return this.boq.qty - this.work.qty;
});
BOQItemSchema.virtual("balanceAmount").get(function () {
  return (this.boq.qty - this.work.qty) * this.boq.rate;
});

BOQItemSchema.set("toObject", { virtuals: true });
BOQItemSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("BOQItem", BOQItemSchema);
