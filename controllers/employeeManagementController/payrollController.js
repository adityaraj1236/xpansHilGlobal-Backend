const Attendance = require("../../models/AttendanceTrackingSystem/Attendance");
const EmployeeProfileSchema = require("../../models/AttendanceTrackingSystem/EmployeeProfileSchema");

exports.calculateDailyWage =  async(req,res) => {

    try{
        const {employeeId , startDate , endDate}  =req.body ; 
        const employee = await EmployeeProfileSchema.findById(employeeId)
        if(!employee) return res.status(404).json({message:"Employee not found"})

        if(employee.salaryType!="daily"){
            return res.status(400).json({message:"This empployee is not on daily wages "})
        }

        //Ensure clean data range 
        const from = new Date(startDate)
        const  to  =  new Date(endDate)
        to.setHours(23,59,59,999)

        const presentDays = await Attendance.countDocuments({
            employeeId,
            status:"Present",
            date: {$gte: from  , $lte: to}
        });
        const totalWage = employee.wageRate*presentDays;
        res.status(200).json({
            employee:employee.name ,
            presentDays , 
            dailyRate:employee.wageRate, 
            totalWage,
            from: from.toDateString() ,
            to: to.toDateString()
        })
    }
    catch(err){
        console.error("wage calculation error" , err) ;
        res.status(500).json({message:"Server Error"} , err.message)
    }
}