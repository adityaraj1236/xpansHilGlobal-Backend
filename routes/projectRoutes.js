const express = require("express");
const {
  createProject,
  acceptProject,
  rejectProject,
  assignSupervisor,
  assignProjectManager,
  updateBoqItems,
  generateBOQReport,
  generateProgressReport,
  getMyOrganizationProjects, 
  getProjectDetails
} = require("../controllers/projectController");
const Project = require("../models/Project");
const User  =  require("../models/User")


const { authenticateUser, authorizeRoles, ensureOrganizationExists } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Only Admin can create projects & assign Project Managers
router.post("/create", authenticateUser, authorizeRoles("admin"), ensureOrganizationExists, createProject);
router.get(
    "/my-organization-projects",
    authenticateUser,
    authorizeRoles("admin", "projectmanager"),
    getMyOrganizationProjects
  );
  
router.post("/:projectId/assign-project-manager", authenticateUser, authorizeRoles("admin"), assignProjectManager);

// ✅ Only admin can assign Supervisors
router.post("/:projectId/assign-supervisor", authenticateUser, authorizeRoles("admin"), assignSupervisor);

// ❌ Anyone can accept or reject projects (No Role Restriction)
router.post("/accept", authenticateUser, acceptProject);
router.post("/reject", authenticateUser, rejectProject);

// ✅ Only Project Managers & Supervisors can add BOQ items
router.patch("/:projectId/boq", authenticateUser, authorizeRoles("projectManager" , "admin"), updateBoqItems);



router.get("/:projectId/boq-report", authenticateUser, authorizeRoles("admin", "sitesupervisor", "client"), generateBOQReport);
router.get("/:projectId/progress", authenticateUser, authorizeRoles("admin", "sitesupervisor", "client"), generateProgressReport);

// Fetch all projects assigned to the logged-in Project Manager
// Fetch all projects assigned to the logged-in Project Manager
router.get('/my-projects', authenticateUser, authorizeRoles('projectmanager'), async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log(userEmail);
    
    const projects = await Project.find({ 'projectManager.email': userEmail }).populate('tasks');
    
    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
});

// ✅ Admin, Supervisor & Client can generate reports
router.get("/:projectId", authenticateUser, authorizeRoles("admin" , "projectmanager" , "sitesupervisor") , getProjectDetails);


//debug route 
// ✅ FIX-USERS DEBUG ROUTE
router.post('/:projectId/fix-users', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ error: "❌ Project not found" });

    // ✅ Fix siteSupervisor
    if (project.siteSupervisor?.email) {
      const real = await User.findOne({ email: project.siteSupervisor.email });
      if (real) {
        project.siteSupervisor = {
          _id: real._id,
          name: real.name,
          email: real.email,
          status: project.siteSupervisor.status || "Pending"
        };
      }
    }

    // ✅ Fix projectManager
    if (project.projectManager?.email) {
      const real = await User.findOne({ email: project.projectManager.email });
      console.log("👉 real projectManager found:", real); // 👈 Add this
      if (real) {
        project.projectManager = {
          _id: real._id,
          // name: real.name,
          email: real.email,
          status: project.projectManager.status || "Pending"
        };
      }
    }

    // ✅ Fix assignedUsers
    const fixedAssigned = [];
    for (const user of project.assignedUsers || []) {
      const real = await User.findOne({ email: user?.email });
      if (real) {
        fixedAssigned.push({
          _id: real._id,
          name: real.name,
          email: real.email,
          status: user.status || "Pending"
        });
      }
    }
    project.assignedUsers = fixedAssigned;

    await project.save();
    res.json({ message: "✅ Project users fixed successfully", project });

  } catch (err) {
    console.error("❌ Error fixing users:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


module.exports = router;
