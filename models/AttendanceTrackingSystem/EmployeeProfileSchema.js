const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  designation: {
    type:String , 
    enum:["projectmanager" , "sitesupervisor" , 'engineer' , "skilled" , "unskilled",  "HR" ,  "sales" , "admin"]
    
}, // e.g., Site Supervisor, PM
  department: String,
  baseSalary: Number,
  salaryType: {
    type: String,
    enum: ["monthly", "daily",  "piecewise"],
    default: "monthly" ,
    required:true
  },
  baseSalary:Number, 
  wageRate:Number,
  contractType: {
    type:String ,
    enum: ["permanent" , "contract"] ,
    default:"contract"
  } , 
  contractStartDate:{
      type:Date ,
      required:  function(){
        return this.contractType==="contract" ; 
      }
  },
  contractEndDate:{
    type:Date ,
    required:function(){
      return this.contractType ==="contract" ;
    }
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  qrCode: String ,
  isUserCreated: { type: Boolean, default: false } 
} , {timestamps:true});

// 🔢 Add virtual for duration
EmployeeSchema.virtual("expectedDurationInDays").get(function () {
  if (this.contractStart && this.contractEnd) {
    return Math.ceil((this.contractEnd - this.contractStart) / (1000 * 60 * 60 * 24)) + 1;
  }
  return null;
});


module.exports = mongoose.model("Employee", EmployeeSchema);
