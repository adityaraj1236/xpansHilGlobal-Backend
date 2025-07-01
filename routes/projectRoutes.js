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
  getProjectDetails,
  getProjectsByLoggedInUserOrg,
  updateProjectManager,
  updateSiteSupervisor,
  updateStoreKeeper,
  addTeamMember
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
    authorizeRoles("admin", "projectmanager" , "billingengineer"),
    getMyOrganizationProjects
  );


//get my organisation projects without fetching organsation 
router.get(
  "/entire-organization-projects",
  authenticateUser,
  authorizeRoles("admin", "projectmanager", "billingengineer", "sitesupervisor"),
  getProjectsByLoggedInUserOrg
);

  
router.post("/:projectId/assign-project-manager", authenticateUser, authorizeRoles("admin"), updateProjectManager);

//update store keepers 
router.post(
  "/:projectId/add-storekeeper",
  authenticateUser,
  authorizeRoles("admin"), // only admin can assign
  updateStoreKeeper
);


//update team members 
router.post(
  "/:projectId/add-team-member",
  authenticateUser,
  authorizeRoles("admin", "projectmanager"), // both can add team members
  addTeamMember
);



// ✅ Only admin can assign Supervisors
router.post("/:projectId/assign-supervisor", authenticateUser, authorizeRoles("admin" , "projectmanager"), updateSiteSupervisor);

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
router.get("/:projectId", authenticateUser, authorizeRoles("admin" , "projectmanager" , "sitesupervisor" , "billingengineer") , getProjectDetails);


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



router.post("/fix-user-org", async (req, res) => {
  const { userEmail, orgId } = req.body;

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.organization = orgId;
    await user.save();

    res.json({ message: "✅ User organization updated", user });
  } catch (error) {
    console.error("Error updating user organization:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Invite Billing Engineer to a Project
router.post("/:projectId/invite-billing-engineer", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  const { email } = req.body;
  const { projectId } = req.params;
  const role = 'billingengineer';

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const orgId = project.organization;
    const baseActionLink = `https://www.xpanshilglobal.com/invite/handle?token=${token}`;

    // Save invite
    await Invite.create({
      email,
      orgId,
      projectId,
      role,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const subject = "Billing Engineer Invitation";
    const content = `
      You've been invited to join as a <strong>Billing Engineer</strong> for the project <b>${project.name}</b>.
      Click the button below to accept or reject the invitation.
    `;

    await sendEmail(email, subject, content, baseActionLink);

    res.status(200).json({ message: "✅ Billing Engineer invitation sent!" });
  } catch (error) {
    console.error("❌ Error inviting billing engineer:", error);
    res.status(500).json({ message: "Error sending invitation", error: error.message });
  }
});



module.exports = router;
