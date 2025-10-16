const mongoose = require('mongoose');

const plantVarietySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Variety name is required'],
    trim: true
  },
  plantTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlantType',
    required: [true, 'Plant type is required']
  },
  plantTypeName: {
    type: String,
    required: [true, 'Plant type name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  characteristics: {
    color: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    taste: {
      type: String,
      trim: true
    },
    texture: {
      type: String,
      trim: true
    }
  },
  growingInfo: {
    daysToMaturity: {
      type: Number,
      min: 0
    },
    height: {
      type: String,
      trim: true
    },
    spacing: {
      type: String,
      trim: true
    },
    harvestTime: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
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

// Compound index to ensure unique variety names per plant type within an organization
plantVarietySchema.index({ name: 1, plantTypeId: 1, organizationId: 1 }, { unique: true });
plantVarietySchema.index({ plantTypeId: 1, isActive: 1 });
plantVarietySchema.index({ organizationId: 1, isActive: 1 });

module.exports = mongoose.model('PlantVariety', plantVarietySchema);
