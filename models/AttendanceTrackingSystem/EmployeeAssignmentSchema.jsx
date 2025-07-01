const mongoose = require("mongoose");

const EmployeeAssignmentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  role: { type: String, required: true },
  rateOverride: Number, // optional project-level custom salary
  salaryTypeOverride: {
    type: String,
    enum: ["daily", "monthly"]
  },
  startDate: Date,
  endDate: Date
}, { timestamps: true });

module.exports = mongoose.model("EmployeeAssignment", EmployeeAssignmentSchema);
