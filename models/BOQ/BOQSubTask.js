const mongoose = require("mongoose");

const QuantityBlock = {
  qty: { type: Number, default: 0 },
  unit: { type: String },
  rate: { type: Number, default: 0 }
};

const BOQSubtaskSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "BOQItem", required: true },
  title: { type: String, required: true },  // e.g. "Depth 0–3m"
  boq: QuantityBlock,
  drawing: QuantityBlock,
  work: QuantityBlock,
}, { timestamps: true });

BOQSubtaskSchema.virtual("balanceQty").get(function () {
  return this.boq.qty - this.work.qty;
});
BOQSubtaskSchema.virtual("balanceAmount").get(function () {
  return (this.boq.qty - this.work.qty) * this.boq.rate;
});

BOQSubtaskSchema.set("toObject", { virtuals: true });
BOQSubtaskSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("BOQSubtask", BOQSubtaskSchema);
