const mongoose = require("mongoose");
const Task = require("./Task.js"); // Import Task model
const Organization = require("./Organization"); // Import Organization model
const User = require("./User"); // Import User model

// BOQ Schema (Bill of Quantities)
// const BOQItemSchema = new mongoose.Schema({
//   category: { type: String, enum: ["Material", "Labor", "Equipment", "Other"], required: true },
//   description: { type: String, required: true },
//   quantity: { type: Number, required: true },
//   unit: { type: String, required: true },
//   unitPrice: { type: Number, required: true },
//   totalPrice: { type: Number, required: true },
//   supplier: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "User",  // Referencing the User model (where role is vendor)
//     required: true, 
//     validate: {
//       validator: async function(value) {
//         const supplier = await User.findById(value);
//         return supplier && supplier.role === 'vendor';  // Ensure the role is vendor
//       },
//       message: 'Supplier must be a vendor'
//     }
//   },
//   deliveryDate: { type: Date },
//   receivedQuantity: { type: Number, default: 0 },
//   remainingQuantity: { 
//     type: Number, 
//     default: function () {
//       return this.quantity - this.receivedQuantity;
//     }
//   },
//   status: { type: String, enum: ["Ordered", "Received", "Pending", "Cancelled"], default: "Pending" },
//   remarks: { type: String }
// }, { timestamps: true });

// Site Supervisor Schema (Only Project Manager Can Assign)
const SiteSupervisorSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" }
});

// Project Schema
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["Pending", "In Progress", "Completed", "On Hold"], default: "Pending" },

  // Organization that the project belongs to
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization", // Link the project to an organization
    required: true,
  },

  // Project Manager (Single)
  projectManager: {
    type: new mongoose.Schema({
      
      email: { type: String, required: true },
      name: { type: String, required: false },
      status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" }
    }),
    required: true
  },

  // Assigned Users (Multiple)
  assignedUsers: [
    {
      email: { type: String, required: true },
      role: { type: String, enum: ["Engineer", "Worker", "Architect", "Contractor",  "billingengineer"]},
      status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" }
    }
  ],


  //Addition of team memebers 
  teamMembers: [
  {
    name: String,
    email: String,
    role: String // e.g., "Foreman", "Senior Site Engineer", etc.
  }
],

  // Site Supervisor (Only One)
  siteSupervisor: {
    type: new mongoose.Schema({
      email: { type: String, required: true },
      name: { type: String, required: true },
      status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" }
    })
  },


 storeKeeper: {
  type: new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" }
  })
}
,

billingEngineer: {
  name: String,
  email: String,
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  }
},
  // siteSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to User model

  // BOQ (List of materials, labor, and costs)
  // boq: [BOQItemSchema],

  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }], // Storing Task References

  // Approvals (Tracking who approved what)
  approvals: [
    {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
      role: { type: String, enum: ["Admin", "Project Manager", "Client"], required: true },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      remarks: { type: String }
    }
  ],

  budget: { type: mongoose.Types.Decimal128, required: true }, // Total estimated budget
  location: { type: String, required: true }, // Construction Site Location
}, { timestamps: true });

ProjectSchema.virtual('purchaseOrders' , {
  ref: 'PurchaseOrder',
  localField: '_id',
  foreignField: 'project'
}) ; 
ProjectSchema.virtual("boq", {
  ref: "BOQ",
  localField: "_id",
  foreignField: "projectId",
  justOne: true, // Because one project has one BOQ
});


// ProjectSchema.virtual("boqEntries", {
//   ref: "BOQEntry",
//   localField: "_id",
//   foreignField: "projectId"
// });

ProjectSchema.set('toJSON' , {virtuals: true});
ProjectSchema.set('toObject' , {virtuals: true});

module.exports = mongoose.model("Project", ProjectSchema);
