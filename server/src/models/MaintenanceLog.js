const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    type: {
      type: String,
      required: [true, 'Maintenance type is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Active', 'Closed'],
      default: 'Active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);