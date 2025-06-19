const express = require('express');
const router = express.Router();
const { 
  markAttendance,
  getAttendanceByDate,
  getAttendanceByWorker,
  getAttendanceByProject,
  updateAttendance,
  getAttendanceStats
} = require('../controllers/attendanceController');

// Mark attendance for workers
router.post('/', markAttendance);

// Get attendance by date
router.get('/date/:date', getAttendanceByDate);


// Get attendance by worker
router.get('/worker/:workerId', getAttendanceByWorker);

// Get attendance by project
router.get('/project/:projectId', getAttendanceByProject);

// Get attendance statistics
router.get('/stats', getAttendanceStats);

// Update attendance
router.put('/:id', updateAttendance);

module.exports = router;