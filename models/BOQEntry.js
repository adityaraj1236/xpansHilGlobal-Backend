// const mongoose = require("mongoose");

// const BOQEntrySchema = new mongoose.Schema({
//   organisationId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Organization",
//     required: true
//   },
//   projectId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Project",
//     required: true
//   },
//   boqFileId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "BOQFile"
//   },
//   itemCode: { type: String }, // Optional if your BOQ includes it
//   description: { type: String, required: true },
//   unit: { type: String, required: true },
//   quantity: { type: Number, required: true },
//   unitPrice: { type: Number, required: true },
//   totalPrice: { type: Number, required: true }
// }, { timestamps: true });

// module.exports = mongoose.model("BOQEntry", BOQEntrySchema);
