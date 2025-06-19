const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createTask,
  editTask,
  softDeleteTask,
  getTaskById,
  addSubtask,
  uploadAttachments,
  deleteAttachment
} = require("../controllers/taskController");

const Task = require("../models/Task");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new task
router.post("/:projectId/create", authenticateUser, createTask);

// Get all tasks for a project (excluding soft-deleted)
router.get('/:projectId/tasks', authenticateUser, async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const tasks = await Task.find({ project: projectId, isDeleted: false })
      .populate("assignedTo", "name email"); // ✅ Populate name & email

    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});


// Get single task by ID (with subtasks, virtuals, etc.)
router.get('/:taskId', authenticateUser, authorizeRoles("admin" ,  "projectmanager" , "sitesupervisor") , getTaskById);




// Get all status options
router.get("/status-options", (req, res) => {
  const statusEnum = Task.schema.path("status").enumValues;
  res.json(statusEnum);
});

// Update task status
router.patch('/:taskId/status', authenticateUser, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, isDeleted: false },
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Status updated", task: updatedTask });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// Edit task
router.put('/:taskId/edit', authenticateUser, authorizeRoles('admin', 'projectmanager'), editTask);

// Soft delete task
router.delete('/:taskId/soft-delete', authenticateUser, authorizeRoles("admin", "projectmanager"), softDeleteTask);

// Add a subtask
router.post('/:parentTaskId/subtask', authenticateUser, authorizeRoles("admin", "projectmanager"), addSubtask);

// Upload attachments (Cloudinary)
router.post(
  '/:taskId/attachments',
  authenticateUser,
  authorizeRoles("admin", "projectmanager"), // optional but recommended
  upload.array("attachments", 5),
  uploadAttachments
);

// Delete a specific attachment from a task
router.delete(
  '/:taskId/attachments',
  authenticateUser,
  authorizeRoles("admin", "projectmanager"),
  deleteAttachment
);


module.exports = router;
