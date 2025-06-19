const mongoose = require('mongoose');
const Organization = require("./Organization");
const Project = require("./Project")


const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  role: { type: String, default: 'projectmanager' },
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Add this field}
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
});

module.exports = mongoose.model('Invite', inviteSchema);
