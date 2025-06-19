const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/Organization");

// Middleware to verify authentication
exports.authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Fetch user and populate organization
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("organization");

    if (!user) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.user = user;

    console.log(`✅ Authenticated User: ${user.email}, Org: ${user.organization?.name}`);
    next();
  } catch (error) {
    console.error("❌ Authentication Error:", error);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};


// Middleware to restrict access based on roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission for this action." });
    }
    next();
  };
};

// Ensure an admin can create only one organization
exports.restrictAdminToOneOrg = async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Only an admin can create an organization." });
    }

    const existingOrg = await Organization.findOne({ admin: req.user._id });

    if (existingOrg) {
      return res.status(400).json({ error: "You have already created an organization." });
    }

    next();
  } catch (error) {
    console.error("❌ Admin Restriction Error:", error);
    return res.status(500).json({ error: "Server error." });
  }
};

// Ensure an organization exists before project creation
exports.ensureOrganizationExists = async (req, res, next) => {
  try {
    const userOrganization = await Organization.findOne({ admin: req.user._id });

    if (!userOrganization) {
      return res.status(400).json({ error: "You cannot create a project without an organization." });
    }

    console.log(`✅ Organization Verified: ${userOrganization.name}`);
    next();
  } catch (error) {
    console.error("❌ Organization Verification Error:", error);
    return res.status(500).json({ error: "Server error." });
  }
};


// Middleware to restrict access based on roles for marking attendance
exports.authorizeAttendance = (role) => {
  return (req, res, next) => {
    const { role: userRole, email: userEmail } = req.user;  // User's role and email (authenticated user)
    const { userEmail: markedEmail } = req.body;  // Email of the user whose attendance is being marked

    // Admin can mark attendance for Project Managers
    if (userRole === 'admin' && role === 'projectmanager') {
      return next();
    }

    // Project Manager can mark attendance for Site Supervisors
    if (userRole === 'projectmanager' && role === 'sitesupervisor') {
      return next();
    }

    // Site Supervisor can mark attendance for Labours (Skilled and Unskilled)
    if (userRole === 'sitesupervisor' && (role === 'skilled' || role === 'unskilled')) {
      return next();
    } 

    return res.status(403).json({ error: "You do not have permission to mark attendance for this role." });
  };
};
