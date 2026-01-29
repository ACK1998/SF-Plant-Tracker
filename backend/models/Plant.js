const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['planted', 'growing', 'mature', 'harvested', 'dormant', 'diseased', 'dead'],
    required: true
  },
  health: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'deceased'],
    required: true
  },
  growthStage: {
    type: String,
    enum: ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature'],
    required: true
  },
  image: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wateringAmount: {
    type: Number, // in liters
    default: 0
  },
  fertilizerApplied: {
    type: String,
    trim: true
  },
  pestsDetected: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plant name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Plant type is required'],
    trim: true
  },
  variety: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['plant', 'tree', 'vegetable', 'herb', 'fruit', 'grain', 'legume'],
    default: 'plant'
  },
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: [true, 'Plot is required']
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: [true, 'Domain is required']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  plantedDate: {
    type: Date,
    required: [true, 'Planted date is required']
  },
  plantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Planter is required']
  },
  planter: {
    type: String,
    trim: true,
    required: [true, 'Planter name is required']
  },
  lastWatered: {
    type: Date
  },
  nextWateringDate: {
    type: Date
  },
  health: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'deceased'],
    default: 'good'
  },
  growthStage: {
    type: String,
    enum: ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature'],
    default: 'seedling'
  },
  image: {
    type: String,
    trim: true
  },
  statusHistory: [statusHistorySchema],
  expectedHarvestDate: {
    type: Date
  },
  actualHarvestDate: {
    type: Date
  },
  harvestYield: {
    type: Number, // in kg
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  latitude: {
    type: Number,
    required: false,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: false,
    min: -180,
    max: 180
  }
}, {
  timestamps: true
});

// Index for better query performance
plantSchema.index({ organizationId: 1, plotId: 1 });
plantSchema.index({ plantedDate: -1 });
plantSchema.index({ health: 1 });
plantSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Plant', plantSchema);