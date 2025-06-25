const Attendance = require('../models/AttendanceTrackingSystem/Attendance');
const Worker = require('../models/Worker');
const mongoose = require('mongoose');

// Mark attendance for workers
const markAttendance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { projectId, date, records, markedBy } = req.body;
    
    // Format the date to start of the day to ensure consistency
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    const attendanceRecords = [];
    
    for (const record of records) {
      const { workerId, status, checkInTime, checkOutTime, remarks } = record;
      
      // Check if attendance already exists for this worker on this date
      const existingAttendance = await Attendance.findOne({
        worker: workerId,
        date: formattedDate
      }).session(session);
      
      if (existingAttendance) {
        // Update existing record
        existingAttendance.status = status;
        if (checkInTime) existingAttendance.checkInTime = checkInTime;
        if (checkOutTime) existingAttendance.checkOutTime = checkOutTime;
        if (remarks) existingAttendance.remarks = remarks;
        
        await existingAttendance.save({ session });
        attendanceRecords.push(existingAttendance);
      } else {
        // Create new record
        const newAttendance = new Attendance({
          worker: workerId,
          project: projectId,
          date: formattedDate,
          status,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
          remarks: remarks || '',
          markedBy
        });
        
        await newAttendance.save({ session });
        attendanceRecords.push(newAttendance);
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      message: 'Attendance marked successfully',
      records: attendanceRecords
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

// Get attendance by date
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { projectId } = req.query;
    
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(formattedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const query = {
      date: {
        $gte: formattedDate,
        $lt: nextDay
      }
    };
    
    if (projectId) {
      query.project = projectId;
    }
    
    const attendance = await Attendance.find(query)
      .populate('worker', 'name role type')
      .populate('project', 'name')
      .populate('markedBy', 'name');
    
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by worker
const getAttendanceByWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = { worker: workerId };
    
    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate);
      formattedStartDate.setHours(0, 0, 0, 0);
      
      const formattedEndDate = new Date(endDate);
      formattedEndDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: formattedStartDate,
        $lte: formattedEndDate
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('worker', 'name role type')
      .populate('project', 'name')
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by project
const getAttendanceByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = { project: projectId };
    
    if (startDate && endDate) {
      const formattedStartDate = new Date(startDate);
      formattedStartDate.setHours(0, 0, 0, 0);
      
      const formattedEndDate = new Date(endDate);
      formattedEndDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: formattedStartDate,
        $lte: formattedEndDate
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('worker', 'name role type')
      .populate('project', 'name')
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const attendance = await Attendance.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('worker', 'name role type')
      .populate('project', 'name')
      .populate('markedBy', 'name');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.status(200).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    // Format dates
    const formattedStartDate = startDate ? new Date(startDate) : new Date();
    formattedStartDate.setHours(0, 0, 0, 0);
    
    const formattedEndDate = endDate ? new Date(endDate) : new Date();
    formattedEndDate.setHours(23, 59, 59, 999);
    
    // Build the query
    const query = {
      date: {
        $gte: formattedStartDate,
        $lte: formattedEndDate
      }
    };
    
    if (projectId) {
      query.project = projectId;
    }
    
    // Get attendance stats
    const stats = await Attendance.aggregate([
      { $match: query },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // Get worker type stats
    const workerTypeStats = await Attendance.aggregate([
      { $match: query },
      { $lookup: {
        from: 'workers',
        localField: 'worker',
        foreignField: '_id',
        as: 'workerDetails'
      }},
      { $unwind: '$workerDetails' },
      { $group: {
        _id: {
          status: '$status',
          workerType: '$workerDetails.type'
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.workerType': 1, '_id.status': 1 } }
    ]);
    
    res.status(200).json({
      overallStats: stats,
      workerTypeStats: workerTypeStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getAttendanceByWorker,
  getAttendanceByProject,
  updateAttendance,
  getAttendanceStats
};