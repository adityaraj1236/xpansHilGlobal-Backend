const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half-day', 'On-leave'],
    required: true
  },
  checkInTime: Date,
  checkOutTime: Date,

  method: {
    type: String,
    enum: ['QR', 'manual'],
    default: 'QR'
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },

  remarks: {
    type: String,
    trim: true
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 🔐 Prevent duplicate entries
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// 🌍 Enable geo location queries
attendanceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Attendance', attendanceSchema);
