const express = require("express")
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware")
const { markAttendanceByQR } = require("../controllers/employeeManagementController/attendanceController")
const router = express.Router()


router.post(
  "/mark-by-qr" , 
  authenticateUser,  
  authorizeRoles("supervisor" , "admin"), 
  markAttendanceByQR
);  
module.exports =   router ; 
