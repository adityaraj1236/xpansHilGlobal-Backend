const express = require("express");
const { createOrganization  , getOrganizationByAdmin ,  updateOrganization } = require("../controllers/organizationController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Only Admin can create an organization
router.post("/create", authenticateUser, authorizeRoles("admin"), createOrganization);
router.get("/my-organization", authenticateUser, getOrganizationByAdmin); // ✅ This route
router.put("/update", authenticateUser, authorizeRoles("admin"), updateOrganization);

module.exports = router;
