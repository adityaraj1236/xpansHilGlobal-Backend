const Project = require("../models/Project");
const Organization = require("../models/Organization")
const sendEmail = require("../config/email");
const User  = require("../models/User")
const Invite =  require("../models/Invite")
const crypto =  require('crypto')

// Create Project
exports.createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, assignedUsers, projectManager, status, budget, location } = req.body;

    // ✅ Step 1: Get the organizationId from the logged-in user's data
    console.log("Logged-in user:", req.user);
    const userId = req.user._id;
    const user = await User.findById(userId).populate('organization');

    if (!user || !user.organization) {
      return res.status(403).json({ error: "User does not belong to any organization" });
    }

    const organizationId = user.organization._id;

    // ✅ Step 2: Ensure that organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: "Organization not found" });

    // ✅ Step 3: Create a new project
    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      assignedUsers,
      projectManager,
      status,
      budget,
      location,
      organization: organizationId,
    });

    // ✅ Step 4: Update Organization's `projects` Array
    organization.projects.push(project._id);
    await organization.save();

    // ✅ Step 5: Send Emails
    assignedUsers.forEach((user) => {
      sendEmail(user.email, "Project Assignment", `You have been assigned to project: ${name}. Please accept or reject.`);
    });

    sendEmail(projectManager.email, "Project Management", `You have been assigned as the project manager for: ${name}. Please accept or reject.`);

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


exports.getMyOrganizationProjects = async (req, res) => {
  try {
    let organization;

    if (req.user.role === "admin") {
      organization = await Organization.findOne({ admin: req.user.id });
    } else if (req.user.role === "projectmanager") {
      organization = await Organization.findOne({ members: req.user.id }); // or however you're storing PMs
    }
    else if (req.user.role === "billingengineer") {
      organization = await Organization.findOne({ members: req.user.id }); // or however you're storing PMs
    }


    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const projects = await Project.find({ organization: organization._id })
      .populate("siteSupervisor", "name email")
      .populate("tasks")
      // .populate("boq.supplier", "name email");

    res.status(200).json({ organization, projects });
  } catch (error) {
    console.error("Error fetching organization projects:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



/// 🚀 Accept a Project
exports.acceptProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.body;

    // Find the project and ensure it belongs to the correct organization
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.organization.toString() !== organizationId) {
      return res.status(400).json({ error: "Project does not belong to the specified organization" });
    }

    // Update project status to "Accepted"
    project.status = "Accepted";
    await project.save();

    res.json({ message: "Project accepted successfully", project });
  } catch (error) {
    res.status(500).json({ error: "Error accepting project" });
  }
};


// 🚀 Reject a Project
exports.rejectProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.body;

    // Find the project and ensure it belongs to the correct organization
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.organization.toString() !== organizationId) {
      return res.status(400).json({ error: "Project does not belong to the specified organization" });
    }

    // Update project status to "Rejected"
    project.status = "Rejected";
    await project.save();

    res.json({ message: "Project rejected successfully", project });
  } catch (error) {
    res.status(500).json({ error: "Error rejecting project" });
  }
};


// 🚀 Assign Supervisor to a Project
exports.assignSupervisor = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, name, organizationId } = req.body;

    // Find the project and ensure it belongs to the correct organization
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.organization.toString() !== organizationId) {
      return res.status(400).json({ error: "Project does not belong to the specified organization" });
    }

    // Assign supervisor
    project.supervisor = { email, name, status: "Pending" };
    await project.save();

    // Send email to the new Supervisor
    sendEmail(email, "Supervisor Assignment", 
      `You have been assigned as the Supervisor for project: ${project.name}. Please accept or reject.`);

    res.json({ message: "Supervisor assigned successfully", project });
  } catch (error) {
    res.status(500).json({ error: "Error assigning Supervisor" });
  }
};

exports.updateSiteSupervisor =  async ( req, res) => {
  const {name ,  email} =  req.body ; 
   const { projectId } =  req.params ;
   try  {
    const project = await Projct.findById(projectId) ; 
    if(!project) return res.status(404).json({
      message:"Project not Found"
    });
    //save invite logic to DB
    const token = crypto.randomBytes(32).toString('hex');
    const invite = await Invite.create({
      role:"sitesupervisor" , 
      status:"Pending" , 
      token:token,
      expiresAt: new Date(Date.now()  +  24*60*60*1000),
    })

    //send email from utility


    //udate project wiht endig project manager info 
    project.supervisor =  {
      name,  
      email , 
      status: 'Pending' , 
    };
    await project.save();

     // Send email with tokens
     const subject = "You're invited as Site Supervisor ";
     const baseActionLink = `http://localhost:5173/invite/handle?token=${token}`;
     const content = `
       You’ve been invited to join as a <strong>Site Supervisor</strong> for the project <b>${project.name}</b>.<br/>
       Click the link below to accept or reject the invitation.
     `;
 
     await sendEmail(email, subject, content, baseActionLink);
    res.status(200).json({message:  "invie sent to new Site Supervisor"});
  }
  catch(err){
    console.error("Supervisor update failed:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
   };


// 🚀 Assign Project Manager
exports.assignProjectManager = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, name, organizationId } = req.body;

    // Find the project and ensure it belongs to the correct organization
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.organization.toString() !== organizationId) {
      return res.status(400).json({ error: "Project does not belong to the specified organization" });
    }

    project.projectManager = { email, name, status: "Pending" };
    await project.save();

    // Send an email to the new Project Manager
    sendEmail(email, "Project Manager Assignment", 
      `You have been assigned as the Project Manager for project: ${project.name}. Please accept or reject.`);

    res.json({ message: "Project Manager assigned successfully", project });
  } catch (error) {
    res.status(500).json({ error: "Error assigning Project Manager" });
  }
};


exports.updateBoqItems = async (req, res) => {
  const { projectId } = req.params;
  const { boqItems } = req.body;

  if (!Array.isArray(boqItems) || boqItems.length === 0) {
    return res.status(400).json({ error: "BOQ items are required" });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Push new items to existing BOQ
    project.boq.push(...boqItems);

    await project.save();
    return res.status(200).json({ message: "BOQ updated", project });
  } catch (err) {
    console.error("BOQ Update Error:", err);
    res.status(500).json({ error: "Server error while updating BOQ" });
  }
};

// 🚀 Generate BOQ Report
exports.generateBOQReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const totalProjectCost = project.boq.reduce((sum, item) => sum + item.totalCost, 0);
    res.json({ project: project.name, boq: project.boq, totalCost: totalProjectCost });
  } catch (error) {
    res.status(500).json({ error: "Error generating BOQ report" });
  }
};

// 🚀 Generate Project Progress Report
exports.generateProgressReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ error: "Project not found" });

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === "Completed").length;
    const progress = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

    res.json({
      project: project.name,
      totalTasks,
      completedTasks,
      progress: `${progress}%`
    });
  } catch (error) {
    res.status(500).json({ error: "Error generating progress report" });
  }
};

//get project details


exports.getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
 
    const project = await Project.findById(projectId)
      .populate("siteSupervisor", "name email role") // Populates only these fields
      // .populate("boq.supplier", "name email role")   // Populates each supplier inside BOQ
      .populate("tasks");                            // Also populate tasks if needed

    if (!project) return res.status(404).json({ message: "Project not found" });

    // ✅ Add this line below to inspect the project data
    console.log("Project Details:", project);
    res.status(200).json(project);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProjectManager =  async ( req, res) => {
  const {name ,  email} =  req.body ; 
   const { projectId } =  req.params ;
   try  {
    const project = await Projct.findById(projectId) ; 
    if(!project) return res.status(404).json({
      message:"Project not Found"
    });
    //save invite logic to DB
    const token = crypto.randomBytes(32).toString('hex');
    const invite = await Invite.create({
      role:"projectmanager" , 
      status:"Pending" , 
      token:token,
      expiresAt: new Date(Date.now()  +  24*60*60*1000),
    })

    //send email from utility


    //udate project wiht endig project manager info 
    project.projectManager =  {
      name,  
      email , 
      status: 'Pending' , 
    };
    await project.save();

     // Send email with token
     const subject = "You're invited as Project Manager";
     const baseActionLink = `http://localhost:5173/invite/handle?token=${token}`;
     const content = `
       You’ve been invited to join as a <strong>Project Manager</strong> for the project <b>${project.name}</b>.<br/>
       Click the link below to accept or reject the invitation.
     `;
 
     await sendEmail(email, subject, content, baseActionLink);
    res.status(200).json({message:  "invie sent to new Project Manager"});
  }
  catch(err){
    console.error("Manager update failed:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
   };


   exports.getProjectsByLoggedInUserOrg = async (req, res) => {
  try {
    const orgId = req.user.organization?._id;

    if (!orgId) {
      return res.status(404).json({ message: "User not linked to any organization" });
    }

    const projects = await Project.find({ organization: orgId })
      .populate("tasks")
      .populate({
    path: "boq",
    populate: {
      path: "sections"
    }
    })
      .populate("siteSupervisor", "name email");

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("❌ Failed to fetch projects:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ⚠️ Use only for dev/debugging
