const mongoose = require('mongoose');

const plantTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plant type name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  emoji: {
    type: String,
    trim: true,
    default: '🌱'
  },
  description: {
    type: String,
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  detailedDescription: {
    type: String,
    trim: true
  },
  uses: [{
    type: String,
    trim: true
  }],
  varieties: [{
    type: String,
    trim: true
  }],
  growingSeason: {
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter', 'year-round', ''],
    required: false
  },
  sunRequirement: {
    type: String,
    enum: ['full-sun', 'partial-sun', 'shade', ''],
    required: false
  },
  waterRequirement: {
    type: String,
    enum: ['low', 'medium', 'high', ''],
    required: false
  },
  growthCycle: {
    seedingTimeDays: { type: Number, min: 0 },
    germinationDays: { type: Number, min: 0 },
    floweringTimeDays: { type: Number, min: 0 },
    fruitingTimeDays: { type: Number, min: 0 },
    harvestTimeDays: { type: Number, min: 0 },
    totalTimeToHarvestDays: { type: Number, min: 0 },
    growthExplanation: { type: String, trim: true }
  },
  climate: {
    temperatureCelsius: {
      min: { type: Number },
      max: { type: Number }
    },
    rainfall: { type: String, trim: true },
    sunlight: { type: String, trim: true },
    humidity: { type: String, trim: true },
    climateExplanation: { type: String, trim: true }
  },
  soil: {
    soilType: [{ type: String, trim: true }],
    phRange: {
      min: { type: Number },
      max: { type: Number }
    },
    drainage: { type: String, trim: true },
    soilExplanation: { type: String, trim: true }
  },
  watering: {
    method: { type: String, trim: true },
    frequency: { type: String, trim: true },
    waterRequirement: { type: String, trim: true },
    wateringExplanation: { type: String, trim: true }
  },
  spacing: {
    plantToPlantCm: { type: Number, min: 0 },
    rowToRowCm: { type: Number, min: 0 }
  },
  lifespanYears: {
    type: Number,
    min: 0
  },
  careTips: [{
    type: String,
    trim: true
  }],
  commonProblems: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
plantTypeSchema.index({ name: 1, organizationId: 1 });
plantTypeSchema.index({ category: 1, isActive: 1 });



module.exports = mongoose.model('PlantType', plantTypeSchema);
