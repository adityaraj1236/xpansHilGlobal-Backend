// models/EmployeeAssignment.js
const mongoose = require("mongoose");

const EmployeeAssignmentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

  role: { type: String, required: true }, // e.g., Site Supervisor, Labour, Manager
  rateOverride: Number, // optional project-specific override of salaryRate
}, { timestamps: true });

module.exports = mongoose.model("EmployeeAssignment", EmployeeAssignmentSchema);
