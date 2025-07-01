const QRcode =  require("qrcode")
const EmployeeProfileSchema = require("../../models/AttendanceTrackingSystem/EmployeeProfileSchema");
const { cloudinary } = require("../../utils/cloudinary");

exports.createEmployeeProfile = async(req,res) => {
  try{
    const{
      name, email , phone,  designation , department , baseSalary , salaryType, organization
    } = req.body  ;


const existing = await EmployeeProfileSchema.findOne({email}) ; 
if(existing) return res.status(400).json({message:"Employee already exists"}) ; 
    const employee = new EmployeeProfileSchema({
      name , 
      email , 
      phone , 
      designation , 
      department , 
      baseSalary , 
      salaryType ,
      organization
    }) ; 
    await employee.save()  //gets _id
    
    const qrContent = `${employee.name} | ${employee.designation}\nID: ${employee._id.toString()}`;
    const qrDataURL  =  await QRcode.toDataURL(qrContent)

    const uploadedQR = await cloudinary.uploader.upload(qrDataURL ,  {
      folder: "empployee_qrcodes" , 
      public_id: `qr_${employee._id}`
    })

    employee.qrCode = uploadedQR.secure_url ; 
    await employee.save();

    res.status(201).json({message:"Employee Created" , employee}) ; 
  } catch(err){
    console.error("Error creating employee" , err) ; 
    res.status(500).json({message:"Server error"});
  }
}

exports.getEmployeesForLoggedInOrg = async (req, res) => {
  try {
    const orgId = req.user.organization;

    if (!orgId) return res.status(400).json({ message: "User not linked to organization" });

    const employees = await EmployeeProfileSchema.find({ organization: orgId });
    res.status(200).json({ employees });
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees" });
  }
};
