const Attendance = require('../../models/AttendanceTrackingSystem/Attendance');
// const Employee
const mongoose = require('mongoose');
const EmployeeProfileSchema = require('../../models/AttendanceTrackingSystem/EmployeeProfileSchema');
const Project = require('../../models/Project');
// const { method } = require('../models/DailyProgress');

exports.markAttendanceByQR = async (req, res) => {
  try {
    const { employeeId, projectId, location } = req.body;
    const userId = req.user._id; // Logged in Supervisor

    const employee = await EmployeeProfileSchema.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const alreadyMarked = await Attendance.findOne({
      employeeId,
      project: projectId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (alreadyMarked) {
      return res.status(400).json({ message: "Attendance already marked for today" });
    }

    const attendance = new Attendance({
      employeeId,
      project: projectId,
      date: new Date(),
      status: "Present",
      checkInTime: new Date(),
      method: "QR",
      location: {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      },
      markedBy: userId,
    });

    await attendance.save();

    return res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (err) {
    console.error("Attendance not marked:", err);
    res.status(500).json({ message: "Server Error" });
  }
};



