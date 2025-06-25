const express = require("express");
const { createEmployeeProfile, getEmployeesForLoggedInOrg } = require("../../controllers/employeeManagementController/employeeController");
const { authenticateUser, authorizeRoles } = require("../../middleware/authMiddleware");
const router = express.Router();


router.post("/create", createEmployeeProfile);
router.get(
  "/mine",
  authenticateUser,
  authorizeRoles("admin", "hr", "projectmanager"),
  getEmployeesForLoggedInOrg
);

module.exports = router;
