const mongoose = require("mongoose");

const WageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  role: {
    type: String,
    enum: ["SkilledLabor", "UnskilledLabor", "Engineer", "SiteSupervisor", "ProjectManager"],
    required: true
  },
  wagePerHour: { type: Number, required: true }
});

module.exports = mongoose.model("Wage", WageSchema);
