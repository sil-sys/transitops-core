const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    cargoType: {
      type: String,
      default: '',
    },
    cargoWeight: {
      type: Number,
      required: [true, 'Cargo weight is required'],
      min: [0, 'Cargo weight cannot be negative'],
    },
    volume: {
      type: Number,
      default: 0,
      min: [0, 'Volume cannot be negative'],
    },
    packages: {
      type: Number,
      default: 0,
      min: [0, 'Packages cannot be negative'],
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    plannedDistance: {
      type: Number,
      required: [true, 'Planned distance is required'],
      min: [0, 'Planned distance cannot be negative'],
    },
    stops: {
      type: [String],
      default: [],
    },
    estimatedDistance: {
      type: Number,
      default: 0,
      min: [0, 'Estimated distance cannot be negative'],
    },
    estimatedDuration: {
      type: Number,
      default: 0,
      min: [0, 'Estimated duration cannot be negative'],
    },
    finalOdometer: {
      type: Number,
      default: null,
      min: [0, 'Final odometer cannot be negative'],
    },
    fuelConsumed: {
      type: Number,
      default: null,
      min: [0, 'Fuel consumed cannot be negative'],
    },
    revenue: {
      type: Number,
      default: null,
      min: [0, 'Revenue cannot be negative'],
    },
    checklist: {
      driverAssigned: { type: Boolean, default: false },
      vehicleAssigned: { type: Boolean, default: false },
      documentsUploaded: { type: Boolean, default: false },
      routePlanned: { type: Boolean, default: false },
      fuelPlanned: { type: Boolean, default: false },
      cargoVerified: { type: Boolean, default: false },
      safetyInspection: { type: Boolean, default: false },
    },
    documents: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
    status: {
      type: String,
      enum: [
        'Draft',
        'Vehicle Assigned',
        'Driver Assigned',
        'Route Planned',
        'Ready for Approval',
        'Approved',
        'Ready for Dispatch',
        'Dispatched',
        'Completed',
        'Cancelled'
      ],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);