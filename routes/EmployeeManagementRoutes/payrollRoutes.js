const EmployeeProfileSchema = require("../../models/AttendanceTrackingSystem/EmployeeProfileSchema");

exports.calcutlateDailyWage =  async(req, res) => {
    try{
        const {employeeId ,  startDate , endDate} = req.body; 
        const employee = await EmployeeProfileSchema.findById(employeeId)
        if(!employee) return res.staus(404).json({message:"Employee not found"}) ;
    }
}