const Organization = require("../models/Organization");

// Create Organization Route
const createOrganization = async (req, res) => {
  try {
    const { name, description, address } = req.body;
    const adminId = req.user.id; // Get admin ID from token

    // 1️⃣ Check if the admin already has an organization
    const existingOrg = await Organization.findOne({ admin: adminId });
    if (existingOrg) {
      return res.status(400).json({ message: "You have already created an organization." });
    }

    // 2️⃣ Check if the organization already exists with the same name
    const organizationExists = await Organization.findOne({ name });
    if (organizationExists) {
      return res.status(400).json({ message: "An organization with this name already exists." });
    }

    // 3️⃣ Create the organization
    const newOrganization = new Organization({
      name,
      description,
      admin: adminId,
      address: {
        ...address,
        updatedAt: new Date()
      },
      projects: [] // Initially no projects
    });

    await newOrganization.save();

    res.status(201).json({
      message: "Organization created successfully",
      organization: newOrganization
    });

  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//getOrganisaion
const getOrganizationByAdmin = async (req, res) => {
  try {
    const userId = req.user._id;

    const organization = await Organization.findOne({
      $or: [
        { admin: userId },
        { members: userId }, // Include PMs, billing engineers, etc.
      ],
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// In organizationController.js
const updateOrganization = async (req, res) => {
    try {
      const adminId = req.user.id;
      const updatedData = req.body;
  
      const org = await Organization.findOneAndUpdate(
        { admin: adminId },
        updatedData,
        { new: true }
      );
  
      res.status(200).json({ message: "Organization updated", organization: org });
    } catch (err) {
      res.status(500).json({ message: "Update failed", error: err.message });
    }
  };
  
module.exports = { createOrganization ,
    getOrganizationByAdmin  , updateOrganization};


