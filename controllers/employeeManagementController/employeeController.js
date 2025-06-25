const EmployeeProfileSchema = require("../../models/AttendanceTrackingSystem/EmployeeProfileSchema");

exports.createEmployeeProfile = async (req, res) => {
  try {
    const { name, email, phone, designation, department, baseSalary, salaryType, organization } = req.body;

    const existing = await EmployeeProfileSchema.findOne({ email });
    if (existing) return res.status(400).json({ message: "Employee already exists with this email" });

    const employee = new EmployeeProfileSchema({
      name,
      email,
      phone,
      designation,
      department,
      baseSalary,
      salaryType,
      organization
    });

    await employee.save();
    return res.status(201).json({ message: "Employee created", employee });
  } catch (err) {
    console.error("❌ Error creating employee:", err);
    res.status(500).json({ message: "Server error" });
  }
};

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
