const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const sendEmail = require("../config/email");
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const mongoose = require("mongoose");

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      status,
      durationInDays,
      expectedCost,
      boqQuantityTarget, // ✅ ADD THIS
      unitOfMeasure,
      attachments ,
      boqReference // ✅ Add this
    } = req.body;

    const projectId = req.params.projectId || req.body.projectId;
     const project = await Project.findById(projectId);
    // ✅ ADD THIS LOG RIGHT HERE
    console.log("🧠 Project Assignees:");
    console.log("Manager:", project.projectManager);
    console.log("Supervisor:", project.siteSupervisor);
    console.log("Assigned Users:", project.assignedUsers);
    const currentUser = req.user;

        console.log("Received payload:", {
      title,
      assignedTo,
      projectId,
      durationInDays,
      expectedCost,
      unitOfMeasure
    });


    // Validate required fields
    if (!title || !assignedTo || !projectId || !durationInDays || !expectedCost || !unitOfMeasure || !boqQuantityTarget) {
      return res.status(400).json({
        error: "Missing required fields: title, assignedTo, projectId, durationInDays, expectedCost, unitOfMeasure ,  boqQuantityTarget"
      });
    }

    // Only admin or project manager can assign tasks
    if (!["admin", "projectmanager"].includes(currentUser.role)) {
      return res.status(403).json({ error: "Not authorized to assign tasks" });
    }

    // Fetch project
    // const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // ✅ Extract all valid assignee IDs: assignedUsers + projectManager + siteSupervisor
    const validUserIds = [
      project.projectManager?._id?.toString(),
      project.siteSupervisor?._id?.toString(),
      ...project.assignedUsers.map(u => u._id.toString())
    ].filter(Boolean); // remove undefined/null if any

    // ✅ Validate assignedTo users
    const invalidUsers = assignedTo.filter(id => !validUserIds.includes(id.toString()));
    if (invalidUsers.length > 0) {
      return res.status(400).json({ error: "Some users are not assigned to this project", invalidUsers });
    }

    // Calculate dates
    const startDate = new Date();
    const expectedEndDate = new Date();
    expectedEndDate.setDate(startDate.getDate() + parseInt(durationInDays));

    // Create task
    const task = await Task.create({
  title,
  description: description || "",
  assignedTo,
  status: status || "Not Started",
  startDate,
  expectedEndDate,
  expectedCost,
  unitOfMeasure,
  boqQuantityTarget,
  boqReference, // ✅ Include here
  project: projectId,
  attachments: attachments || []
});



    // Push task to project
    project.tasks.push(task._id);
    await project.save();

    // 🔔 Send notification email to assigned users
    for (const userId of assignedTo) {
      const user = await User.findById(userId);
      if (user?.email) {
        sendEmail(
          user.email,
          "New Task Assigned",
          `You have been assigned a task: ${title}\nProject: ${project.name}\nDuration: ${durationInDays} days`
        );
      }
    }

    res.status(201).json(task.toObject({ virtuals: true }));
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ error: "Task creation failed", details: error.message });
  }
};

// Edit task
exports.editTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;
    const {
      title, description, assignedTo,
      expectedCost, unitOfMeasure, durationInDays,
      status ,  boqQuantityTarget
    } = req.body;

    if (!["admin", "projectmanager"].includes(currentUser.role)) {
      return res.status(403).json({ error: "Unauthorized to edit task" });
    }

    const task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (title) task.title = title;
    if (description) task.description = description;
    if (expectedCost !== undefined) task.expectedCost = expectedCost;
    if (unitOfMeasure) task.unitOfMeasure = unitOfMeasure;
    if (status) task.status = status;
    if (req.body.boqReference) task.boqReference = req.body.boqReference;
    if (boqQuantityTarget !== undefined) task.boqQuantityTarget = boqQuantityTarget;
    if (assignedTo && Array.isArray(assignedTo)) task.assignedTo = assignedTo;

    // ✅ Update duration and recalculate expectedEndDate
    if (durationInDays && typeof durationInDays === "number") {
      const startDate = task.startDate || new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationInDays);
      task.expectedEndDate = endDate;
    }

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task: task.toObject({ virtuals: true }) });

  } catch (error) {
    console.error("Edit Task Error:", error);
    res.status(500).json({ error: "Failed to update task", details: error.message });
  }
};

// Soft delete task
exports.softDeleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { isDeleted: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task soft-deleted successfully", task });
  } catch (error) {
    res.status(500).json({ error: "Soft delete failed", details: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  const { taskId } = req.params;

  // 👉 Add this console log here:
  console.log("👉 Raw taskId:", taskId, "Length:", taskId.length, "isValid:", mongoose.Types.ObjectId.isValid(taskId));

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: "Invalid task ID format" });
  }

  try {
    const task = await Task.findOne({ _id: taskId, isDeleted: false })
      .populate({
        path: 'assignedTo',
        select: 'name email',
        strictPopulate: false,
      })
      .populate('project', 'name')
      .populate({ path: 'parentTask', select: 'title' });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const subtasks = await Task.find({ parentTask: taskId, isDeleted: false });

    res.status(200).json({
      task: task.toObject({ virtuals: true }),
      subtasks
    });
  } catch (error) {
    console.error("🔥 Get Task Error:", error);
    res.status(500).json({ error: "Failed to fetch task", details: error.message });
  }
};

exports.addSubtask = async (req, res) => {
  try {
    const { parentTaskId } = req.params;

    const {
      title,
      description,
      assignedTo,
      status,
      expectedCost,
      unitOfMeasure,
      boqQuantityTarget,
      attachments,
      durationInDays = 0,
      boqReference // ✅ NEW: Destructure boqReference from request body
    } = req.body;

    const currentUser = req.user;
    if (!["admin", "projectmanager"].includes(currentUser.role)) {
      return res.status(403).json({ error: "Unauthorized to add subtask" });
    }

    const parentTask = await Task.findOne({ _id: parentTaskId, isDeleted: false });
    if (!parentTask) return res.status(404).json({ error: "Parent task not found" });

    const project = await Project.findById(parentTask.project).populate(["assignedUsers", "projectManager", "siteSupervisor"]);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // ✅ Validate assigned users
    const validUserIds = [
      ...project.assignedUsers.map(u => u._id?.toString?.() || u.toString()),
      project.projectManager?._id?.toString?.(),
      project.siteSupervisor?._id?.toString?.()
    ].filter(Boolean);

    const invalidUsers = assignedTo?.filter(id => !validUserIds.includes(id));
    if (invalidUsers?.length > 0) {
      return res.status(400).json({ error: "Some users are not part of this project", invalidUsers });
    }

    const startDate = new Date();
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setDate(startDate.getDate() + parseInt(durationInDays || 0));

    // ✅ Build subtask data
    const subtaskData = {
      title,
      description: description || "",
      assignedTo: assignedTo || [],
      status: status || "Not Started",
      startDate,
      expectedEndDate,
      boqQuantityTarget: boqQuantityTarget || 0,
      durationInDays: parseInt(durationInDays) || 0,
      unitOfMeasure: unitOfMeasure || "nos",
      attachments: attachments || [],
      project: project._id,
      parentTask: parentTaskId
    };

    // ✅ Add optional fields
    if (expectedCost !== undefined) subtaskData.expectedCost = expectedCost;
    if (unitOfMeasure) subtaskData.unitOfMeasure = unitOfMeasure;
    if (attachments) subtaskData.attachments = attachments;
    if (boqReference) subtaskData.boqReference = boqReference; // ✅ NEW: Save boqReference if provided

    // ✅ Create subtask
    const subtask = await Task.create(subtaskData);

    // Optional: link subtask ID to parent task
    parentTask.subtasks = parentTask.subtasks || [];
    parentTask.subtasks.push(subtask._id);
    await parentTask.save();

    // ✅ Send email notification
    for (const userId of assignedTo || []) {
      const user = await User.findById(userId);
      if (user?.email) {
        sendEmail(
          user.email,
          "New Subtask Assigned",
          `You have been assigned a subtask: ${title}\nProject: ${project.name}\nDuration: ${durationInDays} days`
        );
      }
    }

    res.status(201).json({ message: "Subtask created successfully ✅", subtask });

  } catch (error) {
    console.error("Add Subtask Error:", error);
    res.status(500).json({ error: "Failed to create subtask", details: error.message });
  }
};



// Upload attachments to Cloudinary
exports.uploadAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) return res.status(404).json({ error: "Task not found" });

    for (const file of files) {
    const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "task_attachments" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

for (const file of files) {
  const result = await streamUpload(file.buffer);
  task.attachments.push({ public_id: result.public_id, url: result.secure_url });
}
    }

    await task.save();
    res.status(200).json({ message: "Attachments uploaded", attachments: task.attachments });

  } catch (error) {
    console.error("Attachment upload error:", error);
    res.status(500).json({ error: "Attachment upload failed", details: error.message });
  }
};


exports.deleteAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { publicId } = req.query;

    if (!publicId) return res.status(400).json({ error: "Missing publicId" });

    const task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const attachment = task.attachments.find(att => att.public_id === publicId);
    if (!attachment) return res.status(404).json({ error: "Attachment not found in task" });

    await cloudinary.uploader.destroy(publicId);

    task.attachments = task.attachments.filter(att => att.public_id !== publicId);
    await task.save();

    res.status(200).json({ message: "Attachment deleted", attachments: task.attachments });
  } catch (error) {
    console.error("Delete Attachment Error:", error);
    res.status(500).json({ error: "Failed to delete attachment", details: error.message });
  }
};
