const express = require("express");
const router = express.Router();
const {
  addDailyProgress,
  getProgressForTask,
} = require("../controllers/dailyProgressController");

const {
  authenticateUser,
  authorizeRoles, // this is your role-based middleware
} = require("../middleware/authMiddleware");

// POST: Site Supervisor submits daily update
router.post(
  "/:taskId",
  authenticateUser,
  authorizeRoles("sitesupervisor" ,  "projectmanager"),
  addDailyProgress
);

// GET: Admin, PM, or Site Supervisor can view progress
router.get(
  "/:taskId",
  authenticateUser,
  authorizeRoles("admin", "projectmanager"),
  getProgressForTask
);

module.exports = router;
