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
