const { addDays, format } = require("date-fns");
const mongoose = require("mongoose");
const DailyProgressSchema = require('./DailyProgress');

const AttachmentSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },

  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started"
  },

  startDate: { type: Date },
  expectedEndDate: { type: Date },
  actualEndDate: { type: Date },

  expectedCost: { type: Number, required: true },
  actualCost: { type: Number },

  boqQuantityTarget: {
  type: Number,
  required: true
  },

  unitOfMeasure: {
    type: String,
    required: true,
    enum: ['m³', 'm²', 'kg', 'litre', 'ton', 'ft²', 'ft³', 'nos', 'custom' ,'m' , 'site']
  },

  // Attachments via Cloudinary
  attachments: [AttachmentSchema],

  // Daily logs
  dailyProgress: [DailyProgressSchema],

  // Optional: duration-based creation (for controller use)
  durationInDays: { type: Number },

  // Subtask relationship (recursive)
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  } , 

  //This Flag is Used For Soft Delete
  isDeleted: {
  type: Boolean,
  default: false
}


}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Virtuals
TaskSchema.virtual('currentCompletion').get(function () {
  if (!this.dailyProgress || this.dailyProgress.length === 0) return 0;
  return this.dailyProgress[this.dailyProgress.length - 1].percentageCompleted;
});

TaskSchema.virtual('totalBoqDone').get(function () {
  return this.dailyProgress.reduce((sum, log) => sum + log.boqQuantityDone, 0);
});

TaskSchema.virtual('isDelayed').get(function () {
  if (!this.actualEndDate) return false;
  return this.actualEndDate > this.expectedEndDate;
});

TaskSchema.virtual('delayDays').get(function () {
  if (!this.actualEndDate) return 0;
  const delay = (this.actualEndDate - this.expectedEndDate) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(delay));
});

TaskSchema.virtual('overBudget').get(function () {
  if (!this.actualCost) return false;
  return this.actualCost > this.expectedCost;
});

TaskSchema.virtual("duration").get(function () {
  if (this.startDate && this.expectedEndDate) {
    const durationInMs = this.expectedEndDate - this.startDate;
    return Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
  }
  return 0;
});

TaskSchema.virtual("dailyBoqTargetPlan").get(function () {
  if (!this.startDate || !this.expectedEndDate || !this.boqQuantityTarget) return [];

  const days = Math.ceil((this.expectedEndDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
  const dailyTarget = this.boqQuantityTarget / days;
  const plan = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(this.startDate, i);
    plan.push({
      date: format(date, "yyyy-MM-dd"),
      target: parseFloat(dailyTarget.toFixed(2))
    });
  }

  return plan;
});

module.exports = mongoose.model("Task", TaskSchema);
