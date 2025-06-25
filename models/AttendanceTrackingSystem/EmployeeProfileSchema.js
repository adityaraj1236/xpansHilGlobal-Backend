const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  designation: String, // e.g., Site Supervisor, PM
  department: String,
  baseSalary: Number,
  salaryType: {
    type: String,
    enum: ["monthly", "daily"],
    default: "monthly"
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  isUserCreated: { type: Boolean, default: false }
});

module.exports = mongoose.model("Employee", EmployeeSchema);
