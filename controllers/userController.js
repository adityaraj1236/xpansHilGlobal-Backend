const User = require('../models/User');
const Project = require('../models/Project');

// @desc    Get all users in the same organization
// @route   GET /api/users/organization
// @access  Private
exports.getUsersByOrganization = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1. Find the project and get the organization ID
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const organizationId = project.organization;

    if (!organizationId) {
      return res.status(400).json({ error: "This project is not linked to any organization." });
    }

    
    

    // 2. Fetch all users in the same organization
    const users = await User.find({ organization: organizationId }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users by project organization:", error);
    res.status(500).json({ error: "Server error." });
  }
};


//get current USer 
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ error: "Server error" });
  }
};
